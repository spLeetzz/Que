import { z } from "zod";
import { preprocessQueryParam, preprocessNumber, paginationSchema } from "../../shared/schema-utils";

// Enums
export const eventTypeEnum = z.enum(["form", "poll", "banter"]);
export const eventStatusEnum = z.enum(["draft", "published", "archived", "completed", "deleted"]);
export const visibilityEnum = z.enum(["public", "private"]);
export const resultVisibilityEnum = z.enum(["all", "creator_only"]);
export const eventModeEnum = z.enum(["standard", "service"]);

// Base event schema
export const eventSchema = z.object({
	id: z.string().uuid(),
	creatorId: z.string(),
	type: eventTypeEnum,
	status: eventStatusEnum,
	visibility: visibilityEnum,
	resultVisibility: resultVisibilityEnum,
	mode: eventModeEnum,
	title: z.string(),
	description: z.string().nullable(),
	slug: z.string().nullable(),
	authRequired: z.boolean(),
	multipleResponses: z.boolean(),
	receiveEmails: z.boolean(),
	redirectUrl: z.string().nullable().optional(),
	theme: z.string().nullable().optional(),
	expiresAt: z.date().nullable(),
	deletedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const eventWithResponseCountSchema = eventSchema.extend({
	responseCount: z.number(),
});

export const paginatedEventsSchema = z.object({
	events: z.array(eventWithResponseCountSchema),
	pagination: paginationSchema,
});

// Input schemas
export const createEventSchema = z.object({
	type: eventTypeEnum,
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	slug: z.string().nullable().optional(),
	visibility: visibilityEnum.default("public"),
	resultVisibility: resultVisibilityEnum.default("all"),
	mode: eventModeEnum.default("standard"),
	authRequired: z.boolean().default(false),
	multipleResponses: z.boolean().default(false),
	receiveEmails: z.boolean().default(false),
	redirectUrl: z.string().url().nullable().optional(),
	theme: z.string().nullable().optional(),
	expiresAt: z.coerce.date().nullable().optional(),
});

export const getEventSchema = z.object({
	identifier: z.string().min(1),
});

export const listUserEventsSchema = z.object({
	type: z.preprocess(preprocessQueryParam, eventTypeEnum.optional()),
	status: z.preprocess(preprocessQueryParam, eventStatusEnum.optional()),
	page: z.preprocess(preprocessNumber, z.number().int().min(1).default(1)),
	pageSize: z.preprocess(preprocessNumber, z.number().int().min(1).max(100).default(20)),
});

export const listPublicEventsSchema = z.object({
	type: z.preprocess(preprocessQueryParam, eventTypeEnum.optional()),
	page: z.preprocess(preprocessNumber, z.number().int().min(1).default(1)),
	pageSize: z.preprocess(preprocessNumber, z.number().int().min(1).max(100).default(20)),
});

export const updateEventSchema = z.object({
	eventId: z.string().uuid(),
	data: z.object({
		title: z.string().min(1).optional(),
		description: z.string().optional(),
		slug: z.string().nullable().optional(),
		visibility: visibilityEnum.optional(),
		resultVisibility: resultVisibilityEnum.optional(),
		mode: eventModeEnum.optional(),
		authRequired: z.boolean().optional(),
		multipleResponses: z.boolean().optional(),
		receiveEmails: z.boolean().optional(),
		redirectUrl: z.string().url().nullable().optional(),
		theme: z.string().nullable().optional(),
		expiresAt: z.coerce.date().nullable().optional(),
	}),
});

export const eventIdSchema = z.object({
	eventId: z.string().uuid(),
});

// Type exports
export type EventSchema = z.infer<typeof eventSchema>;
export type PaginatedEventsSchema = z.infer<typeof paginatedEventsSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>["data"];
export type EventType = z.infer<typeof eventTypeEnum>;
export type EventStatus = z.infer<typeof eventStatusEnum>;
