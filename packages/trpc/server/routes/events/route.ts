import { router, publicProcedure } from "../../trpc";
import {
	createEventSchema,
	getEventSchema,
	listUserEventsSchema,
	listPublicEventsSchema,
	updateEventSchema,
	eventIdSchema,
	eventSchema,
	paginatedEventsSchema,
	deleteResponseSchema,
} from "../../schema";
import {
	createEvent,
	getEventByIdOrSlug,
	listUserEvents,
	listPublicEvents,
	updateEvent,
	publishEvent,
	unpublishEvent,
	archiveEvent,
	completeEvent,
	deleteEvent,
	duplicateEvent,
} from "../../services/event.service";
import { TRPCError } from "@trpc/server";

export const eventsRouter = router({
	// POST /events
	create: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events",
				tags: ["events"],
				summary: "Create a new event",
			},
		})
		.input(createEventSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return createEvent(input, ctx.user);
		}),

	// GET /events/mine
	listMine: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/events/mine",
				tags: ["events"],
				summary: "List events created by current user",
			},
		})
		.input(listUserEventsSchema)
		.output(paginatedEventsSchema)
		.query(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return listUserEvents(ctx.user.id, input);
		}),

	// GET /events/public
	listPublic: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/events/public",
				tags: ["events"],
				summary: "List public published events",
			},
		})
		.input(listPublicEventsSchema)
		.output(paginatedEventsSchema)
		.query(async ({ input }) => {
			return listPublicEvents(input);
		}),

	// GET /events/{identifier}
	getByIdOrSlug: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/events/{identifier}",
				tags: ["events"],
				summary: "Get event by ID or slug",
			},
		})
		.input(getEventSchema)
		.output(eventSchema)
		.query(async ({ input, ctx }) => {
			return getEventByIdOrSlug(input.identifier, ctx.user?.id ?? null);
		}),

	// PATCH /events/{eventId}
	update: publicProcedure
		.meta({
			openapi: {
				method: "PATCH",
				path: "/events/{eventId}",
				tags: ["events"],
				summary: "Update event details",
			},
		})
		.input(updateEventSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return updateEvent(input.eventId, input.data, ctx.user.id);
		}),

	// POST /events/{eventId}/publish
	publish: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events/{eventId}/publish",
				tags: ["events"],
				summary: "Publish a draft event",
			},
		})
		.input(eventIdSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return publishEvent(input.eventId, ctx.user.id);
		}),

	// POST /events/{eventId}/unpublish
	unpublish: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events/{eventId}/unpublish",
				tags: ["events"],
				summary: "Unpublish an event back to draft",
			},
		})
		.input(eventIdSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return unpublishEvent(input.eventId, ctx.user.id);
		}),

	// POST /events/{eventId}/archive
	archive: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events/{eventId}/archive",
				tags: ["events"],
				summary: "Archive an event",
			},
		})
		.input(eventIdSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return archiveEvent(input.eventId, ctx.user.id);
		}),

	// POST /events/{eventId}/complete
	complete: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events/{eventId}/complete",
				tags: ["events"],
				summary: "Mark event as completed",
			},
		})
		.input(eventIdSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return completeEvent(input.eventId, ctx.user.id);
		}),

	// DELETE /events/{eventId}
	delete: publicProcedure
		.meta({
			openapi: {
				method: "DELETE",
				path: "/events/{eventId}",
				tags: ["events"],
				summary: "Soft-delete an event",
			},
		})
		.input(eventIdSchema)
		.output(deleteResponseSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return deleteEvent(input.eventId, ctx.user.id);
		}),

	// POST /events/{eventId}/duplicate
	duplicate: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/events/{eventId}/duplicate",
				tags: ["events"],
				summary: "Duplicate an existing event",
			},
		})
		.input(eventIdSchema)
		.output(eventSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return duplicateEvent(input.eventId, ctx.user);
		}),
});
