import { trpc } from "~/trpc/client";

export function useEvent(
	identifier: string,
	options?: { enablePolling?: boolean }
) {
	const query = trpc.events.getByIdOrSlug.useQuery(
		{ identifier },
		{
			enabled: !!identifier,
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
