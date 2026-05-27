import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import type { CreateParticipantInput } from "@repo/trpc/server/modules/participants";

export function useCreateParticipant() {
	const utils = trpc.useUtils();

	const mutation = trpc.participants.create.useMutation({
		onError: (error) => {
			toast.error(error.message || "Failed to join event");
		},
		onSuccess: (data) => {
			toast.success("Successfully joined event");
						utils.participants.listByEvent.invalidate({ eventId: data.eventId });
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
