import { z } from "zod";
const envSchema = z.object({
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	WEB_URL: z.url().default("http://localhost:3000"),
	BETTER_AUTH_URL: z.url().default("http://localhost:8000/api/auth"),
	RESEND_API_KEY: z.string().min(1),
	NODE_ENV: z.string().default("development"),
});
function createEnv(env: NodeJS.ProcessEnv) {
	const result = envSchema.safeParse(env);
	if (!result.success)
		throw new Error(
			`Invalid env:\n${result.error.issues.map((i) => `  ${i.path}: ${i.message}`).join("\n")}`,
		);
	return result.data;
}
export const env = createEnv(process.env);