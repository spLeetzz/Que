import { TRPCError } from "@trpc/server";
import type { EventType } from "../modules/events/events.schema";

export function validateReceiveEmails(
	receiveEmails: boolean,
	eventType: EventType,
	authRequired: boolean,
): void {
	if (!receiveEmails) return;

	if (eventType === "banter") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Email notifications are not available for banter events",
		});
	}

	if (eventType !== "form" && eventType !== "poll") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Email notifications are only available for forms and polls",
		});
	}

	if (!authRequired) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Email notifications require authentication-only events",
		});
	}
}

export function normalizeReceiveEmails(
	receiveEmails: boolean,
	eventType: EventType,
	authRequired: boolean,
): boolean {
	if (eventType === "banter") return false;
	if (!authRequired) return false;
	return receiveEmails;
}
