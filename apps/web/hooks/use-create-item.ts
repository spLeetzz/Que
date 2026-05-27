import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { CreateItemInput } from "@repo/trpc/server/modules/items";

export function useCreateItem() {
	const utils = trpc.useUtils();

	const mutation = trpc.items.create.useMutation({
		onMutate: async (newItem) => {
			// Cancel any outgoing refetches to prevent them from overwriting optimistic update
			await utils.items.listByEvent.cancel({ eventId: newItem.eventId });

						const previousItems = utils.items.listByEvent.getData({
				eventId: newItem.eventId,
			});

						if (previousItems) {
				const optimisticItem = {
					id: `temp-${Date.now()}`, 					eventId: newItem.eventId,
					category: newItem.category,
					value: newItem.value,
					order: newItem.order ?? (previousItems.length > 0 
						? Math.max(...previousItems.map(i => i.order)) + 1 
						: 1),
					participantId: newItem.participantId ?? null,
					questionType: newItem.questionType ?? null,
					required: newItem.required ?? false,
					metadata: newItem.metadata ?? null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				utils.items.listByEvent.setData(
					{ eventId: newItem.eventId },
					[...previousItems, optimisticItem]
				);
			}

			return { previousItems, eventId: newItem.eventId };
		},
		onError: (error, _newItem, context) => {
						if (context?.previousItems && context?.eventId) {
				utils.items.listByEvent.setData(
					{ eventId: context.eventId },
					context.previousItems
				);
			}
			toast.error(error.message || "Failed to create item");
		},
		onSuccess: (data, variables) => {
			const successMessage = variables.category === "chat" 
				? "Message sent" 
				: "Question added successfully";
			toast.success(successMessage);
						utils.items.listByEvent.invalidate({ eventId: variables.eventId });
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
