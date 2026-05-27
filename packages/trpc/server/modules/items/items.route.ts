import { router, publicProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
	createItemSchema,
	listItemsByEventSchema,
	getItemSchema,
	updateItemSchema,
	reorderItemSchema,
	itemIdSchema,
	bulkCreateItemsSchema,
	itemSchema,
	itemsArraySchema,
} from "./items.schema";
import { deleteResponseSchema } from "../../shared/schema-utils";
import {
	createItem,
	listItemsByEvent,
	getItemById,
	updateItem,
	reorderItem,
	deleteItem,
	bulkCreateItems,
} from "./items.service";

export const itemsRouter = router({
	// POST /items
	create: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/items",
				tags: ["items"],
				summary: "Create a new item",
			},
		})
		.input(createItemSchema)
		.output(itemSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return createItem(input, ctx.user);
		}),

	// GET /items/event/{eventId}
	listByEvent: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/items/event/{eventId}",
				tags: ["items"],
				summary: "List all items for an event",
			},
		})
		.input(listItemsByEventSchema)
		.output(itemsArraySchema)
		.query(async ({ input, ctx }) => {
			return listItemsByEvent(input.eventId, ctx.user?.id ?? null);
		}),

	// GET /items/{itemId}
	getById: publicProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/items/{itemId}",
				tags: ["items"],
				summary: "Get item by ID",
			},
		})
		.input(getItemSchema)
		.output(itemSchema)
		.query(async ({ input, ctx }) => {
			return getItemById(input.itemId, ctx.user?.id ?? null);
		}),

	// PATCH /items/{itemId}
	update: publicProcedure
		.meta({
			openapi: {
				method: "PATCH",
				path: "/items/{itemId}",
				tags: ["items"],
				summary: "Update item details",
			},
		})
		.input(updateItemSchema)
		.output(itemSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return updateItem(input.itemId, input.data, ctx.user.id);
		}),

	// POST /items/{itemId}/reorder
	reorder: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/items/{itemId}/reorder",
				tags: ["items"],
				summary: "Reorder an item",
			},
		})
		.input(reorderItemSchema)
		.output(itemSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return reorderItem(input.itemId, input.newOrder, ctx.user.id);
		}),

	// DELETE /items/{itemId}
	delete: publicProcedure
		.meta({
			openapi: {
				method: "DELETE",
				path: "/items/{itemId}",
				tags: ["items"],
				summary: "Delete an item",
			},
		})
		.input(itemIdSchema)
		.output(deleteResponseSchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return deleteItem(input.itemId, ctx.user.id);
		}),

	// POST /items/bulk
	bulkCreate: publicProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/items/bulk",
				tags: ["items"],
				summary: "Create multiple items at once",
			},
		})
		.input(bulkCreateItemsSchema)
		.output(itemsArraySchema)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.user) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
			}
			return bulkCreateItems(input.eventId, input.items, ctx.user);
		}),
});
