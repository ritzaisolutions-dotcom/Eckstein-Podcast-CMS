import { NextRequest, NextResponse } from "next/server";

// Called by Cloudflare Cron Trigger: 0 */6 * * *
// Also callable manually: GET /api/cron/refresh-analytics (requires CRON_SECRET header in prod)
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("x-cron-secret");
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const youtubeKey = process.env.YOUTUBE_API_KEY;
  const igToken = process.env.IG_ACCESS_TOKEN;
  const igBusinessId = process.env.IG_BUSINESS_ID;

  const results: { platform: string; updated: number; errors: string[] }[] = [];

  // YouTube pull — fetches stats for all content_platform_links with platform='youtube' or 'yt_shorts'
  if (youtubeKey) {
    try {
      // TODO: query DB for all content_platform_links where platform.slug IN ('youtube','yt_shorts') AND external_id IS NOT NULL
      // For now, placeholder logic:
      const videoIds: string[] = []; // pull from DB
      if (videoIds.length > 0) {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${youtubeKey}`;
        const res = await fetch(url);
        const data = await res.json() as { items?: Array<{ id: string; statistics: { viewCount: string; likeCount: string; commentCount: string } }> };
        // TODO: for each item, insert analytics_snapshots row
        results.push({ platform: "youtube", updated: data.items?.length ?? 0, errors: [] });
      }
    } catch (e) {
      results.push({ platform: "youtube", updated: 0, errors: [String(e)] });
    }
  }

  // Instagram pull
  if (igToken && igBusinessId) {
    try {
      // TODO: query DB for all content_platform_links where platform.slug IN ('instagram','ig_reels') AND external_id IS NOT NULL
      const mediaIds: string[] = []; // pull from DB
      for (const id of mediaIds) {
        const url = `https://graph.facebook.com/v20.0/${id}?fields=like_count,comments_count,reach,impressions&access_token=${igToken}`;
        await fetch(url);
        // TODO: insert analytics_snapshots row
      }
      results.push({ platform: "instagram", updated: mediaIds.length, errors: [] });
    } catch (e) {
      results.push({ platform: "instagram", updated: 0, errors: [String(e)] });
    }
  }

  return NextResponse.json({
    ok: true,
    pulledAt: new Date().toISOString(),
    results,
  });
}
