import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events, items, participants } from "@repo/database/schema";
import { eq, and, isNull, ne, desc, max } from "drizzle-orm";
import { appEmitter } from "../utils/emitter";

import type { CreateItemInput, UpdateItemInput, QuestionType } from "../schema";

type User = {
	id: string;
	name: string;
	email: string;
	isAnonymous?: boolean | null;
};

// ============================================================================
// Helper Functions - Event and Item Retrieval
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

async function getItemOrThrow(itemId: string) {
	const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

	if (!item) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
	}

	return item;
}

// ============================================================================
// Permission Validation Helpers
// ============================================================================

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

async function validateChatItemOwnership(itemId: string, userId: string) {
	const item = await getItemOrThrow(itemId);
	const event = await getEventOrThrow(item.eventId);

	// Event creator can delete any chat item
	if (event.creatorId === userId) {
		return { item, event };
	}

	// Chat item creator can delete their own chat item
	if (item.category === "chat" && item.participantId) {
		const [participant] = await db
			.select()
			.from(participants)
			.where(eq(participants.id, item.participantId))
			.limit(1);

		if (participant && participant.userId === userId) {
			return { item, event };
		}
	}

	throw new TRPCError({
		code: "FORBIDDEN",
		message: "You are not authorized to delete this item",
	});
}

// ============================================================================
// Metadata Validation Helpers
// ============================================================================

function validateTextMetadata(metadata: any): void {
	if (!metadata || typeof metadata !== "object") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Text question requires metadata with subtype field",
		});
	}

	const validSubtypes = ["short", "long", "date", "email", "number"];
	if (!validSubtypes.includes(metadata.subtype)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid text subtype. Must be one of: ${validSubtypes.join(", ")}`,
		});
	}
}

function validateSliderMetadata(metadata: any): void {
	if (!metadata || typeof metadata !== "object") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Slider question requires metadata with min and max fields",
		});
	}

	if (typeof metadata.min !== "number" || typeof metadata.max !== "number") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Slider metadata must have numeric min and max values",
		});
	}

	if (metadata.min >= metadata.max) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Slider min must be less than max",
		});
	}
}

function validateOptionsMetadata(metadata: any): void {
	if (!metadata || typeof metadata !== "object") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Options question requires metadata with multiple and choices fields",
		});
	}

	if (typeof metadata.multiple !== "boolean") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Options metadata must have a boolean multiple field",
		});
	}

	if (!Array.isArray(metadata.choices) || metadata.choices.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Options metadata must have a non-empty choices array",
		});
	}
}

function validateMetadataForQuestionType(questionType: QuestionType, metadata: any): void {
	if (questionType === "text") {
		validateTextMetadata(metadata);
	} else if (questionType === "slider") {
		validateSliderMetadata(metadata);
	} else if (questionType === "options") {
		validateOptionsMetadata(metadata);
	}
}

// ============================================================================
// Order Calculation Helper
// ============================================================================

async function calculateNextOrder(eventId: string): Promise<number> {
	const result = await db
		.select({ maxOrder: max(items.order) })
		.from(items)
		.where(eq(items.eventId, eventId));

	const maxOrder = result[0]?.maxOrder;
	return maxOrder !== null && maxOrder !== undefined ? maxOrder + 1.0 : 1.0;
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function createItem(data: CreateItemInput, user: User) {
	const event = await getEventOrThrow(data.eventId);
	validateEventCreator(event.creatorId, user.id);

	// Validate chat items can only be in banter events
	if (data.category === "chat" && event.type !== "banter") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Chat items can only be created in banter events",
		});
	}

	// Validate metadata for question items
	if (data.category === "question" && data.questionType && data.metadata) {
		validateMetadataForQuestionType(data.questionType, data.metadata);
	}

	// Calculate order if not provided
	const order = data.order ?? (await calculateNextOrder(data.eventId));

	// Handle participant for chat items
	let participantId = data.participantId ?? null;
	if (data.category === "chat") {
		// Ensure participant exists or create one
		const [participant] = await db
			.select()
			.from(participants)
			.where(and(eq(participants.eventId, data.eventId), eq(participants.userId, user.id)))
			.limit(1);

		if (!participant) {
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
		} else {
			participantId = participant.id;
		}
	}

	const [item] = await db
		.insert(items)
		.values({
			eventId: data.eventId,
			category: data.category,
			value: data.value,
			questionType: data.questionType ?? null,
			required: data.required ?? false,
			metadata: data.metadata ?? null,
			order,
			participantId,
		})
		.returning();

	if (!item) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create item",
		});
	}

	appEmitter.emit("item:created", { eventId: item.eventId, item });

	return item;
}

export async function listItemsByEvent(eventId: string, userId: string | null) {
	await validateEventAccess(eventId, userId);

	const eventItems = await db
		.select()
		.from(items)
		.where(eq(items.eventId, eventId))
		.orderBy(items.order);

	return eventItems;
}

export async function getItemById(itemId: string, userId: string | null) {
	const item = await getItemOrThrow(itemId);
	await validateEventAccess(item.eventId, userId);

	return item;
}

export async function updateItem(itemId: string, data: UpdateItemInput, userId: string) {
	const item = await getItemOrThrow(itemId);
	const event = await getEventOrThrow(item.eventId);

	validateEventCreator(event.creatorId, userId);

	// Validate metadata if questionType is being updated
	if (data.questionType && data.metadata) {
		validateMetadataForQuestionType(data.questionType, data.metadata);
	}

	const [updated] = await db
		.update(items)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(items.id, itemId))
		.returning();

	if (!updated) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to update item",
		});
	}

	appEmitter.emit("item:updated", { eventId: updated.eventId, item: updated });

	return updated;
}

export async function reorderItem(itemId: string, newOrder: number, userId: string) {
	const item = await getItemOrThrow(itemId);
	const event = await getEventOrThrow(item.eventId);

	validateEventCreator(event.creatorId, userId);

	const [updated] = await db
		.update(items)
		.set({
			order: newOrder,
			updatedAt: new Date(),
		})
		.where(eq(items.id, itemId))
		.returning();

	if (!updated) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to reorder item",
		});
	}

	appEmitter.emit("item:updated", { eventId: updated.eventId, item: updated });

	return updated;
}

export async function deleteItem(itemId: string, userId: string) {
	const item = await getItemOrThrow(itemId);

	// For question items, only event creator can delete
	if (item.category === "question") {
		const event = await getEventOrThrow(item.eventId);
		validateEventCreator(event.creatorId, userId);
	} else {
		// For chat items, event creator or chat item creator can delete
		await validateChatItemOwnership(itemId, userId);
	}

	await db.delete(items).where(eq(items.id, itemId));

	appEmitter.emit("item:deleted", { eventId: item.eventId, itemId });

	return { success: true, message: "Item deleted successfully" };
}

export async function bulkCreateItems(
	eventId: string,
	itemsData: Array<Omit<CreateItemInput, "eventId">>,
	user: User,
) {
	const event = await getEventOrThrow(eventId);
	validateEventCreator(event.creatorId, user.id);

	return db.transaction(async (tx) => {
		const maxOrder = await calculateNextOrder(eventId);
		let currentOrder = maxOrder;

		const createdItems = [];

		for (const itemData of itemsData) {
			// Validate metadata if provided
			if (itemData.category === "question" && itemData.questionType && itemData.metadata) {
				validateMetadataForQuestionType(itemData.questionType, itemData.metadata);
			}

			// Validate chat items can only be in banter events
			if (itemData.category === "chat" && event.type !== "banter") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Chat items can only be created in banter events",
				});
			}

			const order = itemData.order ?? currentOrder;
			if (!itemData.order) {
				currentOrder += 1.0;
			}

			const [item] = await tx
				.insert(items)
				.values({
					eventId,
					category: itemData.category,
					value: itemData.value,
					questionType: itemData.questionType ?? null,
					required: itemData.required ?? false,
					metadata: itemData.metadata ?? null,
					order,
					participantId: null, // Bulk create doesn't support chat items with participants
				})
				.returning();

			if (!item) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create item in bulk operation",
				});
			}

			createdItems.push(item);
		}

		return createdItems;
	});
}
