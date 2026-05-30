import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, participants, responses } from "@repo/database/schema";
import { eq, and, ne, isNull, or, gt, desc, sql, count } from "drizzle-orm";

import type { CreateEventInput, UpdateEventInput, EventType, EventStatus } from "./events.schema";
import type { User } from "../../shared/types";
import { resolveUniqueSlug, normalizeSlugInput } from "../../utils/slug";
import { validateReceiveEmails, normalizeReceiveEmails } from "../../utils/event-settings";

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
	const authRequired = rest.authRequired ?? false;
	const effectiveReceiveEmails = normalizeReceiveEmails(receiveEmails, data.type, authRequired);

	validateReceiveEmails(effectiveReceiveEmails, data.type, authRequired);

	const resolvedSlug = await resolveUniqueSlug(slug, data.title);

	return db.transaction(async (tx) => {
		const result = await tx
			.insert(events)
			.values({
				...rest,
				creatorId: creator.id,
				slug: resolvedSlug,
				status: data.type === "banter" ? "published" : "draft",
				receiveEmails: effectiveReceiveEmails,
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

	if (event.status === "draft") {
		if (!requesterId || event.creatorId !== requesterId) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
		}
	}

	if (event.visibility === "private" && event.creatorId !== requesterId) {
		if (!requesterId) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
		}

		if (event.type === "banter") {
			const [participant] = await db
				.select({ id: participants.id })
				.from(participants)
				.where(and(eq(participants.eventId, event.id), eq(participants.userId, requesterId)))
				.limit(1);

			if (!participant) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}
		} else {
			throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
		}
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
				mode: events.mode,
				title: events.title,
				description: events.description,
				slug: events.slug,
				authRequired: events.authRequired,
				multipleResponses: events.multipleResponses,
				receiveEmails: events.receiveEmails,
				redirectUrl: events.redirectUrl,
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
				mode: events.mode,
				title: events.title,
				description: events.description,
				slug: events.slug,
				authRequired: events.authRequired,
				multipleResponses: events.multipleResponses,
				receiveEmails: events.receiveEmails,
				redirectUrl: events.redirectUrl,
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

	const nextAuthRequired = data.authRequired ?? event.authRequired;
	let nextReceiveEmails = data.receiveEmails ?? event.receiveEmails;

	if (event.type === "banter") {
		nextReceiveEmails = false;
	} else if (!nextAuthRequired) {
		nextReceiveEmails = false;
	}

	validateReceiveEmails(nextReceiveEmails, event.type, nextAuthRequired);

	let nextSlug = event.slug;
	if (data.slug !== undefined) {
		const normalized = normalizeSlugInput(data.slug);
		if (normalized && normalized !== event.slug) {
			nextSlug = await resolveUniqueSlug(normalized, data.title ?? event.title, eventId);
		} else if (!normalized && !event.slug) {
			nextSlug = await resolveUniqueSlug(null, data.title ?? event.title, eventId);
		} else if (!normalized) {
			nextSlug = null;
		}
	}

	const result = await db
		.update(events)
		.set({
			...data,
			slug: nextSlug,
			receiveEmails: nextReceiveEmails,
			updatedAt: new Date(),
		})
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
				mode: original.mode,
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
