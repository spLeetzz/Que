import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, responses, answers, participants, items } from "@repo/database/schema";
import { eq, and, isNull, ne, count, desc } from "drizzle-orm";
import { appEmitter } from "../utils/emitter";

import type { CreateResponseInput } from "../schema";

type User = {
	id: string;
	name: string;
	email: string;
	isAnonymous?: boolean | null;
};

// ============================================================================
// Helper Functions
// ============================================================================

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

async function getResponseOrThrow(responseId: string) {
	const [response] = await db
		.select()
		.from(responses)
		.where(eq(responses.id, responseId))
		.limit(1);

	if (!response) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
	}

	return response;
}

function validateEventCreator(eventCreatorId: string, userId: string): void {
	if (eventCreatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to perform this action",
		});
	}
}

async function validateEventAccess(eventId: string, userId: string | null) {
	const event = await getEventOrThrow(eventId);

	// Public events are accessible to everyone
	if (event.visibility === "public") {
		return event;
	}

	// Private events require authentication
	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required to access this event",
		});
	}

	// Creator always has access
	if (event.creatorId === userId) {
		return event;
	}

	// Check if user is a participant
	const [participant] = await db
		.select()
		.from(participants)
		.where(and(eq(participants.eventId, eventId), eq(participants.userId, userId)))
		.limit(1);

	if (!participant) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this event",
		});
	}

	return event;
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function createResponse(
	data: CreateResponseInput,
	user: User | null,
	ipHash?: string,
	userAgent?: string,
) {
	const event = await getEventOrThrow(data.eventId);

	// Validate all items exist and belong to this event
	const itemIds = data.answers.map((a) => a.itemId);
	const eventItems = await db
		.select()
		.from(items)
		.where(and(eq(items.eventId, data.eventId)));

	const validItemIds = new Set(eventItems.map((i) => i.id));
	const invalidItems = itemIds.filter((id) => !validItemIds.has(id));

	if (invalidItems.length > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid item IDs: ${invalidItems.join(", ")}`,
		});
	}

	// Check required items
	const requiredItems = eventItems.filter((i) => i.required && i.category === "question");
	const answeredItemIds = new Set(itemIds);
	const missingRequired = requiredItems.filter((i) => !answeredItemIds.has(i.id));

	if (missingRequired.length > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Missing required items: ${missingRequired.map((i) => i.value).join(", ")}`,
		});
	}

	// Get or create participant
	let participantId = data.participantId ?? null;

	if (user && !user.isAnonymous) {
		const [existingParticipant] = await db
			.select()
			.from(participants)
			.where(and(eq(participants.eventId, data.eventId), eq(participants.userId, user.id)))
			.limit(1);

		if (existingParticipant) {
			participantId = existingParticipant.id;
		} else {
			// Create participant if doesn't exist
			const [newParticipant] = await db
				.insert(participants)
				.values({
					eventId: data.eventId,
					userId: user.id,
					alias: user.name || user.email || "Anonymous",
					joinedAt: new Date(),
				})
				.returning();

			participantId = newParticipant?.id ?? null;
		}
	}

	// Check if multiple responses are allowed
	if (!event.multipleResponses && participantId) {
		const [existingResponse] = await db
			.select()
			.from(responses)
			.where(and(eq(responses.eventId, data.eventId), eq(responses.participantId, participantId)))
			.limit(1);

		if (existingResponse) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "You have already submitted a response to this event",
			});
		}
	}

	const resultResponse = await db.transaction(async (tx) => {
		// Create response
		const [response] = await tx
			.insert(responses)
			.values({
				eventId: data.eventId,
				participantId,
				ipHash: ipHash ?? null,
				userAgent: userAgent ?? null,
				submittedAt: new Date(),
			})
			.returning();

		if (!response) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create response",
			});
		}

		// Create answers
		for (const answerData of data.answers) {
			await tx.insert(answers).values({
				responseId: response.id,
				participantId: participantId!,
				itemId: answerData.itemId,
				value: answerData.value,
			});
		}

		// Update participant submitted timestamp
		if (participantId) {
			await tx
				.update(participants)
				.set({ submittedAt: new Date() })
				.where(eq(participants.id, participantId));
		}

		return response;
	});

	appEmitter.emit("response:created", {
		eventId: resultResponse.eventId,
		responseId: resultResponse.id,
		participantId,
	});

	return resultResponse;
}

export async function listResponsesByEvent(
	eventId: string,
	userId: string | null,
	page: number,
	pageSize: number,
) {
	const event = await getEventOrThrow(eventId);

	// Only event creator can view responses (unless result visibility is "all")
	if (event.resultVisibility === "creator_only" && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the event creator can view responses",
		});
	}

	const offset = (page - 1) * pageSize;

	const [eventResponses, [totalResult]] = await Promise.all([
		db
			.select()
			.from(responses)
			.where(eq(responses.eventId, eventId))
			.orderBy(desc(responses.submittedAt))
			.limit(pageSize)
			.offset(offset),
		db.select({ total: count() }).from(responses).where(eq(responses.eventId, eventId)),
	]);

	const total = totalResult?.total ?? 0;

	return {
		responses: eventResponses,
		pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
	};
}

export async function getResponseById(responseId: string, userId: string | null) {
	const response = await getResponseOrThrow(responseId);
	const event = await getEventOrThrow(response.eventId);

	// Only event creator or the respondent can view a specific response
	if (event.resultVisibility === "creator_only" && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the event creator can view responses",
		});
	}

	return response;
}

export async function deleteResponse(responseId: string, userId: string) {
	const response = await getResponseOrThrow(responseId);
	const event = await getEventOrThrow(response.eventId);

	// Only event creator can delete responses
	validateEventCreator(event.creatorId, userId);

	await db.delete(responses).where(eq(responses.id, responseId));

	return { success: true, message: "Response deleted successfully" };
}
