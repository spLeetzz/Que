import { z } from "zod";

// ============================================================================
// PAT Schemas
// ============================================================================

export const patInfoSchema = z.object({
	id: z.string().uuid(),
	userId: z.string(),
	name: z.string(),
	lastUsedAt: z.date().nullable(),
	createdAt: z.date(),
	expiresAt: z.date().nullable(),
	revokedAt: z.date().nullable(),
});

export const generatePATSchema = z.object({
	name: z.string().min(1).max(100).optional().default("Default PAT"),
});

export const revokePATSchema = z.object({
	id: z.string().uuid().optional(), // If not provided, revokes the active PAT
});

export const patGeneratedSchema = z.object({
	token: z.string(),
	id: z.string().uuid(),
	createdAt: z.date(),
	message: z.string(),
});

export const patRevokedSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export const patStatusSchema = z.object({
	hasActivePAT: z.boolean(),
	createdAt: z.date().nullable(),
	lastUsedAt: z.date().nullable(),
	name: z.string().nullable(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type PATInfo = z.infer<typeof patInfoSchema>;
export type GeneratePATInput = z.infer<typeof generatePATSchema>;
export type RevokePATInput = z.infer<typeof revokePATSchema>;
export type PATGenerated = z.infer<typeof patGeneratedSchema>;
export type PATRevoked = z.infer<typeof patRevokedSchema>;
export type PATStatus = z.infer<typeof patStatusSchema>;
