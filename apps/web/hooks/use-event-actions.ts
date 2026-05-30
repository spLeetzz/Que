"use client";

import { trpc } from "~/trpc/client";
import { getEventTabPath } from "~/lib/event-paths";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function usePublishEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.publish.useMutation({
		onSuccess: () => {
			toast.success("Event published successfully!");
			utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to publish event");
		},
	});

	return {
		publish: () => mutation.mutate({ eventId }),
		isLoading: mutation.isPending,
	};
}

export function useUnpublishEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.unpublish.useMutation({
		onSuccess: () => {
			toast.success("Event paused and reverted to draft");
			utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to pause event");
		},
	});

	return {
		unpublish: () => mutation.mutate({ eventId }),
		isLoading: mutation.isPending,
	};
}

export function useArchiveEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.archive.useMutation({
		onSuccess: () => {
			toast.success("Event archived successfully");
			utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to archive event");
		},
	});

	return {
		archive: () => mutation.mutate({ eventId }),
		isLoading: mutation.isPending,
	};
}

export function useCompleteEvent(eventId: string) {
	const utils = trpc.useUtils();

	const mutation = trpc.events.complete.useMutation({
		onSuccess: () => {
			toast.success("Event marked as completed");
			utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			utils.events.listMine.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to complete event");
		},
	});

	return {
		complete: () => mutation.mutate({ eventId }),
		isLoading: mutation.isPending,
	};
}

export function useDuplicateEvent() {
	const utils = trpc.useUtils();
	const router = useRouter();

	const mutation = trpc.events.duplicate.useMutation({
		onSuccess: (newEvent) => {
			toast.success(`Duplicated event successfully as "${newEvent.title}"`);
			utils.events.listMine.invalidate();
			router.push(getEventTabPath(newEvent, "manage"));
		},
		onError: (err) => {
			toast.error(err.message || "Failed to duplicate event");
		},
	});

	return {
		duplicate: (eventId: string) => mutation.mutate({ eventId }),
		isLoading: mutation.isPending,
	};
}
