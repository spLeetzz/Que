import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
	createResponseSchema,
	listResponsesByEventSchema,
	getResponseSchema,
	responseIdSchema,
	responseSchema,
	paginatedResponsesSchema,
	deleteResponseSchema,
} from "../../schema";
import {
	createResponse,
	listResponsesByEvent,
	getResponseById,
	deleteResponse,
} from "../../services/response.service";

export const responsesRouter = router({
	// POST /responses
	create: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/responses",
				tags: ["responses"],
				summary: "Submit a response to an event",
			},
		})
		.input(createResponseSchema)
		.output(responseSchema)
		.mutation(async ({ input, ctx }) => {
			// Extract IP and user agent from context if available
			const ipHash = ctx.req?.ip;
			const userAgent = ctx.req?.headers["user-agent"];
			return createResponse(input, ctx.user ?? null, ipHash, userAgent);
		}),

	// GET /responses/event/{eventId}
	listByEvent: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/responses/event/{eventId}",
				tags: ["responses"],
				summary: "List all responses for an event",
			},
		})
		.input(listResponsesByEventSchema)
		.output(paginatedResponsesSchema)
		.query(async ({ input, ctx }) => {
			return listResponsesByEvent(input.eventId, ctx.user?.id ?? null, input.page, input.pageSize);
		}),

	// GET /responses/{responseId}
	getById: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/responses/{responseId}",
				tags: ["responses"],
				summary: "Get response by ID",
			},
		})
		.input(getResponseSchema)
		.output(responseSchema)
		.query(async ({ input, ctx }) => {
			return getResponseById(input.responseId, ctx.user?.id ?? null);
		}),

	// DELETE /responses/{responseId}
	delete: publicProcedure
		.meta({
			openapi: {
				method: "DELETE",
				path: "/responses/{responseId}",
				tags: ["responses"],
				summary: "Delete a response",
			},
		})
		.input(responseIdSchema)
		.output(deleteResponseSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return deleteResponse(input.responseId, ctx.user.id);
		}),
});
