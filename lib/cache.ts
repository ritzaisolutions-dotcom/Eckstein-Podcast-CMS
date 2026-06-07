import { unstable_cache, revalidateTag } from "next/cache";
import { getDb } from "./db";
import {
  platforms,
  contentPieces,
  contentPlatformLinks,
  analyticsLatest,
  analyticsSnapshots,
  episodeTasks,
  forumThreads,
} from "./db/schema";
import { count, inArray, sql, eq, and, lte, isNull, isNotNull, desc, gte, or } from "drizzle-orm";

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

/**
 * Latest snapshot per (content, platform).
 * Reads from analytics_latest rollup table first (fast O(n) scan on small table).
 * Falls back to DISTINCT ON over history if rollup table doesn't exist yet.
 */
async function latestSnapshotsForIds(ids: string[] | null): Promise<SnapRow[]> {
  const db = getDb();
  if (ids !== null && ids.length === 0) return [];

  try {
    const q = db
      .select({
        contentId: analyticsLatest.contentId,
        platformId: analyticsLatest.platformId,
        views: analyticsLatest.views,
        likes: analyticsLatest.likes,
        comments: analyticsLatest.comments,
      })
      .from(analyticsLatest);
    if (ids !== null) {
      return await q.where(inArray(analyticsLatest.contentId, ids));
    }
    return await q;
  } catch {
    // Fallback: DISTINCT ON over history (used before analytics_latest migration is applied)
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
}

// Top platforms by latest snapshot views — cached 5 min
export const getCachedPlatformViews = unstable_cache(
  async (): Promise<PlatformViewRow[]> => {
    const db = getDb();
    try {
      const rows = await db
        .select({
          platformId: analyticsLatest.platformId,
          views: sql<number>`SUM(${analyticsLatest.views})::int`,
        })
        .from(analyticsLatest)
        .groupBy(analyticsLatest.platformId)
        .orderBy(sql`SUM(${analyticsLatest.views}) DESC`)
        .limit(4);
      return rows as PlatformViewRow[];
    } catch (err) {
      console.error("[cache] analytics_latest unavailable for platform views:", err);
      return [];
    }
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

type DashboardWidgetData = {
  dueTodayLinks: Array<{ contentId: string; platformId: number; title: string; episodeNumber: number | null; type: string }>;
  dueWeekLinks: Array<{ id: string; title: string; episodeNumber: number | null; filmingDate: Date | null; lifecycleStage: string; scheduledAt: Date | null }>;
  recentEps: Array<{ id: string; contentId: number | null; episodeNumber: number | null; title: string; lifecycleStage: string }>;
  forumRecent: Array<{ id: string; title: string; createdAt: Date | null }>;
  latestPublished: Array<{ id: string; episodeNumber: number | null }>;
  kpiSnaps: Array<{ views: number | null }>;
};

/**
 * All dashboard widget queries bundled in one cached call — 60s TTL.
 * Cache key includes today's date so entries roll over at midnight.
 */
export function getCachedDashboardWidgets(): Promise<DashboardWidgetData> {
  const todayKey = new Date().toISOString().split("T")[0];
  return unstable_cache(
    async (): Promise<DashboardWidgetData> => {
      const db = getDb();
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);

      const [dueTodayLinks, dueWeekLinks, recentEps, forumRecent, latestPublished] = await Promise.all([
        db
          .select({
            contentId: contentPlatformLinks.contentId,
            platformId: contentPlatformLinks.platformId,
            title: contentPieces.title,
            episodeNumber: contentPieces.episodeNumber,
            type: contentPieces.type,
          })
          .from(contentPlatformLinks)
          .innerJoin(contentPieces, eq(contentPlatformLinks.contentId, contentPieces.id))
          .where(
            and(
              isNull(contentPlatformLinks.postedAt),
              isNotNull(contentPlatformLinks.scheduledAt),
              lte(contentPlatformLinks.scheduledAt, new Date(todayStr + "T23:59:59Z")),
            ),
          )
          .limit(6),

        db
          .select({
            id: contentPieces.id,
            title: contentPieces.title,
            episodeNumber: contentPieces.episodeNumber,
            filmingDate: contentPieces.filmingDate,
            lifecycleStage: contentPieces.lifecycleStage,
            scheduledAt: contentPlatformLinks.scheduledAt,
          })
          .from(contentPieces)
          .leftJoin(contentPlatformLinks, eq(contentPlatformLinks.contentId, contentPieces.id))
          .where(
            or(
              and(
                isNull(contentPlatformLinks.postedAt),
                isNotNull(contentPlatformLinks.scheduledAt),
                gte(contentPlatformLinks.scheduledAt, new Date(todayStr + "T00:00:00Z")),
                lte(contentPlatformLinks.scheduledAt, weekLater),
              ),
              and(
                eq(contentPieces.lifecycleStage, "filming"),
                isNotNull(contentPieces.filmingDate),
                gte(contentPieces.filmingDate, new Date(todayStr + "T00:00:00Z")),
                lte(contentPieces.filmingDate, weekLater),
              ),
            ),
          )
          .limit(6),

        db
          .select({
            id: contentPieces.id,
            contentId: contentPieces.contentId,
            episodeNumber: contentPieces.episodeNumber,
            title: contentPieces.title,
            lifecycleStage: contentPieces.lifecycleStage,
          })
          .from(contentPieces)
          .where(eq(contentPieces.type, "lfc"))
          .orderBy(desc(contentPieces.createdAt))
          .limit(5),

        db
          .select({ id: forumThreads.id, title: forumThreads.title, createdAt: forumThreads.createdAt })
          .from(forumThreads)
          .orderBy(desc(forumThreads.createdAt))
          .limit(20),

        db
          .select({ id: contentPieces.id, episodeNumber: contentPieces.episodeNumber })
          .from(contentPieces)
          .where(and(eq(contentPieces.type, "lfc"), eq(contentPieces.status, "published")))
          .orderBy(desc(contentPieces.uploadDate))
          .limit(1),
      ]);

      const kpiSnaps =
        latestPublished.length > 0
          ? await db
              .select({ views: analyticsSnapshots.views })
              .from(analyticsSnapshots)
              .where(eq(analyticsSnapshots.contentId, latestPublished[0].id))
              .orderBy(desc(analyticsSnapshots.capturedAt))
              .limit(2)
          : [];

      return { dueTodayLinks, dueWeekLinks, recentEps, forumRecent, latestPublished, kpiSnaps };
    },
    [`dashboard-widgets-${todayKey}`],
    { revalidate: 60, tags: ["dashboard-widgets"] },
  )();
}

export function invalidateContentCaches() {
  revalidateTag("content-counts", "max");
  revalidateTag("analytics-snapshots", "max");
  revalidateTag("dashboard-widgets", "max");
}
