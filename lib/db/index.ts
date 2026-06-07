import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let _client: postgres.Sql | null = null;

// cfEnv is only passed when running inside Cloudflare Workers (via OpenNext).
// On Vercel/local, call getDb() with no args and it uses process.env.DATABASE_URL.
export function getDb(cfEnv?: { HYPERDRIVE?: { connectionString: string } }) {
  // Cloudflare Workers path: Hyperdrive provides a proxied connection string per invocation.
  // Do not cache the client — Hyperdrive manages the global pool.
  if (cfEnv?.HYPERDRIVE) {
    const client = postgres(cfEnv.HYPERDRIVE.connectionString, {
      max: 1,
      prepare: false,
    });
    return drizzle(client, { schema });
  }

  // Vercel / local path: Transaction Pooler (port 6543), max:1, prepare:false for PgBouncer
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_client) {
    _client = postgres(url, {
      ssl: "require",
      max: 1,
      prepare: false,
      connect_timeout: 15,
      idle_timeout: 20,
      max_lifetime: 60 * 10,
    });
  }
  return drizzle(_client, { schema });
}

export type DB = ReturnType<typeof getDb>;

export * from "./schema";
