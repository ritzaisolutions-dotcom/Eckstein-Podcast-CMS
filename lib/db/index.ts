import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// In Cloudflare Workers, D1 is accessed via request context bindings.
// This helper is called from Server Components/Actions that run inside Workers.
// For local Next.js dev (npm run dev), DB calls will be stubbed until wrangler preview is used.
export function getDb(d1Binding: D1Database) {
  return drizzle(d1Binding, { schema });
}

export type DB = ReturnType<typeof getDb>;

export * from "./schema";
