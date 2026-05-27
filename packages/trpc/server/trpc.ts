import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";

export const tRPCContext = initTRPC
	.meta<OpenApiMeta>()
	.context<typeof createContext>()
	.create({
		errorFormatter({ shape }) {
			return {
				...shape,
				data: {
					...shape.data,
					stack: undefined, // Strip the internal server stack trace
				},
			};
		},
	});

export const router = tRPCContext.router;
export const publicProcedure = tRPCContext.procedure;
