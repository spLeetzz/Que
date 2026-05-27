import { TRPCError } from "@trpc/server";
import { tRPCContext, publicProcedure } from "../trpc";

export const authMiddleware = tRPCContext.middleware(({ ctx, next }) => {
	if (!ctx.user || ctx.user.isAnonymous) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to perform this action.",
		});
	}

	return next({
		ctx: {
			user: ctx.user,
		},
	});
});

export const protectedProcedure = publicProcedure.use(authMiddleware);
