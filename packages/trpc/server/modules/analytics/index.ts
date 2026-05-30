import { router, publicProcedure } from "../../trpc";
import { getAnalyticsSchema, getIndividualResponsesSchema } from "./analytics.schema";
import {
	getOverviewMetrics,
	getResponseTimeline,
	getAbandonmentFunnel,
	getQuestionAnalytics,
	getParticipantJourneys,
	getFullAnalytics,
	getIndividualResponses,
} from "./analytics.service";

export const analyticsRouter = router({
	getOverview: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getOverviewMetrics(input.eventId, ctx.user?.id ?? null);
	}),

	getTimeline: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getResponseTimeline(input.eventId, ctx.user?.id ?? null);
	}),

	getAbandonmentFunnel: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getAbandonmentFunnel(input.eventId, ctx.user?.id ?? null);
	}),

	getQuestionAnalytics: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getQuestionAnalytics(input.eventId, ctx.user?.id ?? null);
	}),

	getParticipantJourneys: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getParticipantJourneys(input.eventId, ctx.user?.id ?? null);
	}),

	getIndividualResponses: publicProcedure.input(getIndividualResponsesSchema).query(async ({ input, ctx }) => {
		return getIndividualResponses(input.eventId, ctx.user?.id ?? null, input.page, input.pageSize);
	}),

	getFullAnalytics: publicProcedure.input(getAnalyticsSchema).query(async ({ input, ctx }) => {
		return getFullAnalytics(input.eventId, ctx.user?.id ?? null);
	}),
});

export * from "./analytics.schema";
export * from "./analytics.service";
