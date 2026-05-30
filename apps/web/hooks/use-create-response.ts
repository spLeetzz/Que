import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { CreateResponseInput } from "@repo/trpc/server/modules/responses";

export function useCreateResponse() {
	const utils = trpc.useUtils();

	const mutation = trpc.responses.create.useMutation({
		onError: (error) => {
			toast.error(error.message || "Failed to submit response");
		},
		onSuccess: (data) => {
			toast.success("Response submitted successfully");
			utils.responses.listByEvent.invalidate({ eventId: data.eventId });
			utils.events.getByIdOrSlug.invalidate({ identifier: data.eventId });
			utils.items.listByEvent.invalidate({ eventId: data.eventId });
			utils.analytics.getFullAnalytics.invalidate({ eventId: data.eventId });
			utils.analytics.getOverview.invalidate({ eventId: data.eventId });
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
