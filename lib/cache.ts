import { unstable_cache } from "next/cache";
import { getDb } from "./db";
import { platforms, contentPieces } from "./db/schema";
import { count, eq } from "drizzle-orm";

// Platform rows never change at runtime — cache for 1 hour
export const getCachedPlatforms = unstable_cache(
  async () => {
    const db = getDb();
    return db.select().from(platforms);
  },
  ["platforms"],
  { revalidate: 3600, tags: ["platforms"] }
);

// Content counts by type — used on dashboard, cache 60s
export const getCachedContentCounts = unstable_cache(
  async () => {
    const db = getDb();
    const rows = await db
      .select({ type: contentPieces.type, cnt: count() })
      .from(contentPieces)
      .groupBy(contentPieces.type);
    const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
    const byType = Object.fromEntries(rows.map(r => [r.type, Number(r.cnt)]));
    return { total, byType };
  },
  ["content-counts"],
  { revalidate: 60, tags: ["content-counts"] }
);
