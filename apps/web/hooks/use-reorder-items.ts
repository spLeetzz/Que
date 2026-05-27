import { trpc } from "~/trpc/client";
import { toast } from "sonner";

export function useReorderItems(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.items.reorder.useMutation({
		onMutate: async (variables) => {
						await utils.items.listByEvent.cancel({ eventId });

						const previousItems = utils.items.listByEvent.getData({ eventId });

						if (previousItems) {
				const updatedItems = previousItems.map((item) =>
					item.id === variables.itemId
						? { ...item, order: variables.newOrder, updatedAt: new Date().toISOString() }
						: item
				);

				// Sort by order to reflect the new position
				updatedItems.sort((a, b) => a.order - b.order);

				utils.items.listByEvent.setData({ eventId }, updatedItems);
			}

			return { previousItems };
		},
		onError: (error, _variables, context) => {
						if (context?.previousItems) {
				utils.items.listByEvent.setData({ eventId }, context.previousItems);
			}
			toast.error(error.message || "Failed to reorder item");
		},
		onSuccess: () => {
						utils.items.listByEvent.invalidate({ eventId });
		},
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isLoading: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
