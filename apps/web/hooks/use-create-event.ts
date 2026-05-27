import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { CreateEventInput } from "@repo/trpc/server/modules/events";

export function useCreateEvent() {
	const utils = trpc.useUtils();

	const mutation = trpc.events.create.useMutation({
		onMutate: async (newEvent) => {
			// Cancel any outgoing refetches to prevent them from overwriting optimistic update
			await utils.events.listMine.cancel({ page: 1, pageSize: 20 });

						const previousEvents = utils.events.listMine.getData({ page: 1, pageSize: 20 });

						if (previousEvents) {
				const optimisticEvent = {
					id: `temp-${Date.now()}`, 					creatorId: "current-user", // Will be replaced by server response
					type: newEvent.type,
					status: "draft" as const,
					visibility: newEvent.visibility ?? "public",
					resultVisibility: newEvent.resultVisibility ?? "all",
					title: newEvent.title,
					description: newEvent.description ?? null,
					slug: newEvent.slug ?? null,
					authRequired: newEvent.authRequired ?? false,
					multipleResponses: newEvent.multipleResponses ?? false,
					receiveEmails: newEvent.receiveEmails ?? false,
					expiresAt: newEvent.expiresAt ? (newEvent.expiresAt as any).toISOString() : null,
					deletedAt: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					responseCount: 0,
				};

				utils.events.listMine.setData({ page: 1, pageSize: 20 }, {
					...previousEvents,
					events: [optimisticEvent, ...previousEvents.events],
				});
			}

			return { previousEvents };
		},
		onError: (error, _newEvent, context) => {
						if (context?.previousEvents) {
				utils.events.listMine.setData({ page: 1, pageSize: 20 }, context.previousEvents);
			}
			toast.error(error.message || "Failed to create event");
		},
		onSuccess: (data) => {
			toast.success("Event created successfully");
						utils.events.listMine.invalidate();
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
