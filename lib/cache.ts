import { unstable_cache, revalidateTag } from "next/cache";
import { getDb } from "./db";
import { platforms, contentPieces, contentPlatformLinks } from "./db/schema";
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

type SnapRow = {
  contentId: string;
  platformId: number;
  views: number | null;
  likes: number | null;
  comments: number | null;
};

/** Latest snapshot per (content, platform) via DISTINCT ON — much faster than GROUP BY MAX on append-only table. */
async function latestSnapshotsForIds(ids: string[] | null): Promise<SnapRow[]> {
  const db = getDb();
  if (ids !== null && ids.length === 0) return [];

  const whereClause =
    ids === null
      ? sql``
      : sql`WHERE content_id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`;

  const result = await db.execute(sql`
    SELECT DISTINCT ON (content_id, platform_id)
      content_id AS "contentId",
      platform_id AS "platformId",
      views,
      likes,
      comments
    FROM analytics_snapshots
    ${whereClause}
    ORDER BY content_id, platform_id, captured_at DESC
  `);
  return result as unknown as SnapRow[];
}

// Top platforms by latest snapshot views — cached 5 min
export const getCachedPlatformViews = unstable_cache(
  async (): Promise<PlatformViewRow[]> => {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT platform_id AS "platformId", SUM(views)::int AS views
      FROM (
        SELECT DISTINCT ON (content_id, platform_id)
          platform_id, views
        FROM analytics_snapshots
        ORDER BY content_id, platform_id, captured_at DESC
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

// Analytics snapshot aggregates for specific content IDs — 5 min cache, keyed by sorted ID list
export function getCachedAnalyticsSnapshots(ids: string[]) {
  const key = [...ids].sort().join(",");
  return unstable_cache(
    async () => {
      const db = getDb();
      const [snapRows, links] = await Promise.all([
        latestSnapshotsForIds(ids),
        db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids)),
      ]);
      return { snapRows, links };
    },
    [`analytics-snaps-${key}`],
    { revalidate: 300, tags: ["analytics-snapshots"] }
  )();
}

/** Sum latest-per-platform views into a single number per content piece. */
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

// Global latest snapshots — only for cron/admin; prefer getCachedAnalyticsSnapshots(ids)
export const getCachedAllAnalyticsSnapshots = unstable_cache(
  async (): Promise<SnapRow[]> => latestSnapshotsForIds(null),
  ["analytics-all"],
  { revalidate: 300, tags: ["analytics-snapshots"] }
);

export function invalidateContentCaches() {
  revalidateTag("content-counts", "max");
  revalidateTag("analytics-snapshots", "max");
  revalidateTag("platform-views", "max");
}
