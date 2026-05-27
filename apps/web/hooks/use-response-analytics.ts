import { trpc } from "~/trpc/client";
import { useMemo } from "react";

export function useResponseAnalytics(eventId: string) {
		const responsesQuery = trpc.responses.listByEvent.useQuery(
		{ eventId, page: 1, pageSize: 100 },
		{
			enabled: !!eventId,
			retry: 1,
		}
	);

	// Compute analytics from responses data
	const analytics = useMemo(() => {
		if (!responsesQuery.data) {
			return null;
		}

		const { responses, pagination } = responsesQuery.data;

		// Group responses by date for trend analysis
		const responseTrend = responses.reduce((acc, response) => {
			const date = new Date(response.submittedAt).toLocaleDateString();
			acc[date] = (acc[date] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		// Convert trend object to array for charting
		const trendData = Object.entries(responseTrend).map(([date, count]) => ({
			date,
			count,
		}));

		return {
			totalResponses: pagination.total,
			responseTrend: trendData,
			responses: responses,
			pagination: pagination,
		};
	}, [responsesQuery.data]);

	return {
		data: analytics,
		isLoading: responsesQuery.isLoading,
		isError: responsesQuery.isError,
		error: responsesQuery.error,
		refetch: responsesQuery.refetch,
	};
}
