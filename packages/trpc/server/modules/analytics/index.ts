import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getAnalyticsSchema, getIndividualResponsesSchema, exportAnalyticsSchema } from "./analytics.schema";
import {
	getOverviewMetrics,
	getResponseTimeline,
	getAbandonmentFunnel,
	getQuestionAnalytics,
	getParticipantJourneys,
	getFullAnalytics,
	getIndividualResponses,
} from "./analytics.service";

function requireUser(ctx: any) {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in to view analytics" });
	}
	return ctx.user;
}

export const analyticsRouter = router({
	getOverview: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getOverviewMetrics(input.eventId, user.id);
	}),

	getTimeline: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getResponseTimeline(input.eventId, user.id);
	}),

	getAbandonmentFunnel: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getAbandonmentFunnel(input.eventId, user.id);
	}),

	getQuestionAnalytics: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getQuestionAnalytics(input.eventId, user.id);
	}),

	getParticipantJourneys: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getParticipantJourneys(input.eventId, user.id);
	}),

	getIndividualResponses: publicProcedure.input(getIndividualResponsesSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getIndividualResponses(input.eventId, user.id, input.page, input.pageSize);
	}),

	getFullAnalytics: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		const user = requireUser(ctx);
		return getFullAnalytics(input.eventId, user.id);
	}),
});

export * from "./analytics.schema";
export * from "./analytics.service";
