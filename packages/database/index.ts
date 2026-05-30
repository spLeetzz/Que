import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";

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
  const client = (await Promise.race([
    pool.connect(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("DB connection timeout")), 5000)),
  ])) as PoolClient;
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export * from "./schema";
