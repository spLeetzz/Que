import { router, publicProcedure, tRPCContext } from "../../trpc";
import { createStateSchema, validateStateSchema, stateGeneratedSchema, stateValidationSchema } from "./form-states.schema";
import { createFormState, validateFormState } from "./form-states.service";
import { authenticatePAT } from "../pat/pat.service";
import { TRPCError } from "@trpc/server";

// Middleware that authenticates via PAT and injects userId
const patAuthProcedure = publicProcedure.use(async (opts) => {
	const authHeader = (opts.ctx.req?.headers as Record<string, string | undefined>)?.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "PAT authentication required",
		});
	}

	const token = authHeader.substring(7);
	const userId = await authenticatePAT(token);

	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Invalid or expired PAT",
		});
	}

	return opts.next({
		ctx: {
			...opts.ctx,
			patUserId: userId,
		},
	});
});

export const formStatesRouter = router({
	create: patAuthProcedure
		.input(createStateSchema)
		.output(stateGeneratedSchema)
		.mutation(async ({ input, ctx }) => {
			return createFormState(input, ctx.patUserId);
		}),

	validate: publicProcedure.input(validateStateSchema).output(stateValidationSchema).mutation(async ({ input }) => {
		return validateFormState(input);
	}),
});

export * from "./form-states.schema";
export * from "./form-states.service";
