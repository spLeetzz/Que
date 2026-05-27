import { z } from "zod";

// Base answer schema
export const answerSchema = z.object({
	id: z.string().uuid(),
	responseId: z.string().uuid(),
	participantId: z.string().uuid().nullable(),
	itemId: z.string().uuid(),
	value: z.array(z.string()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const answersArraySchema = z.array(answerSchema);

// Input schemas
export const listAnswersByResponseSchema = z.object({
	responseId: z.string().uuid(),
});

export const listAnswersByItemSchema = z.object({
	itemId: z.string().uuid(),
});

export const getAnswerSchema = z.object({
	answerId: z.string().uuid(),
});

// Type exports
export type AnswerSchema = z.infer<typeof answerSchema>;
