import { trpc } from "~/trpc/client";
import { toast } from "sonner";

export function useDeleteItem(itemId: string, eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.items.delete.useMutation({
		onMutate: async () => {
						await utils.items.listByEvent.cancel({ eventId });

						const previousItems = utils.items.listByEvent.getData({ eventId });

						if (previousItems) {
				utils.items.listByEvent.setData(
					{ eventId },
					previousItems.filter((item) => item.id !== itemId)
				);
			}

			return { previousItems };
		},
		onError: (error, _variables, context) => {
						if (context?.previousItems) {
				utils.items.listByEvent.setData({ eventId }, context.previousItems);
			}
			toast.error(error.message || "Failed to delete item");
		},
		onSuccess: () => {
			toast.success("Item deleted successfully");
						utils.items.listByEvent.invalidate({ eventId });
		},
	});

	return {
		mutate: () => mutation.mutate({ itemId }),
		mutateAsync: () => mutation.mutateAsync({ itemId }),
		isLoading: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
