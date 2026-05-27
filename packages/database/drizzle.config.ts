import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
	dialect: "postgresql",
	schema: [
		"./schema.ts", // app schema
		"../auth/schema.ts", // auth schema
	],
	out: "./migrations",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
