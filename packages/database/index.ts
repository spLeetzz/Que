import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "./env"; // validation within it

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
export type DB = typeof db;

export async function verifyDbConnection() {
	const client = await pool.connect();
	try {
		await client.query("SELECT 1");
	} finally {
		client.release();
	}
}

export * from "./schema";
