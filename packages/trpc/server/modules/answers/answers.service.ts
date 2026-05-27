import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, responses, answers, items } from "@repo/database/schema";
import { eq, and, isNull, ne } from "drizzle-orm";

// ============================================================================
// Helper Functions
// ============================================================================

async function getAnswerOrThrow(answerId: string) {
	const [answer] = await db.select().from(answers).where(eq(answers.id, answerId)).limit(1);

	if (!answer) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Answer not found" });
	}

	return answer;
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

async function getItemOrThrow(itemId: string) {
	const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

	if (!item) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
	}

	return item;
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

function validateEventCreator(eventCreatorId: string, userId: string): void {
	if (eventCreatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to perform this action",
		});
	}
}

// ============================================================================
// Read Operations
// ============================================================================

export async function listAnswersByResponse(responseId: string, userId: string | null) {
	const response = await getResponseOrThrow(responseId);
	const event = await getEventOrThrow(response.eventId);

	// Only event creator can view answers (unless result visibility is "all")
	if (event.resultVisibility === "creator_only" && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the event creator can view answers",
		});
	}

	const responseAnswers = await db
		.select()
		.from(answers)
		.where(eq(answers.responseId, responseId))
		.orderBy(answers.createdAt);

	return responseAnswers;
}

export async function listAnswersByItem(itemId: string, userId: string | null) {
	const item = await getItemOrThrow(itemId);
	const event = await getEventOrThrow(item.eventId);

	// Only event creator can view answers (unless result visibility is "all")
	if (event.resultVisibility === "creator_only" && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the event creator can view answers",
		});
	}

	const itemAnswers = await db
		.select()
		.from(answers)
		.where(eq(answers.itemId, itemId))
		.orderBy(answers.createdAt);

	return itemAnswers;
}

export async function getAnswerById(answerId: string, userId: string | null) {
	const answer = await getAnswerOrThrow(answerId);
	const response = await getResponseOrThrow(answer.responseId);
	const event = await getEventOrThrow(response.eventId);

	// Only event creator can view answers (unless result visibility is "all")
	if (event.resultVisibility === "creator_only" && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only the event creator can view answers",
		});
	}

	return answer;
}
