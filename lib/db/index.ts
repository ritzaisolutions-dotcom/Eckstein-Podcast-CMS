import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let _client: postgres.Sql | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_client) {
    // Session pooler (port 5432) — lower latency than transaction pooler (6543)
    // prepare:false still needed; idle_timeout keeps connections warm between requests
    _client = postgres(url, { ssl: "require", max: 10, prepare: false, idle_timeout: 30, connect_timeout: 10 });
  }
  return drizzle(_client, { schema });
}

export type DB = ReturnType<typeof getDb>;

export * from "./schema";
