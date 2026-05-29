export const dynamic = "force-dynamic";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getDb } from "@/lib/db";
import { getCachedPlatforms } from "@/lib/cache";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

const PLATFORM_LABELS: Record<string, string> = {
  x: "X", instagram: "IG", tiktok: "TikTok",
};

export default async function PostsPage() {
  const db = getDb();

  const posts = await db
    .select()
    .from(contentPieces)
    .where(eq(contentPieces.type, "social_post"))
    .orderBy(desc(contentPieces.createdAt))
    .limit(100);

  const ids = posts.map(p => p.id);
  const [links, platformRows] = await Promise.all([
    ids.length > 0
      ? db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids))
      : Promise.resolve([]),
    getCachedPlatforms(),
  ]);

  const platMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));
  const platByContent: Record<string, string[]> = {};
  const scheduledByContent: Record<string, string | null> = {};
  const captionLenByContent: Record<string, Record<string, number>> = {};

  for (const link of links) {
    const slug = platMap[link.platformId];
    if (slug) {
      if (!platByContent[link.contentId]) platByContent[link.contentId] = [];
      platByContent[link.contentId].push(slug);
      if (link.caption) {
        if (!captionLenByContent[link.contentId]) captionLenByContent[link.contentId] = {};
        captionLenByContent[link.contentId][slug] = link.caption.length;
      }
    }
    const dateStr = (link.postedAt ?? link.scheduledAt)?.toISOString().split("T")[0] ?? null;
    if (dateStr && !scheduledByContent[link.contentId]) {
      scheduledByContent[link.contentId] = dateStr;
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Social Posts"
        subtitle={`X · Instagram · ${posts.length} Einträge`}
        actions={
          <Link href="/episodes/new?type=social_post">
            <Button size="sm">+ Neuer Post</Button>
          </Link>
        }
      />

      {posts.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>✦</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Social Posts angelegt.
          </p>
          <Link href="/episodes/new?type=social_post" className="inline-block mt-4">
            <Button size="sm">Ersten Post anlegen</Button>
          </Link>
        </div>
      ) : (
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Text</th>
                <th>Plattformen</th>
                <th>Status</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => {
                const platforms = platByContent[p.id] ?? [];
                const displayStatus = p.status === "published" ? "posted" : p.status;
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/episodes/${p.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                        {p.title}
                      </Link>
                      {p.bio && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                          {p.bio}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {platforms.map(pl => (
                          <span key={pl} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                            {PLATFORM_LABELS[pl] ?? pl.toUpperCase()}
                            {captionLenByContent[p.id]?.[pl] != null && (
                              <span style={{ opacity: 0.7 }}> · {captionLenByContent[p.id][pl]}</span>
                            )}
                          </span>
                        ))}
                        {platforms.length === 0 && <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </div>
                    </td>
                    <td><Badge status={displayStatus as "draft" | "scheduled" | "posted"} /></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {scheduledByContent[p.id] ?? "—"}
                    </td>
                    <td><Link href={`/episodes/${p.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
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
