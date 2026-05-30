import { NextRequest, NextResponse } from "next/server";
import { inArray, lt } from "drizzle-orm";
import { getDb, contentPlatformLinks, platforms, analyticsSnapshots } from "@/lib/db";
import { invalidateContentCaches } from "@/lib/cache";

export const maxDuration = 60;

const RETENTION_DAYS = 90;

// Called by Vercel Cron: schedule in vercel.json
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;
  const igToken = process.env.IG_ACCESS_TOKEN;
  const results: { platform: string; updated: number; errors: string[] }[] = [];

  const db = getDb();

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const prunedRows = await db.delete(analyticsSnapshots)
    .where(lt(analyticsSnapshots.capturedAt, cutoff))
    .returning({ id: analyticsSnapshots.id });
  const pruned = prunedRows.length;

  // ── YouTube ────────────────────────────────────────────────────────────────
  if (youtubeKey) {
    const ytErrors: string[] = [];
    try {
      const ytPlatforms = await db
        .select({ id: platforms.id })
        .from(platforms)
        .where(inArray(platforms.slug, ["youtube", "yt_shorts"]));

      const ytPlatformIds = ytPlatforms.map(p => p.id);
      if (ytPlatformIds.length > 0) {
        const links = await db
          .select()
          .from(contentPlatformLinks)
          .where(inArray(contentPlatformLinks.platformId, ytPlatformIds));

        const linksWithId = links.filter(l => l.externalId);
        let totalUpdated = 0;

        for (let i = 0; i < linksWithId.length; i += 50) {
          const chunk = linksWithId.slice(i, i + 50);
          const ids = chunk.map(l => l.externalId!).join(",");
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${youtubeKey}`);
          if (!res.ok) { ytErrors.push(`YouTube API ${res.status}`); continue; }
          const data = await res.json() as {
            items?: Array<{ id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
          };
          for (const item of data.items ?? []) {
            const link = chunk.find(l => l.externalId === item.id);
            if (!link) continue;
            await db.insert(analyticsSnapshots).values({
              contentId: link.contentId,
              platformId: link.platformId,
              views: parseInt(item.statistics.viewCount ?? "0", 10),
              likes: parseInt(item.statistics.likeCount ?? "0", 10),
              comments: parseInt(item.statistics.commentCount ?? "0", 10),
              source: "api",
            });
            totalUpdated++;
          }
        }
        results.push({ platform: "youtube", updated: totalUpdated, errors: ytErrors });
      }
    } catch (e) {
      results.push({ platform: "youtube", updated: 0, errors: [String(e)] });
    }
  }

  // ── Instagram ──────────────────────────────────────────────────────────────
  if (igToken) {
    const igErrors: string[] = [];
    try {
      const igPlatforms = await db
        .select({ id: platforms.id })
        .from(platforms)
        .where(inArray(platforms.slug, ["instagram", "ig_reels"]));

      const igPlatformIds = igPlatforms.map(p => p.id);
      if (igPlatformIds.length > 0) {
        const links = await db
          .select()
          .from(contentPlatformLinks)
          .where(inArray(contentPlatformLinks.platformId, igPlatformIds));

        const linksWithId = links.filter(l => l.externalId);
        let totalUpdated = 0;

        const igSettled = await Promise.allSettled(
          linksWithId.map(async (link) => {
            const res = await fetch(`https://graph.facebook.com/v20.0/${link.externalId}?fields=like_count,comments_count,reach,impressions&access_token=${igToken}`);
            if (!res.ok) throw new Error(`IG ${link.externalId}: ${res.status}`);
            const data = await res.json() as { like_count?: number; comments_count?: number; reach?: number; impressions?: number };
            await db.insert(analyticsSnapshots).values({
              contentId: link.contentId,
              platformId: link.platformId,
              views: data.reach ?? data.impressions ?? 0,
              likes: data.like_count ?? 0,
              comments: data.comments_count ?? 0,
              source: "api",
            });
          })
        );
        for (const r of igSettled) {
          if (r.status === "fulfilled") totalUpdated++;
          else igErrors.push(String(r.reason));
        }
        results.push({ platform: "instagram", updated: totalUpdated, errors: igErrors });
      }
    } catch (e) {
      results.push({ platform: "instagram", updated: 0, errors: [String(e)] });
    }
  }

  invalidateContentCaches();
  return NextResponse.json({ ok: true, pulledAt: new Date().toISOString(), pruned, results });
}
