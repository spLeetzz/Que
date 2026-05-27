import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z
		.string()
		.default("postgresql://postgres:postgres@localhost:5432/dev")
		.describe("DB URL"),
});

function createEnv(env: NodeJS.ProcessEnv) {
	const safeParseResult = envSchema.safeParse(env);
	if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
	return safeParseResult.data;
}

export const env = createEnv(process.env);
