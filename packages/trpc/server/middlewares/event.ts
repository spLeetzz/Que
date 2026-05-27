import { TRPCError } from "@trpc/server";
import { db } from "@repo/database";
import { events } from "@repo/database/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { tRPCContext, publicProcedure } from "../trpc";
import { protectedProcedure } from "./auth";

const eventInputSchema = z.object({
	eventId: z.uuid().optional(),
	slug: z.string().optional(),
});

export const eventExistsMiddleware = tRPCContext.middleware(async ({ ctx, input, next }) => {
	const parsed = eventInputSchema.safeParse(input);
	if (!parsed.success) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "An eventId (UUID) or slug is required for this route.",
		});
	}

	const { eventId, slug } = parsed.data;
	if (!eventId && !slug) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "An eventId or slug must be provided.",
		});
	}

	const conditions = [
		ne(events.status, "deleted"),
		isNull(events.deletedAt),
	];

	if (eventId) {
		conditions.push(eq(events.id, eventId));
	} else if (slug) {
		conditions.push(eq(events.slug, slug));
	}

	const [event] = await db
		.select()
		.from(events)
		.where(and(...conditions))
		.limit(1);

	if (!event) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Event not found or has been deleted.",
		});
	}

	return next({
		ctx: {
			...ctx,
			event,
		},
	});
});

export const eventProcedure = publicProcedure.use(eventExistsMiddleware);

export const creatorOnlyMiddleware = tRPCContext.middleware(({ ctx, next }) => {
	const typedCtx = ctx as typeof ctx & { event?: any; user?: NonNullable<typeof ctx.user> };

	// Require eventExists middleware to have run before this
	if (!typedCtx.event) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "eventExists middleware must be chained before creatorOnly.",
		});
	}

	if (!typedCtx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to perform this action.",
		});
	}

	if (typedCtx.user.id !== typedCtx.event.creatorId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not authorized to manage this event.",
		});
	}

	return next({
		ctx: {
			...ctx,
			event: typedCtx.event,
			user: typedCtx.user,
		},
	});
});

export const creatorProcedure = protectedProcedure
	.use(eventExistsMiddleware)
	.use(creatorOnlyMiddleware);
