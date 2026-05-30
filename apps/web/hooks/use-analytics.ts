import { trpc } from "~/trpc/client";

export function useAnalyticsOverview(eventId: string) {
	return trpc.analytics.getOverview.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000, // 30 seconds, refetch on mount if older
			refetchOnWindowFocus: true,
		}
	);
}

export function useAnalyticsTimeline(eventId: string) {
	return trpc.analytics.getTimeline.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
		}
	);
}

export function useAbandonmentFunnel(eventId: string) {
	return trpc.analytics.getAbandonmentFunnel.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
		}
	);
}

export function useQuestionAnalytics(eventId: string) {
	return trpc.analytics.getQuestionAnalytics.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
		}
	);
}

export function useParticipantJourneys(eventId: string) {
	return trpc.analytics.getParticipantJourneys.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
		}
	);
}

export function useIndividualResponses(eventId: string, page: number = 1, pageSize: number = 50) {
	return trpc.analytics.getIndividualResponses.useQuery(
		{ eventId, page, pageSize },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
			placeholderData: (prev) => prev, // Smooth pagination
		}
	);
}

export function useFullAnalytics(eventId: string) {
	return trpc.analytics.getFullAnalytics.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
			staleTime: 30 * 1000,
			refetchOnWindowFocus: true,
		}
	);
}
