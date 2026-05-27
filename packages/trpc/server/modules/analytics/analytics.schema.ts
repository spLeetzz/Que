import { z } from "zod";

export const getAnalyticsSchema = z.object({
	eventId: z.string().uuid(),
});

export const exportFormatSchema = z.enum(["responses", "questions", "individual", "full"]);

export const exportAnalyticsSchema = z.object({
	eventId: z.string().uuid(),
	format: exportFormatSchema,
});

export type GetAnalyticsInput = z.infer<typeof getAnalyticsSchema>;
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
