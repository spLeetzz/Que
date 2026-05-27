import { trpc } from "~/trpc/client";

export function useResponses(eventId: string, page: number = 1, pageSize: number = 20) {
	const query = trpc.responses.listByEvent.useQuery(
		{ eventId, page, pageSize },
		{
			enabled: !!eventId,
			retry: 1,
			placeholderData: (previousData) => previousData,
		}
	);

	return {
		data: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
