export const dynamic = "force-dynamic";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getDb } from "@/lib/db";
import { getCachedPlatforms } from "@/lib/cache";
import { contentPieces, contentPlatformLinks, clipQueue } from "@/lib/db/schema";
import { eq, desc, inArray, ne, sql } from "drizzle-orm";

const PLATFORM_LABELS: Record<string, string> = {
  yt_shorts: "YT Shorts", tiktok: "TikTok", ig_reels: "IG Reels", rumble: "Rumble", x: "X",
};

export default async function ShortsPage() {
  const db = getDb();

  const [shorts, queueCount, platformRows] = await Promise.all([
    db.select()
      .from(contentPieces)
      .where(eq(contentPieces.type, "sfc"))
      .orderBy(desc(contentPieces.createdAt))
      .limit(100),
    db.select({ count: sql<number>`count(*)`.as("count") })
      .from(clipQueue)
      .where(ne(clipQueue.status, "posted")),
    getCachedPlatforms(),
  ]);

  const pendingQueue = Number(queueCount[0]?.count ?? 0);
  const ids = shorts.map(s => s.id);
  const parentIds = shorts.map(s => s.parentId).filter((id): id is string => !!id);

  const [links, parents] = await Promise.all([
    ids.length > 0
      ? db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids))
      : Promise.resolve([]),
    parentIds.length > 0
      ? db.select({ id: contentPieces.id, episodeNumber: contentPieces.episodeNumber, title: contentPieces.title })
          .from(contentPieces)
          .where(inArray(contentPieces.id, parentIds))
      : Promise.resolve([]),
  ]);

  const platMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));
  const parentMap = Object.fromEntries(parents.map(p => [p.id, p]));

  const platByContent: Record<string, string[]> = {};
  const scheduledByContent: Record<string, string | null> = {};
  for (const link of links) {
    const slug = platMap[link.platformId];
    if (slug) {
      if (!platByContent[link.contentId]) platByContent[link.contentId] = [];
      platByContent[link.contentId].push(slug);
    }
    if (link.scheduledAt && !scheduledByContent[link.contentId]) {
      scheduledByContent[link.contentId] = link.scheduledAt.toISOString().split("T")[0];
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Shorts"
        subtitle={`Short-Form Clips · ${shorts.length} Einträge`}
        actions={
          <Link href="/episodes/new?type=sfc">
            <Button size="sm">+ Neuer Clip</Button>
          </Link>
        }
      />

      {pendingQueue > 0 && (
        <div className="mb-4 px-4 py-3 rounded border flex items-center justify-between" style={{ background: "rgba(201,168,76,0.08)", borderColor: "var(--gold)" }}>
          <span className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)" }}>
            ⬡ Clip Queue: <strong>{pendingQueue} Timestamp{pendingQueue !== 1 ? "s" : ""}</strong> warten auf Bearbeitung
          </span>
          <Link href="/shorts/queue" className="text-xs" style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.1em" }}>
            QUEUE ÖFFNEN →
          </Link>
        </div>
      )}

      {shorts.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>▶</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Shorts angelegt. Timestamps aus Telegram landen in der Clip Queue.
          </p>
          <Link href="/episodes/new?type=sfc" className="inline-block mt-4">
            <Button size="sm">Ersten Clip anlegen</Button>
          </Link>
        </div>
      ) : (
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Episode</th>
                <th>Status</th>
                <th>Plattformen</th>
                <th>Geplant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shorts.map(clip => {
                const parent = clip.parentId ? parentMap[clip.parentId] : null;
                const episodeLabel = parent
                  ? `Ep.${parent.episodeNumber ?? "?"}${clip.durationLabel ? ` · ${clip.durationLabel}` : ""}`
                  : clip.episodeNumber
                    ? `Ep.${clip.episodeNumber}`
                    : "—";
                const platforms = platByContent[clip.id] ?? [];
                return (
                  <tr key={clip.id}>
                    <td>
                      <Link href={`/episodes/${clip.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                        {clip.title}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{episodeLabel}</td>
                    <td><Badge status={clip.status as "draft" | "scheduled" | "published"} /></td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {platforms.map(p => (
                          <span key={p} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                            {PLATFORM_LABELS[p] ?? p}
                          </span>
                        ))}
                        {platforms.length === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {scheduledByContent[clip.id] ?? "—"}
                    </td>
                    <td><Link href={`/episodes/${clip.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
