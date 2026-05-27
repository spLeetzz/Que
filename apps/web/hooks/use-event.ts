import { trpc } from "~/trpc/client";

export function useEvent(identifier: string) {
	const query = trpc.events.getByIdOrSlug.useQuery(
		{ identifier },
		{
			enabled: !!identifier,
			retry: 1,
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
