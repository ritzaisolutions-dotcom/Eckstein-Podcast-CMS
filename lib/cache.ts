import { unstable_cache, revalidateTag } from "next/cache";
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

type PlatformViewRow = { platformId: number; views: number };

// Top platforms by latest snapshot views — avoids full-table SUM on append-only rows
export const getCachedPlatformViews = unstable_cache(
  async (): Promise<PlatformViewRow[]> => {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT platform_id AS "platformId", SUM(max_views)::int AS views
      FROM (
        SELECT content_id, platform_id, MAX(views) AS max_views
        FROM analytics_snapshots
        GROUP BY content_id, platform_id
      ) latest
      GROUP BY platform_id
      ORDER BY views DESC
      LIMIT 4
    `);
    return result as unknown as PlatformViewRow[];
  },
  ["platform-views"],
  { revalidate: 300, tags: ["analytics-snapshots"] }
);

// Analytics snapshot aggregates — snapshots are pulled daily, so 5min cache is fine.
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

/** Sum MAX-per-platform views into a single number per content piece. */
export function viewsByContentId(
  snapRows: readonly { contentId: string; views: number | null }[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of snapRows) {
    map[row.contentId] = (map[row.contentId] ?? 0) + Number(row.views ?? 0);
  }
  return map;
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

type SnapRow = {
  contentId: string;
  platformId: number;
  views: number | null;
  likes: number | null;
  comments: number | null;
};

// Single global cache for all analytics aggregates — avoids per-page ID cache keys
export const getCachedAllAnalyticsSnapshots = unstable_cache(
  async (): Promise<SnapRow[]> => {
    const db = getDb();
    return db.select({
        contentId: analyticsSnapshots.contentId,
        platformId: analyticsSnapshots.platformId,
        views: sql<number>`MAX(${analyticsSnapshots.views})`.as("views"),
        likes: sql<number>`MAX(${analyticsSnapshots.likes})`.as("likes"),
        comments: sql<number>`MAX(${analyticsSnapshots.comments})`.as("comments"),
      })
      .from(analyticsSnapshots)
      .groupBy(analyticsSnapshots.contentId, analyticsSnapshots.platformId);
  },
  ["analytics-all"],
  { revalidate: 300, tags: ["analytics-snapshots"] }
);

export function invalidateContentCaches() {
  revalidateTag("content-counts", "max");
  revalidateTag("analytics-snapshots", "max");
  revalidateTag("platform-views", "max");
}
