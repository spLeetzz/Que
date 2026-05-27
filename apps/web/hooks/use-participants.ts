import { trpc } from "~/trpc/client";

export function useParticipants(eventId: string) {
	const query = trpc.participants.listByEvent.useQuery(
		{ eventId },
		{
			enabled: !!eventId,
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
