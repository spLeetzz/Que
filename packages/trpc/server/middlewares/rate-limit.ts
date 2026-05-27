import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { tRPCContext, publicProcedure } from "../trpc";

function getClientIp(req: any): string {
	const forwarded = req.headers["x-forwarded-for"];
	if (typeof forwarded === "string") {
		return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
	}
	return req.ip ?? req.socket?.remoteAddress ?? "127.0.0.1";
}

interface RateLimitRecord {
	timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup: evict entries with no timestamps inside the longest window seen.
// Runs every 5 min. Use longest possible windowMs as TTL.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

if (typeof setInterval !== "undefined") {
	setInterval(() => {
		const now = Date.now();
		for (const [key, record] of rateLimitStore.entries()) {
			// Trim anything older than 1 hour (safe upper bound)
			record.timestamps = record.timestamps.filter(
				(t) => now - t < 60 * 60 * 1000
			);
			if (record.timestamps.length === 0) {
				rateLimitStore.delete(key);
			}
		}
	}, CLEANUP_INTERVAL_MS).unref();
}

interface RateLimitResult {
	limited: boolean;
	retryAfterMs?: number;
}

function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number
): RateLimitResult {
	const now = Date.now();
	const record = rateLimitStore.get(key) ?? { timestamps: [] };

	// Slide window
	record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

	if (record.timestamps.length >= limit) {
		// Oldest timestamp + windowMs = when the next slot frees up
		const oldest = record.timestamps[0]!;
		const retryAfterMs = oldest + windowMs - now;
		return { limited: true, retryAfterMs };
	}

	record.timestamps.push(now);
	rateLimitStore.set(key, record);
	return { limited: false };
}

interface RateLimiterOptions {
	limit?: number;
	windowMs?: number;
}

export function createRateLimiterMiddleware({
	limit = 10,
	windowMs = 60 * 1000,
}: RateLimiterOptions = {}) {
	return tRPCContext.middleware(({ ctx, next }) => {
		const ip = getClientIp(ctx.req);
		const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

		const result = checkRateLimit(ipHash, limit, windowMs);

		if (result.limited) {
			const retryAfterSec = Math.ceil((result.retryAfterMs ?? windowMs) / 1000);
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: `Rate limit exceeded. Retry in ${retryAfterSec}s.`,
			});
		}

		return next({ ctx: { ...ctx, ipHash } });
	});
}

// Default: 10 req / 60s
export const rateLimiterMiddleware = createRateLimiterMiddleware();
export const rateLimitedProcedure = publicProcedure.use(rateLimiterMiddleware);

// Tighter limits for sensitive routes
export const strictRateLimitedProcedure = publicProcedure.use(
	createRateLimiterMiddleware({ limit: 10, windowMs: 60 * 1000 })
);