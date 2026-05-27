import { trpc } from "~/trpc/client";
import type { EventType, EventStatus } from "@repo/trpc/server/modules/events";

export interface EventFilters {
	type?: EventType;
	status?: EventStatus;
	page?: number;
	pageSize?: number;
}

export function useEvents(filters?: EventFilters) {
	const query = trpc.events.listMine.useQuery(
		{
			type: filters?.type,
			status: filters?.status,
			page: filters?.page ?? 1,
			pageSize: filters?.pageSize ?? 20,
		},
		{
			retry: 1,
			staleTime: 5 * 60 * 1000, 		}
	);

	return {
		data: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
