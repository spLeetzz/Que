import { z } from "zod";

// ============================================================================
// Hidden Field Schema
// ============================================================================

export const hiddenFieldSchema = z.object({
	key: z.string().min(1).max(100),
	required: z.boolean().default(false),
	type: z.enum(["string", "number", "boolean"]).default("string"),
});

// ============================================================================
// Service Form Schemas
// ============================================================================

export const createServiceFormSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().max(1000).optional(),
	type: z.enum(["form", "poll"]), // Banter not allowed in service mode
	redirectUrl: z.string().url(),
	hiddenFields: z.array(hiddenFieldSchema).min(1), // At least one hidden field required
	questions: z
		.array(
			z.object({
				value: z.string().min(1),
				questionType: z.enum(["text", "slider", "options"]),
				required: z.boolean().default(false),
				metadata: z.any().optional(),
				order: z.number().optional(),
			})
		)
		.optional(),
});

export const updateServiceFormSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(1000).optional(),
	redirectUrl: z.string().url().optional(),
	hiddenFields: z.array(hiddenFieldSchema).optional(),
});

export const getServiceFormSchema = z.object({
	id: z.string().uuid(),
});

export const deleteServiceFormSchema = z.object({
	id: z.string().uuid(),
});

export const listServiceFormsSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(50),
});

export const serviceFormSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	description: z.string().nullable(),
	type: z.enum(["form", "poll"]),
	mode: z.literal("service"),
	redirectUrl: z.string(),
	hiddenFields: z.array(hiddenFieldSchema),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type HiddenField = z.infer<typeof hiddenFieldSchema>;
export type CreateServiceFormInput = z.infer<typeof createServiceFormSchema>;
export type UpdateServiceFormInput = z.infer<typeof updateServiceFormSchema>;
export type GetServiceFormInput = z.infer<typeof getServiceFormSchema>;
export type DeleteServiceFormInput = z.infer<typeof deleteServiceFormSchema>;
export type ListServiceFormsInput = z.infer<typeof listServiceFormsSchema>;
export type ServiceForm = z.infer<typeof serviceFormSchema>;
