import { z } from "zod";

// ============================================================================
// Form State Schemas
// ============================================================================

export const createStateSchema = z.object({
	eventId: z.string().uuid(),
	externalUserId: z.string().min(1).max(255),
	metadata: z.record(z.string(), z.any()).optional(),
	expiresIn: z.number().int().min(60).max(3600).optional().default(900), // 1 min to 1 hour, default 15 min
});

export const validateStateSchema = z.object({
	eventId: z.string().uuid(),
	stateToken: z.string(),
});

export const stateGeneratedSchema = z.object({
	stateToken: z.string(),
	formUrl: z.string(),
	expiresAt: z.date(),
});

export const stateValidationSchema = z.object({
	valid: z.boolean(),
	stateId: z.string().uuid().optional(),
	externalUserId: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	expiresAt: z.date().optional(),
	used: z.boolean().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type ValidateStateInput = z.infer<typeof validateStateSchema>;
export type StateGenerated = z.infer<typeof stateGeneratedSchema>;
export type StateValidation = z.infer<typeof stateValidationSchema>;
