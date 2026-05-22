import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let _client: postgres.Sql | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_client) {
    // Transaction pooler (port 6543) — designed for serverless, multiplexes many requests over few connections
    // max:1 per serverless instance; prepare:false required for PgBouncer
    _client = postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 30, idle_timeout: 20 });
  }
  return drizzle(_client, { schema });
}

export type DB = ReturnType<typeof getDb>;

export * from "./schema";
