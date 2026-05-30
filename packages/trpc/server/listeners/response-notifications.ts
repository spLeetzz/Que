import { db } from "@repo/database";
import { events, answers, items, user } from "@repo/database/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@repo/services";
import { appEmitter } from "../utils/emitter";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatAnswerPreview(values: string[]): string {
	const joined = values.filter(Boolean).join(", ");
	return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined || "(empty)";
}

/**
 * Sends creator email alerts when receiveEmails is enabled on a form event.
 */
export function registerResponseNotificationListeners(webUrl: string) {
	appEmitter.on("response:created", async ({ eventId, responseId }) => {
		try {
			const [event] = await db
				.select()
				.from(events)
				.where(eq(events.id, eventId))
				.limit(1);

			if (!event?.receiveEmails || event.type === "banter") {
				return;
			}

			if (event.type !== "form" && event.type !== "poll") {
				return;
			}

			if (!event.authRequired) {
				return;
			}

			const [creator] = await db
				.select({ email: user.email, name: user.name })
				.from(user)
				.where(eq(user.id, event.creatorId))
				.limit(1);

			if (!creator?.email) {
				return;
			}

			const responseAnswers = await db
				.select({
					question: items.value,
					values: answers.value,
				})
				.from(answers)
				.innerJoin(items, eq(answers.itemId, items.id))
				.where(eq(answers.responseId, responseId));

			const answerLines = responseAnswers
				.map(
					(row) =>
						`<li><strong>${escapeHtml(row.question)}</strong>: ${escapeHtml(formatAnswerPreview(row.values))}</li>`,
				)
				.join("");

			const resultsUrl = `${webUrl.replace(/\/$/, "")}/events/${event.slug ?? event.id}?tab=results`;
			const apiKey = process.env.RESEND_API_KEY;
			const from = process.env.RESEND_FROM_EMAIL ?? "noreply@adity.app";

			await sendEmail({
				apiKey,
				from,
				to: creator.email,
				subject: `New response: ${event.title}`,
				html: `
					<p>Hi${creator.name ? ` ${escapeHtml(creator.name)}` : ""},</p>
					<p>Someone just submitted a response to <strong>${escapeHtml(event.title)}</strong>.</p>
					${answerLines ? `<ul>${answerLines}</ul>` : "<p>(No answer details available)</p>"}
					<p><a href="${resultsUrl}">View all responses</a></p>
				`,
			});
		} catch (err) {
			console.error("[response-notifications] Failed to send email:", err);
		}
	});
}
