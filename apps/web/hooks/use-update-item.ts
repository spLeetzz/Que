import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { UpdateItemInput } from "@repo/trpc/server/modules/items";

export function useUpdateItem(itemId: string, eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.items.update.useMutation({
		onMutate: async (variables) => {
						await utils.items.listByEvent.cancel({ eventId });
			await utils.items.getById.cancel({ itemId });

						const previousItems = utils.items.listByEvent.getData({ eventId });
			const previousItem = utils.items.getById.getData({ itemId });

						if (previousItems) {
				utils.items.listByEvent.setData(
					{ eventId },
					previousItems.map((item) =>
						item.id === itemId
							? {
									...item,
									...variables.data,
									updatedAt: new Date().toISOString(),
							  }
							: item
					)
				);
			}

						if (previousItem) {
				utils.items.getById.setData(
					{ itemId },
					{
						...previousItem,
						...variables.data,
						updatedAt: new Date().toISOString(),
					}
				);
			}

			return { previousItems, previousItem };
		},
		onError: (error, _variables, context) => {
						if (context?.previousItems) {
				utils.items.listByEvent.setData({ eventId }, context.previousItems);
			}
			if (context?.previousItem) {
				utils.items.getById.setData({ itemId }, context.previousItem);
			}
			toast.error(error.message || "Failed to update item");
		},
		onSuccess: () => {
			toast.success("Item updated successfully");
						utils.items.listByEvent.invalidate({ eventId });
			utils.items.getById.invalidate({ itemId });
		},
	});

	return {
		mutate: (data: UpdateItemInput) => mutation.mutate({ itemId, data }),
		mutateAsync: (data: UpdateItemInput) => mutation.mutateAsync({ itemId, data }),
		isLoading: mutation.isPending,
		isError: mutation.isError,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
