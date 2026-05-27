import { router, publicProcedure } from "../../trpc";
import {
	listAnswersByResponseSchema,
	listAnswersByItemSchema,
	getAnswerSchema,
	answerSchema,
	answersArraySchema,
} from "../../schema";
import {
	listAnswersByResponse,
	listAnswersByItem,
	getAnswerById,
} from "../../services/answer.service";

export const answersRouter = router({
	// GET /answers/response/{responseId}
	listByResponse: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/answers/response/{responseId}",
				tags: ["answers"],
				summary: "List all answers for a response",
			},
		})
		.input(listAnswersByResponseSchema)
		.output(answersArraySchema)
		.query(async ({ input, ctx }) => {
			return listAnswersByResponse(input.responseId, ctx.user?.id ?? null);
		}),

	// GET /answers/item/{itemId}
	listByItem: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/answers/item/{itemId}",
				tags: ["answers"],
				summary: "List all answers for an item (question)",
			},
		})
		.input(listAnswersByItemSchema)
		.output(answersArraySchema)
		.query(async ({ input, ctx }) => {
			return listAnswersByItem(input.itemId, ctx.user?.id ?? null);
		}),

	// GET /answers/{answerId}
	getById: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/answers/{answerId}",
				tags: ["answers"],
				summary: "Get answer by ID",
			},
		})
		.input(getAnswerSchema)
		.output(answerSchema)
		.query(async ({ input, ctx }) => {
			return getAnswerById(input.answerId, ctx.user?.id ?? null);
		}),
});
