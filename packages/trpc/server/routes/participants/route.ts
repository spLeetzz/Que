import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
	createParticipantSchema,
	listParticipantsByEventSchema,
	getParticipantSchema,
	updateParticipantSchema,
	participantIdSchema,
	participantSchema,
	participantsArraySchema,
	deleteResponseSchema,
} from "../../schema";
import {
	createParticipant,
	listParticipantsByEvent,
	getParticipantById,
	updateParticipant,
	deleteParticipant,
} from "../../services/participant.service";

export const participantsRouter = router({
	// POST /participants
	create: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/participants",
				tags: ["participants"],
				summary: "Create a new participant (join an event)",
			},
		})
		.input(createParticipantSchema)
		.output(participantSchema)
		.mutation(async ({ input, ctx }) => {
			return createParticipant(input, ctx.user ?? null);
		}),

	// GET /participants/event/{eventId}
	listByEvent: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/participants/event/{eventId}",
				tags: ["participants"],
				summary: "List all participants for an event",
			},
		})
		.input(listParticipantsByEventSchema)
		.output(participantsArraySchema)
		.query(async ({ input, ctx }) => {
			return listParticipantsByEvent(input.eventId, ctx.user?.id ?? null);
		}),

	// GET /participants/{participantId}
	getById: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/participants/{participantId}",
				tags: ["participants"],
				summary: "Get participant by ID",
			},
		})
		.input(getParticipantSchema)
		.output(participantSchema)
		.query(async ({ input, ctx }) => {
			return getParticipantById(input.participantId, ctx.user?.id ?? null);
		}),

	// PATCH /participants/{participantId}
	update: publicProcedure
		.meta({
			openapi: {
				method: "PATCH",
				path: "/participants/{participantId}",
				tags: ["participants"],
				summary: "Update participant details",
			},
		})
		.input(updateParticipantSchema)
		.output(participantSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return updateParticipant(input.participantId, input.data, ctx.user.id);
		}),

	// DELETE /participants/{participantId}
	delete: publicProcedure
		.meta({
			openapi: {
				method: "DELETE",
				path: "/participants/{participantId}",
				tags: ["participants"],
				summary: "Delete a participant",
			},
		})
		.input(participantIdSchema)
		.output(deleteResponseSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return deleteParticipant(input.participantId, ctx.user.id);
		}),
});
