export const dynamic = "force-dynamic";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { getDb } from "@/lib/db";
import { clipQueue, contentPieces } from "@/lib/db/schema";
import { desc, inArray, count } from "drizzle-orm";

const PAGE_SIZE = 50;

function formatTimestamp(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function ClipQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const db = getDb();

  const [queue, [{ total }]] = await Promise.all([
    db.select().from(clipQueue).orderBy(desc(clipQueue.createdAt)).limit(PAGE_SIZE).offset(offset),
    db.select({ total: count() }).from(clipQueue),
  ]);

  const totalPages = Math.max(1, Math.ceil(Number(total) / PAGE_SIZE));
  const contentIds = [...new Set(queue.map(q => q.contentId))];
  const episodes = contentIds.length > 0
    ? await db.select({ id: contentPieces.id, episodeNumber: contentPieces.episodeNumber, title: contentPieces.title })
        .from(contentPieces)
        .where(inArray(contentPieces.id, contentIds))
    : [];
  const epMap = Object.fromEntries(episodes.map(e => [e.id, e]));

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Clip Queue"
        subtitle={`${total} Timestamps · aus Telegram oder CMS${totalPages > 1 ? ` · Seite ${page}/${totalPages}` : ""}`}
        actions={
          <Link href="/content?type=sfc" className="text-xs" style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.1em" }}>
            ← SHORTS
          </Link>
        }
      />

      {queue.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Queue ist leer. Sende z.B. <code>#short ep12 0:34 Hook-Text</code> an den Telegram-Bot.
          </p>
        </div>
      ) : (
        <>
          <div className="cms-card p-0 overflow-x-auto">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Notiz</th>
                  <th>Episode</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => {
                  const ep = epMap[item.contentId];
                  return (
                    <tr key={item.id}>
                      <td style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                        {item.note ?? "—"}
                        {item.clipContentId && (
                          <Link href={`/episodes/${item.clipContentId}`} className="ml-2 text-xs" style={{ color: "var(--gold)" }}>
                            → Clip
                          </Link>
                        )}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {ep ? (
                          <Link href={`/episodes/${ep.id}`} className="hover:underline">
                            {ep.episodeNumber ? `Ep.${ep.episodeNumber}` : ep.title}
                          </Link>
                        ) : "—"}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "monospace" }}>
                        {formatTimestamp(item.timestampSec)}
                      </td>
                      <td><Badge status={item.status} /></td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {new Date(item.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {page > 1 && (
                <Link href={`/shorts/queue?page=${page - 1}`} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: "var(--border)", fontFamily: "var(--font-cinzel)" }}>
                  ← Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/shorts/queue?page=${page + 1}`} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: "var(--border)", fontFamily: "var(--font-cinzel)" }}>
                  Weiter →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
