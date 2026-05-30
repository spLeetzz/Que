import { trpc } from "~/trpc/client";

export function useParticipants(
	eventId: string,
	options?: { enablePolling?: boolean; enabled?: boolean }
) {
	const query = trpc.participants.listByEvent.useQuery(
		{ eventId },
		{
			enabled: (options?.enabled ?? true) && !!eventId,
			retry: 1,
			staleTime: options?.enablePolling ? 0 : 5 * 60 * 1000,
			refetchInterval: options?.enablePolling ? 3000 : false,
			refetchIntervalInBackground: true,
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
