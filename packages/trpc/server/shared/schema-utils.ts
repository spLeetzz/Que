import { z } from "zod";

export { z };

export const zodUndefinedModel = z.undefined().describe("undefined");

// Common schema for delete responses
export const deleteResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

// Query parameter preprocessing utilities
export const preprocessQueryParam = (val: unknown) => {
	if (typeof val === "string") {
		let trimmed = val.trim();
		// Strip leading/trailing quotes if the query param was JSON serialized
		if (
			(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			(trimmed.startsWith("'") && trimmed.endsWith("'"))
		) {
			trimmed = trimmed.slice(1, -1);
		}
		if (trimmed === "undefined" || trimmed === "null" || trimmed === "NaN" || trimmed === "") {
			return undefined;
		}
		return trimmed;
	}
	return val;
};

export const preprocessNumber = (val: unknown) => {
	const processed = preprocessQueryParam(val);
	if (processed === undefined) return undefined;
	const num = Number(processed);
	return isNaN(num) ? undefined : num;
};

// Common pagination schema
export const paginationSchema = z.object({
	page: z.number(),
	pageSize: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

export type DeleteResponse = z.infer<typeof deleteResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
