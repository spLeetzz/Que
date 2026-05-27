import { z } from "zod";

// Base participant schema
export const participantSchema = z.object({
	id: z.string().uuid(),
	eventId: z.string().uuid(),
	userId: z.string().nullable(),
	alias: z.string(),
	lastSeenItemId: z.string().uuid().nullable(),
	submittedAt: z.date().nullable(),
	joinedAt: z.date(),
});

export const participantsArraySchema = z.array(participantSchema);

// Input schemas
export const createParticipantSchema = z.object({
	eventId: z.string().uuid(),
	alias: z.string().min(1, "Alias is required"),
});

export const listParticipantsByEventSchema = z.object({
	eventId: z.string().uuid(),
});

export const getParticipantSchema = z.object({
	participantId: z.string().uuid(),
});

export const updateParticipantSchema = z.object({
	participantId: z.string().uuid(),
	data: z.object({
		alias: z.string().min(1).optional(),
		lastSeenItemId: z.string().uuid().nullable().optional(),
		submittedAt: z.date().nullable().optional(),
	}),
});

export const participantIdSchema = z.object({
	participantId: z.string().uuid(),
});

// Type exports
export type ParticipantSchema = z.infer<typeof participantSchema>;
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>["data"];
