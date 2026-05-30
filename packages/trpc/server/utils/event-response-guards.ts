import { TRPCError } from "@trpc/server";
import type { Event } from "@repo/database/schema";
import type { User } from "../shared/types";

/** Validates that an event is open for new responses. */
export function assertEventAcceptsResponses(event: Event, user: User | null): void {
	if (event.status !== "published") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This event is not accepting responses right now",
		});
	}

	if (event.expiresAt && new Date(event.expiresAt) < new Date()) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "This event has expired and is no longer accepting responses",
		});
	}

	if (event.authRequired && (!user || user.isAnonymous)) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Sign in is required to submit a response to this event",
		});
	}
}
