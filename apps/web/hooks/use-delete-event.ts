import { trpc } from "~/trpc/client";
import { toast } from "sonner";

export function useDeleteEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.delete.useMutation({
		onMutate: async () => {
						await utils.events.getByIdOrSlug.cancel({ identifier: eventId });
			await utils.events.listMine.cancel({ page: 1, pageSize: 20 });

						const previousEvent = utils.events.getByIdOrSlug.getData({ identifier: eventId });
			const previousEventsList = utils.events.listMine.getData({ page: 1, pageSize: 20 });

						if (previousEventsList) {
				utils.events.listMine.setData({ page: 1, pageSize: 20 }, {
					...previousEventsList,
					events: previousEventsList.events.filter((event) => event.id !== eventId),
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
			toast.error(error.message || "Failed to delete event");
		},
		onSuccess: () => {
			toast.success("Event deleted successfully");
						utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
	});

	return {
		mutate: () => mutation.mutate({ eventId }),
		mutateAsync: () => mutation.mutateAsync({ eventId }),
		isLoading: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
