import { router, publicProcedure } from "../../trpc";
import {
	createServiceFormSchema,
	updateServiceFormSchema,
	getServiceFormSchema,
	deleteServiceFormSchema,
	listServiceFormsSchema,
	serviceFormSchema,
} from "./service-forms.schema";
import {
	createServiceForm,
	getServiceForm,
	listServiceForms,
	updateServiceForm,
	deleteServiceForm,
} from "./service-forms.service";
import { authenticatePAT } from "../pat/pat.service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Custom procedure for PAT authentication that injects typed patUserId
const patAuthProcedure = publicProcedure.use(async (opts) => {
	const authHeader = (opts.ctx.req?.headers as Record<string, string | undefined>)?.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "PAT authentication required",
		});
	}

	const token = authHeader.substring(7); // Remove "Bearer "
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

export const serviceFormsRouter = router({
	create: patAuthProcedure
		.input(createServiceFormSchema)
		.output(serviceFormSchema)
		.mutation(async ({ input, ctx }) => {
			return createServiceForm(input, ctx.patUserId);
		}),

	get: patAuthProcedure
		.input(getServiceFormSchema)
		.output(serviceFormSchema)
		.query(async ({ input, ctx }) => {
			return getServiceForm(input, ctx.patUserId);
		}),

	list: patAuthProcedure
		.input(listServiceFormsSchema)
		.output(
			z.object({
				forms: z.array(serviceFormSchema),
				pagination: z.object({
					page: z.number(),
					pageSize: z.number(),
					total: z.number(),
					totalPages: z.number(),
				}),
			})
		)
		.query(async ({ input, ctx }) => {
			return listServiceForms(input, ctx.patUserId);
		}),

	update: patAuthProcedure
		.input(updateServiceFormSchema)
		.output(serviceFormSchema)
		.mutation(async ({ input, ctx }) => {
			return updateServiceForm(input, ctx.patUserId);
		}),

	delete: patAuthProcedure
		.input(deleteServiceFormSchema)
		.output(z.object({ success: z.boolean(), message: z.string() }))
		.mutation(async ({ input, ctx }) => {
			return deleteServiceForm(input, ctx.patUserId);
		}),
});

export * from "./service-forms.schema";
export * from "./service-forms.service";
