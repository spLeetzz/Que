import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { UpdateEventInput } from "@repo/trpc/server/modules/events";

export function useUpdateEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.update.useMutation({
		onMutate: async (variables) => {
						await utils.events.getByIdOrSlug.cancel({ identifier: eventId });
			await utils.events.listMine.cancel({ page: 1, pageSize: 20 });

						const previousEvent = utils.events.getByIdOrSlug.getData({ identifier: eventId });
			const previousEventsList = utils.events.listMine.getData({ page: 1, pageSize: 20 });

			const serializedData: any = { ...variables.data };
			if (serializedData.expiresAt) {
				serializedData.expiresAt = new Date(serializedData.expiresAt).toISOString();
			}

						if (previousEvent) {
				utils.events.getByIdOrSlug.setData(
					{ identifier: eventId },
					{
						...previousEvent,
						...serializedData,
						updatedAt: new Date().toISOString(),
					}
				);
			}

						if (previousEventsList) {
				utils.events.listMine.setData({ page: 1, pageSize: 20 }, {
					...previousEventsList,
					events: previousEventsList.events.map((event) =>
						event.id === eventId
							? {
									...event,
									...serializedData,
									updatedAt: new Date().toISOString(),
							  }
							: event
					),
				});
			}

			return { previousEvent, previousEventsList };
		},
		onError: (error, _variables, context) => {
						if (context?.previousEvent) {
				utils.events.getByIdOrSlug.setData(
					{ identifier: eventId },
					context.previousEvent
				);
			}
			if (context?.previousEventsList) {
				utils.events.listMine.setData({ page: 1, pageSize: 20 }, context.previousEventsList);
			}
			toast.error(error.message || "Failed to update event");
		},
		onSuccess: (data) => {
			toast.success("Event updated successfully");
						utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
	});

	return {
		mutate: (data: UpdateEventInput) => mutation.mutate({ eventId, data }),
		mutateAsync: (data: UpdateEventInput) => mutation.mutateAsync({ eventId, data }),
		isLoading: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
