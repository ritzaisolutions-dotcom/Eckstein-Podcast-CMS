export const dynamic = "force-dynamic";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { getDb } from "@/lib/db";
import { getCachedPlatforms } from "@/lib/cache";
import { contentPieces, analyticsSnapshots, contentPlatformLinks } from "@/lib/db/schema";
import { eq, desc, inArray, sql, and } from "drizzle-orm";

const LIFECYCLE_STAGES = [
  { key: "idea",        label: "Idee" },
  { key: "production",  label: "Produktion" },
  { key: "editing",     label: "Schnitt" },
  { key: "scheduled",   label: "Geplant" },
  { key: "published",   label: "Live" },
];

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string }>;
}) {
  const params = await searchParams;
  const view = params.view ?? "table";
  const statusFilter = params.status ?? "";

  const db = getDb();

  const conditions = statusFilter ? [eq(contentPieces.status, statusFilter)] : [];
  const episodes = await db
    .select()
    .from(contentPieces)
    .where(
      and(eq(contentPieces.type, "lfc"), ...(conditions.length ? conditions : []))
    )
    .orderBy(desc(contentPieces.episodeNumber));

  const ids = episodes.map(e => e.id);

  // Views per episode
  const snapRows = ids.length > 0
    ? await db
        .select({ contentId: analyticsSnapshots.contentId, views: sql<number>`SUM(${analyticsSnapshots.views})`.as("v") })
        .from(analyticsSnapshots)
        .where(inArray(analyticsSnapshots.contentId, ids))
        .groupBy(analyticsSnapshots.contentId)
    : [];
  const viewsMap = Object.fromEntries(snapRows.map(r => [r.contentId, Number(r.views)]));

  // Platform links
  const links = ids.length > 0
    ? await db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids))
    : [];
  const platformRows = await getCachedPlatforms();
  const platMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));
  const platByContent: Record<string, string[]> = {};
  for (const l of links) {
    if (!platByContent[l.contentId]) platByContent[l.contentId] = [];
    platByContent[l.contentId].push(platMap[l.platformId] ?? "");
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ view, ...(statusFilter && { status: statusFilter }), ...overrides });
    return `/episodes?${p.toString()}`;
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Episoden</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            Long-Form Content · {episodes.length} Episoden
          </p>
        </div>
        <Link href="/episodes/new" className="text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}>
          + NEUE EPISODE
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status filter */}
        {[["", "Alle"], ["draft", "Entwurf"], ["scheduled", "Geplant"], ["published", "Live"]].map(([v, l]) => (
          <Link key={v} href={buildUrl({ status: v })}
            className="px-3 py-1.5 rounded border text-xs transition-colors"
            style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.1em",
              borderColor: statusFilter === v ? "var(--navy)" : "var(--border)",
              background: statusFilter === v ? "var(--navy)" : "transparent",
              color: statusFilter === v ? "var(--cream)" : "var(--text-muted)",
            }}
          >{l}</Link>
        ))}

        {/* View toggle */}
        <div className="ml-auto flex gap-1 rounded border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <Link href={buildUrl({ view: "table" })} className="px-3 py-1.5 text-xs transition-colors" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", background: view === "table" ? "var(--navy)" : "transparent", color: view === "table" ? "var(--cream)" : "var(--text-muted)" }}>
            Tabelle
          </Link>
          <Link href={buildUrl({ view: "timeline" })} className="px-3 py-1.5 text-xs transition-colors" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", background: view === "timeline" ? "var(--navy)" : "transparent", color: view === "timeline" ? "var(--cream)" : "var(--text-muted)" }}>
            Timeline
          </Link>
        </div>
      </div>

      {episodes.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>▶</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Noch keine Episoden angelegt.</p>
          <Link href="/episodes/new" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Erste Episode anlegen
          </Link>
        </div>
      ) : view === "timeline" ? (
        <TimelineView episodes={episodes} />
      ) : (
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table w-full">
            <thead>
              <tr>
                <th className="pl-4" style={{ width: 40 }}>#</th>
                <th>Titel</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 120 }}>Lifecycle</th>
                <th style={{ width: 100 }}>Live-Gang</th>
                <th style={{ width: 130 }}>Plattformen</th>
                <th style={{ width: 80 }} className="text-right pr-4">Views</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map(ep => (
                <tr key={ep.id} className="cursor-pointer">
                  <td className="pl-4" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>
                    {ep.episodeNumber ?? "—"}
                  </td>
                  <td>
                    <Link href={`/episodes/${ep.id}`} className="hover:underline" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                      {ep.title || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Kein Titel</span>}
                    </Link>
                    {ep.hasPrayer && <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>✝</span>}
                    {ep.bio && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{ep.bio}</p>}
                  </td>
                  <td><Badge status={ep.status as "draft" | "scheduled" | "published"} /></td>
                  <td>
                    <LifecyclePill stage={ep.lifecycleStage ?? "idee"} />
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {ep.uploadDate ? new Date(ep.uploadDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(platByContent[ep.id] ?? []).slice(0, 3).map(slug => (
                        <span key={slug} className="text-xs px-1 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "rgba(5,16,31,0.08)", color: "var(--navy-3)", border: "1px solid var(--border)" }}>
                          {slug.replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right pr-4" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: viewsMap[ep.id] ? "var(--navy)" : "var(--text-muted)" }}>
                    {viewsMap[ep.id] ? viewsMap[ep.id].toLocaleString("de") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LifecyclePill({ stage }: { stage: string }) {
  const found = LIFECYCLE_STAGES.find(s => s.key === stage);
  const isLate = stage === "published";
  const isActive = stage !== "idee" && stage !== "published";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{
      fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.06em",
      background: isLate ? "var(--navy)" : isActive ? "rgba(201,168,76,0.2)" : "var(--cream-mid)",
      color: isLate ? "var(--cream)" : isActive ? "var(--navy)" : "var(--text-muted)",
    }}>
      {found?.label ?? stage}
    </span>
  );
}

function TimelineView({ episodes }: { episodes: { id: string; episodeNumber: number | null; title: string; lifecycleStage: string | null; uploadDate: Date | null }[] }) {
  return (
    <div className="cms-card overflow-x-auto p-0">
      {/* Header row */}
      <div className="grid min-w-max border-b" style={{ gridTemplateColumns: `180px repeat(${LIFECYCLE_STAGES.length}, 140px)`, borderColor: "var(--border)" }}>
        <div className="px-4 py-2 text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", background: "var(--cream-mid)" }}>Episode</div>
        {LIFECYCLE_STAGES.map(stage => (
          <div key={stage.key} className="px-3 py-2 text-center text-xs border-l" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "var(--text-muted)", background: "var(--cream-mid)", borderColor: "var(--border)" }}>
            {stage.label.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Episode rows */}
      {episodes.map(ep => {
        const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.key === (ep.lifecycleStage ?? "idee"));
        return (
          <div key={ep.id} className="grid min-w-max border-b hover:bg-cream-mid/30 transition-colors" style={{ gridTemplateColumns: `180px repeat(${LIFECYCLE_STAGES.length}, 140px)`, borderColor: "var(--border)" }}>
            <div className="px-4 py-3 flex flex-col justify-center">
              <Link href={`/episodes/${ep.id}`} className="text-sm hover:underline" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                {ep.episodeNumber ? <span className="text-xs mr-1" style={{ color: "var(--text-muted)" }}>#{ep.episodeNumber}</span> : null}
                {ep.title || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Kein Titel</span>}
              </Link>
              {ep.uploadDate && (
                <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {new Date(ep.uploadDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
            </div>
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isDone = idx < currentIdx;
              const isActive = idx === currentIdx;
              return (
                <div key={stage.key} className="px-3 py-3 flex items-center justify-center border-l" style={{ borderColor: "var(--border)", background: isActive ? "rgba(201,168,76,0.1)" : "transparent" }}>
                  {isDone && <span style={{ color: "#4caf7d", fontSize: "0.9rem" }}>✓</span>}
                  {isActive && <span className="w-3 h-3 rounded-full" style={{ background: "var(--gold)" }} />}
                  {!isDone && !isActive && <span className="w-3 h-3 rounded-full border" style={{ borderColor: "var(--border)" }} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
