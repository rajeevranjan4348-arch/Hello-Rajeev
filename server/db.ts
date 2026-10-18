import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn("[Database] Failed to connect to DATABASE_URL:", err);
    pool = null;
    db = null;
  }
} else {
  console.warn("[Database] DATABASE_URL not set — running with in-memory storage fallback.");
}
