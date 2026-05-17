import { unstable_cache } from "next/cache";
import { getDb } from "./db";
import { platforms, contentPieces, analyticsSnapshots, contentPlatformLinks } from "./db/schema";
import { count, inArray, sql, eq } from "drizzle-orm";

// Platform rows never change at runtime — cache for 1 hour
export const getCachedPlatforms = unstable_cache(
  async () => {
    const db = getDb();
    return db.select().from(platforms);
  },
  ["platforms"],
  { revalidate: 3600, tags: ["platforms"] }
);

// Analytics snapshot aggregates — snapshots are pulled every 6h, so 5min cache is fine.
// Keyed by a sorted list of content IDs so different filter combinations get their own entry.
export function getCachedAnalyticsSnapshots(ids: string[]) {
  const key = [...ids].sort().join(",");
  return unstable_cache(
    async () => {
      const db = getDb();
      const [snapRows, links] = await Promise.all([
        db.select({
            contentId: analyticsSnapshots.contentId,
            platformId: analyticsSnapshots.platformId,
            views: sql<number>`MAX(${analyticsSnapshots.views})`.as("views"),
            likes: sql<number>`MAX(${analyticsSnapshots.likes})`.as("likes"),
            comments: sql<number>`MAX(${analyticsSnapshots.comments})`.as("comments"),
          })
          .from(analyticsSnapshots)
          .where(inArray(analyticsSnapshots.contentId, ids))
          .groupBy(analyticsSnapshots.contentId, analyticsSnapshots.platformId),
        db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids)),
      ]);
      return { snapRows, links };
    },
    [`analytics-snaps-${key}`],
    { revalidate: 300, tags: ["analytics-snapshots"] }
  )();
}

// Content counts by type — only published pieces, used on dashboard, cache 60s
export const getCachedContentCounts = unstable_cache(
  async () => {
    const db = getDb();
    const rows = await db
      .select({ type: contentPieces.type, cnt: count() })
      .from(contentPieces)
      .where(eq(contentPieces.status, "published"))
      .groupBy(contentPieces.type);
    const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
    const byType = Object.fromEntries(rows.map(r => [r.type, Number(r.cnt)]));
    return { total, byType };
  },
  ["content-counts"],
  { revalidate: 60, tags: ["content-counts"] }
);
