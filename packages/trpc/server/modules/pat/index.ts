import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generatePATSchema, patGeneratedSchema, patRevokedSchema, patStatusSchema } from "./pat.schema";
import { generatePAT, revokePAT, getPATStatus } from "./pat.service";

function requireUser(ctx: { user: { id: string; name: string; email: string } | null }) {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in" });
	}
	return ctx.user;
}

export const patRouter = router({
	generate: publicProcedure
		.input(generatePATSchema)
		.output(patGeneratedSchema)
		.mutation(async ({ input, ctx }) => {
			const user = requireUser(ctx);
			return generatePAT(input, user);
		}),

	revoke: publicProcedure
		.output(patRevokedSchema)
		.mutation(async ({ ctx }) => {
			const user = requireUser(ctx);
			return revokePAT(user.id);
		}),

	getStatus: publicProcedure.output(patStatusSchema).query(async ({ ctx }) => {
		const user = requireUser(ctx);
		return getPATStatus(user.id);
	}),
});

export * from "./pat.schema";
export * from "./pat.service";
