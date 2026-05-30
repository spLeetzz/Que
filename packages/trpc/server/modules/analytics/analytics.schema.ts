import { z } from "zod";

export const getAnalyticsSchema = z.object({
	eventId: z.string().uuid(),
});

export const getIndividualResponsesSchema = z.object({
	eventId: z.string().uuid(),
	page: z.number().int().positive().default(1),
	pageSize: z.number().int().positive().max(100).default(50),
});

export const exportFormatSchema = z.enum(["responses", "questions", "individual", "full"]);

export const exportAnalyticsSchema = z.object({
	eventId: z.string().uuid(),
	format: exportFormatSchema,
});

export type GetAnalyticsInput = z.infer<typeof getAnalyticsSchema>;
export type GetIndividualResponsesInput = z.infer<typeof getIndividualResponsesSchema>;
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
