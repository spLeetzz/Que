import { z } from "zod";
import { preprocessNumber, paginationSchema } from "../../shared/schema-utils";

// Base response schema
export const responseSchema = z.object({
	id: z.string().uuid(),
	eventId: z.string().uuid(),
	participantId: z.string().uuid().nullable(),
	ipHash: z.string().nullable(),
	userAgent: z.string().nullable(),
	submittedAt: z.date(),
});

export const responsesArraySchema = z.array(responseSchema);

// Input schemas
export const createResponseSchema = z.object({
	eventId: z.string().uuid(),
	participantId: z.string().uuid().optional(),
	answers: z
		.array(
			z.object({
				itemId: z.string().uuid(),
				value: z.array(z.string()),
			}),
		)
		.min(1, "At least one answer is required"),
});

export const listResponsesByEventSchema = z.object({
	eventId: z.string().uuid(),
	page: z.preprocess(preprocessNumber, z.number().int().min(1).default(1)),
	pageSize: z.preprocess(preprocessNumber, z.number().int().min(1).max(100).default(20)),
});

export const getResponseSchema = z.object({
	responseId: z.string().uuid(),
});

export const responseIdSchema = z.object({
	responseId: z.string().uuid(),
});

export const paginatedResponsesSchema = z.object({
	responses: responsesArraySchema,
	pagination: paginationSchema,
});

// Type exports
export type ResponseSchema = z.infer<typeof responseSchema>;
export type CreateResponseInput = z.infer<typeof createResponseSchema>;
export type PaginatedResponsesSchema = z.infer<typeof paginatedResponsesSchema>;
