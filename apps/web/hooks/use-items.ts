import { trpc } from "~/trpc/client";

export function useItems(
	eventId: string,
	options?: { enablePolling?: boolean }
) {
	const query = trpc.items.listByEvent.useQuery(
		{ eventId },
		{
			retry: 1,
			staleTime: options?.enablePolling ? 0 : 5 * 60 * 1000, // No stale time for polling
			refetchInterval: options?.enablePolling ? 3000 : false, // Poll every 3 seconds for banter
			refetchIntervalInBackground: true, // Continue polling in background
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
