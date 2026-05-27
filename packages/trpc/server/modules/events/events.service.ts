import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, participants, responses } from "@repo/database/schema";
import { eq, and, ne, isNull, or, gt, desc, sql, count } from "drizzle-orm";

import type { CreateEventInput, UpdateEventInput, EventType, EventStatus } from "./events.schema";
import type { User } from "../../shared/types";

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
	draft: ["published", "deleted"],
	published: ["draft", "archived", "completed", "deleted"],
	archived: ["published", "deleted"],
	completed: ["archived", "deleted"],
	deleted: [],
};

function validateStatusTransition(current: EventStatus, target: EventStatus): void {
	if (!VALID_TRANSITIONS[current].includes(target)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid status transition from ${current} to ${target}`,
		});
	}
}

// Only called when slug is non-null; null slugs never conflict (Postgres allows multiple NULLs in unique index)
async function validateSlugUniqueness(slug: string, excludeEventId?: string): Promise<void> {
	const existing = await db
		.select({ id: events.id })
		.from(events)
		.where(and(eq(events.slug, slug), isNull(events.deletedAt)))
		.limit(1);

	const conflict = existing.filter((e) => e.id !== excludeEventId);
	if (conflict.length > 0) {
		throw new TRPCError({ code: "CONFLICT", message: "Slug already exists" });
	}
}

function validateReceiveEmails(receiveEmails: boolean, eventType: EventType): void {
	if (receiveEmails && eventType !== "form") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "receiveEmails can only be enabled for form events",
		});
	}
}

function validateCreator(eventCreatorId: string, userId: string): void {
	if (eventCreatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to perform this action",
		});
	}
}

async function getEventOrThrow(eventId: string) {
	const [event] = await db
		.select()
		.from(events)
		.where(and(eq(events.id, eventId), isNull(events.deletedAt), ne(events.status, "deleted")))
		.limit(1);

	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}

	return event;
}

export async function createEvent(data: CreateEventInput, creator: User) {
	const { slug, receiveEmails = false, ...rest } = data;

	validateReceiveEmails(receiveEmails, data.type);

	if (slug) {
		await validateSlugUniqueness(slug);
	}

	return db.transaction(async (tx) => {
		const result = await tx
			.insert(events)
			.values({
				...rest,
				creatorId: creator.id,
				slug: slug ?? null,
				status: "draft",
				receiveEmails,
			})
			.returning();

		const event = result[0];
		if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create event" });

		if (event.type === "banter") {
			await tx.insert(participants).values({
				eventId: event.id,
				userId: creator.id,
				alias: creator.name || creator.email || "Anonymous",
				joinedAt: new Date(),
			});
		}

		return event;
	});
}

export async function getEventByIdOrSlug(identifier: string, requesterId: string | null) {
	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

	const [event] = await db
		.select()
		.from(events)
		.where(
			and(
				isUuid ? eq(events.id, identifier) : eq(events.slug, identifier),
				ne(events.status, "deleted"),
				isNull(events.deletedAt),
			),
		)
		.limit(1);

	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}

	// Draft events are only visible to their creator
	if (event.status === "draft" && event.creatorId !== requesterId) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}

	return event;
}

export async function listUserEvents(
	userId: string,
	filters: { type?: EventType; status?: EventStatus; page: number; pageSize: number },
) {
	const { type, status, page, pageSize } = filters;
	const offset = (page - 1) * pageSize;

	const conditions = [
		eq(events.creatorId, userId),
		...(type ? [eq(events.type, type)] : []),
		...(status ? [eq(events.status, status)] : []),
	];

	const [userEvents, [totalResult]] = await Promise.all([
		db
			.select({
				id: events.id,
				creatorId: events.creatorId,
				type: events.type,
				status: events.status,
				visibility: events.visibility,
				resultVisibility: events.resultVisibility,
				title: events.title,
				description: events.description,
				slug: events.slug,
				authRequired: events.authRequired,
				multipleResponses: events.multipleResponses,
				receiveEmails: events.receiveEmails,
				theme: events.theme,
				expiresAt: events.expiresAt,
				deletedAt: events.deletedAt,
				createdAt: events.createdAt,
				updatedAt: events.updatedAt,
				responseCount: sql<number>`cast(count(${responses.id}) as int)`,
			})
			.from(events)
			.leftJoin(responses, eq(responses.eventId, events.id))
			.where(and(...conditions))
			.groupBy(events.id)
			.orderBy(desc(events.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ total: count() }).from(events).where(and(...conditions)),
	]);

	const total = totalResult?.total ?? 0;
	return {
		events: userEvents,
		pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
	};
}

export async function listPublicEvents(filters: {
	type?: EventType;
	page: number;
	pageSize: number;
}) {
	const { type, page, pageSize } = filters;
	const offset = (page - 1) * pageSize;
	const now = new Date();

	const conditions = [
		eq(events.status, "published"),
		eq(events.visibility, "public"),
		isNull(events.deletedAt),
		or(isNull(events.expiresAt), gt(events.expiresAt, now))!,
		...(type ? [eq(events.type, type)] : []),
	];

	const [publicEvents, [totalResult]] = await Promise.all([
		db
			.select({
				id: events.id,
				creatorId: events.creatorId,
				type: events.type,
				status: events.status,
				visibility: events.visibility,
				resultVisibility: events.resultVisibility,
				title: events.title,
				description: events.description,
				slug: events.slug,
				authRequired: events.authRequired,
				multipleResponses: events.multipleResponses,
				receiveEmails: events.receiveEmails,
				theme: events.theme,
				expiresAt: events.expiresAt,
				deletedAt: events.deletedAt,
				createdAt: events.createdAt,
				updatedAt: events.updatedAt,
				responseCount: sql<number>`cast(count(${responses.id}) as int)`,
			})
			.from(events)
			.leftJoin(responses, eq(responses.eventId, events.id))
			.where(and(...conditions))
			.groupBy(events.id)
			.orderBy(desc(events.createdAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ total: count() }).from(events).where(and(...conditions)),
	]);

	const total = totalResult?.total ?? 0;
	return {
		events: publicEvents,
		pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
	};
}

export async function updateEvent(eventId: string, data: UpdateEventInput, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);

	if (data.receiveEmails === true) {
		validateReceiveEmails(true, event.type);
	}

	// Only validate uniqueness when slug is non-null and actually changing
	if (data.slug && data.slug !== event.slug) {
		await validateSlugUniqueness(data.slug, eventId);
	}

	const result = await db
		.update(events)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(events.id, eventId))
		.returning();

	const updated = result[0];
	if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed" });
	return updated;
}

export async function publishEvent(eventId: string, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);
	validateStatusTransition(event.status as EventStatus, "published");

	const result = await db
		.update(events)
		.set({ status: "published", updatedAt: new Date() })
		.where(eq(events.id, eventId))
		.returning();

	const updated = result[0];
	if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed" });
	return updated;
}

export async function unpublishEvent(eventId: string, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);
	validateStatusTransition(event.status as EventStatus, "draft");

	const result = await db
		.update(events)
		.set({ status: "draft", updatedAt: new Date() })
		.where(eq(events.id, eventId))
		.returning();

	const updated = result[0];
	if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed" });
	return updated;
}

export async function archiveEvent(eventId: string, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);
	validateStatusTransition(event.status as EventStatus, "archived");

	const result = await db
		.update(events)
		.set({ status: "archived", updatedAt: new Date() })
		.where(eq(events.id, eventId))
		.returning();

	const updated = result[0];
	if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed" });
	return updated;
}

export async function completeEvent(eventId: string, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);
	validateStatusTransition(event.status as EventStatus, "completed");

	const result = await db
		.update(events)
		.set({ status: "completed", updatedAt: new Date() })
		.where(eq(events.id, eventId))
		.returning();

	const updated = result[0];
	if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed" });
	return updated;
}

export async function deleteEvent(eventId: string, userId: string) {
	const event = await getEventOrThrow(eventId);

	validateCreator(event.creatorId, userId);

	// Set slug to null — frees the unique value for reuse (Postgres allows multiple NULLs in unique index)
	await db
		.update(events)
		.set({
			status: "deleted",
			deletedAt: new Date(),
			slug: null,
			updatedAt: new Date(),
		})
		.where(eq(events.id, eventId));

	return { success: true, message: "Event deleted successfully" };
}

export async function duplicateEvent(eventId: string, newCreator: User) {
	const [original] = await db
		.select()
		.from(events)
		.where(and(eq(events.id, eventId), isNull(events.deletedAt), ne(events.status, "deleted")))
		.limit(1);

	if (!original) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}

	return db.transaction(async (tx) => {
		const now = new Date();

		const insertResult = await tx
			.insert(events)
			.values({
				type: original.type,
				title: original.title,
				description: original.description,
				visibility: original.visibility,
				resultVisibility: original.resultVisibility,
				authRequired: original.authRequired,
				multipleResponses: original.multipleResponses,
				receiveEmails: original.receiveEmails,
				theme: original.theme,
				creatorId: newCreator.id,
				status: "draft",
				slug: null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		const newEvent = insertResult[0];
		if (!newEvent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Duplicate failed" });

		if (newEvent.type === "banter") {
			await tx.insert(participants).values({
				eventId: newEvent.id,
				userId: newCreator.id,
				alias: newCreator.name || newCreator.email || "Anonymous",
				joinedAt: now,
			});
		}

		return newEvent;
	});
}
