import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let _client: postgres.Sql | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_client) {
    // prepare: false required for Supabase Transaction pooler (PgBouncer)
    // max:10 — Supabase Transaction pooler supports concurrent connections
    // prepare:false required for PgBouncer transaction mode
    _client = postgres(url, { ssl: "require", max: 10, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  }
  return drizzle(_client, { schema });
}

export type DB = ReturnType<typeof getDb>;

export * from "./schema";
