import { z } from "zod";

// Enums
export const itemCategoryEnum = z.enum(["question", "chat"]);
export const questionTypeEnum = z.enum(["text", "slider", "options"]);
export const textSubtypeEnum = z.enum(["short", "long", "date", "email", "number"]);

// Base item schema
export const itemSchema = z.object({
	id: z.string().uuid(),
	eventId: z.string().uuid(),
	category: itemCategoryEnum,
	value: z.string(),
	order: z.number(),
	participantId: z.string().uuid().nullable(),
	questionType: questionTypeEnum.nullable(),
	required: z.boolean(),
	metadata: z.any().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const itemsArraySchema = z.array(itemSchema);

// Input schemas
export const createItemSchema = z.object({
	eventId: z.string().uuid(),
	category: itemCategoryEnum,
	value: z.string().min(1, "Value is required"),
	questionType: questionTypeEnum.optional(),
	required: z.boolean().default(false),
	metadata: z.any().optional(),
	order: z.number().optional(),
	participantId: z.string().uuid().optional(),
});

export const listItemsByEventSchema = z.object({
	eventId: z.string().uuid(),
});

export const getItemSchema = z.object({
	itemId: z.string().uuid(),
});

export const updateItemSchema = z.object({
	itemId: z.string().uuid(),
	data: z.object({
		value: z.string().min(1).optional(),
		order: z.number().optional(),
		questionType: questionTypeEnum.optional(),
		required: z.boolean().optional(),
		metadata: z.any().optional(),
	}),
});

export const reorderItemSchema = z.object({
	itemId: z.string().uuid(),
	newOrder: z.number(),
});

export const itemIdSchema = z.object({
	itemId: z.string().uuid(),
});

export const bulkCreateItemsSchema = z.object({
	eventId: z.string().uuid(),
	items: z
		.array(
			z.object({
				category: itemCategoryEnum,
				value: z.string().min(1, "Value is required"),
				questionType: questionTypeEnum.optional(),
				required: z.boolean().default(false),
				metadata: z.any().optional(),
				order: z.number().optional(),
			}),
		)
		.min(1, "At least one item is required"),
});

// Type exports
export type ItemSchema = z.infer<typeof itemSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>["data"];
export type ItemCategory = z.infer<typeof itemCategoryEnum>;
export type QuestionType = z.infer<typeof questionTypeEnum>;
export type TextSubtype = z.infer<typeof textSubtypeEnum>;
export type BulkItemData = z.infer<typeof bulkCreateItemsSchema>["items"][number];
