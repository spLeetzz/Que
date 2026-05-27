import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, participants } from "@repo/database/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { appEmitter } from "../utils/emitter";

import type { CreateParticipantInput, UpdateParticipantInput } from "../schema";

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

async function getParticipantOrThrow(participantId: string) {
	const [participant] = await db
		.select()
		.from(participants)
		.where(eq(participants.id, participantId))
		.limit(1);

	if (!participant) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
	}

	return participant;
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

export async function createParticipant(data: CreateParticipantInput, user: User | null) {
	const event = await getEventOrThrow(data.eventId);

	// Check if participant already exists for this user
	if (user && !user.isAnonymous) {
		const [existing] = await db
			.select()
			.from(participants)
			.where(and(eq(participants.eventId, data.eventId), eq(participants.userId, user.id)))
			.limit(1);

		if (existing) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "You are already a participant in this event",
			});
		}
	}

	const [participant] = await db
		.insert(participants)
		.values({
			eventId: data.eventId,
			userId: user && !user.isAnonymous ? user.id : null,
			alias: data.alias,
			joinedAt: new Date(),
		})
		.returning();

	if (!participant) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create participant",
		});
	}

	appEmitter.emit("participant:joined", {
		eventId: participant.eventId,
		participant,
	});

	return participant;
}

export async function listParticipantsByEvent(eventId: string, userId: string | null) {
	await validateEventAccess(eventId, userId);

	const eventParticipants = await db
		.select()
		.from(participants)
		.where(eq(participants.eventId, eventId))
		.orderBy(participants.joinedAt);

	return eventParticipants;
}

export async function getParticipantById(participantId: string, userId: string | null) {
	const participant = await getParticipantOrThrow(participantId);
	await validateEventAccess(participant.eventId, userId);

	return participant;
}

export async function updateParticipant(
	participantId: string,
	data: UpdateParticipantInput,
	userId: string,
) {
	const participant = await getParticipantOrThrow(participantId);
	const event = await getEventOrThrow(participant.eventId);

	// Only the participant themselves or event creator can update
	if (participant.userId !== userId && event.creatorId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to update this participant",
		});
	}

	const [updated] = await db
		.update(participants)
		.set(data)
		.where(eq(participants.id, participantId))
		.returning();

	if (!updated) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to update participant",
		});
	}

	return updated;
}

export async function deleteParticipant(participantId: string, userId: string) {
	const participant = await getParticipantOrThrow(participantId);
	const event = await getEventOrThrow(participant.eventId);

	// Only event creator can delete participants
	validateEventCreator(event.creatorId, userId);

	await db.delete(participants).where(eq(participants.id, participantId));

	return { success: true, message: "Participant deleted successfully" };
}
