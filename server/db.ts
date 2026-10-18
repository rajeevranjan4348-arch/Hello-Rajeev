import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("[Database] Connected using DATABASE_URL");
  } catch (err) {
    console.warn("[Database] Failed to initialize connection to DATABASE_URL:", err);
  }
} else {
  console.warn("[Database] DATABASE_URL not set — in-memory mock storage will be used");
}

export { pool, db };
