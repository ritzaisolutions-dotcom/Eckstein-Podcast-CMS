export const dynamic = "force-dynamic";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCachedPlatforms, getCachedContentCounts } from "@/lib/cache";
import { contentPieces, contentPlatformLinks, episodeTasks, clipQueue, forumThreads, analyticsSnapshots } from "@/lib/db/schema";
import { eq, and, lte, isNull, isNotNull, count, desc, gte, inArray, or } from "drizzle-orm";

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date) {
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

function ampel(doneRatio: number, hasOverdue: boolean): { color: string; label: string; icon: string } {
  if (hasOverdue) return { color: "#c0392b", label: "überfällig", icon: "●" };
  if (doneRatio >= 0.8) return { color: "#4caf7d", label: "on track", icon: "●" };
  if (doneRatio >= 0.4) return { color: "var(--gold)", label: "in Arbeit", icon: "●" };
  return { color: "#c0392b", label: "Aufmerksamkeit", icon: "●" };
}

export default async function OheDashboard() {
  const db = getDb();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Cached counts (60s) + platforms (1h) run alongside live queries
  const [
    { total: totalCount, byType: countByType },
    dueTodayLinks,
    platformRows,
    dueWeekLinks,
    nextEp,
    recentEps,
    openClipsCount,
    newIdeas,
    latestPublished,
  ] = await Promise.all([
    // Content counts — cached 60s
    getCachedContentCounts(),

    // Heute fällig
    db.select({
        contentId: contentPlatformLinks.contentId,
        platformId: contentPlatformLinks.platformId,
        scheduledAt: contentPlatformLinks.scheduledAt,
        title: contentPieces.title,
        episodeNumber: contentPieces.episodeNumber,
        type: contentPieces.type,
      })
      .from(contentPlatformLinks)
      .innerJoin(contentPieces, eq(contentPlatformLinks.contentId, contentPieces.id))
      .where(and(
        isNull(contentPlatformLinks.postedAt),
        isNotNull(contentPlatformLinks.scheduledAt),
        lte(contentPlatformLinks.scheduledAt, new Date(todayStr + "T23:59:59Z")),
      ))
      .limit(8),

    // Platform labels (cached 1h)
    getCachedPlatforms(),

    // Diese Woche — geplante Posts + Drehs
    db.select({
        id: contentPieces.id,
        title: contentPieces.title,
        episodeNumber: contentPieces.episodeNumber,
        filmingDate: contentPieces.filmingDate,
        lifecycleStage: contentPieces.lifecycleStage,
        scheduledAt: contentPlatformLinks.scheduledAt,
      })
      .from(contentPieces)
      .leftJoin(contentPlatformLinks, eq(contentPlatformLinks.contentId, contentPieces.id))
      .where(or(
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
      ))
      .limit(8),

    // Nächste Episode
    db.select()
      .from(contentPieces)
      .where(and(eq(contentPieces.type, "lfc"), eq(contentPieces.status, "scheduled")))
      .orderBy(contentPieces.uploadDate)
      .limit(1),

    // Recent LFCs for Ampel
    db.select()
      .from(contentPieces)
      .where(eq(contentPieces.type, "lfc"))
      .orderBy(desc(contentPieces.createdAt))
      .limit(4),

    // Open clips count
    db.select({ cnt: count() })
      .from(clipQueue)
      .where(inArray(clipQueue.status, ["timestamp_marked", "caption_ready"])),

    // Neue Ideen
    db.select({ cnt: count() })
      .from(forumThreads)
      .where(gte(forumThreads.createdAt, weekAgo)),

    // Latest published episode for KPI
    db.select()
      .from(contentPieces)
      .where(and(eq(contentPieces.type, "lfc"), eq(contentPieces.status, "published")))
      .orderBy(desc(contentPieces.uploadDate))
      .limit(1),
  ]);

  const platformMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));
  const openClips = Number(openClipsCount[0]?.cnt ?? 0);
  const newIdeasCount = Number(newIdeas[0]?.cnt ?? 0);

  // Episode Ampel — single query for all episodes (no N+1)
  const recentEpIds = recentEps.map(e => e.id);
  const allTasks = recentEpIds.length > 0
    ? await db.select().from(episodeTasks).where(inArray(episodeTasks.contentId, recentEpIds))
    : [];
  const tasksByEp: Record<string, typeof allTasks> = {};
  for (const t of allTasks) {
    if (!tasksByEp[t.contentId]) tasksByEp[t.contentId] = [];
    tasksByEp[t.contentId].push(t);
  }
  const epAmpeln = recentEps
    .map(ep => {
      const tasks = tasksByEp[ep.id] ?? [];
      if (tasks.length === 0) return null;
      return { id: ep.id, title: ep.title, number: ep.episodeNumber, done: tasks.filter(t => t.done).length, total: tasks.length };
    })
    .filter(Boolean) as { id: string; title: string; number: number | null; done: number; total: number }[];

  // KPI block — snapshot query only if we have an episode
  let kpiBlock: { title: string; number: number | null; views: number; prevViews: number } | null = null;
  if (latestPublished.length > 0) {
    const ep = latestPublished[0];
    const snapshots = await db
      .select({ views: analyticsSnapshots.views, capturedAt: analyticsSnapshots.capturedAt })
      .from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.contentId, ep.id))
      .orderBy(desc(analyticsSnapshots.capturedAt))
      .limit(2);
    kpiBlock = { title: ep.title, number: ep.episodeNumber, views: snapshots[0]?.views ?? 0, prevViews: snapshots[1]?.views ?? 0 };
  }

  // --- Format helpers ---
  function fmtViews(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
          {formatDate(today)}
        </p>
      </div>

      {/* Content Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <StatCard label="Gesamt" value={totalCount} accent />
        <StatCard label="Episoden (LFC)" value={countByType["lfc"] ?? 0} />
        <StatCard label="Shorts (SFC)" value={countByType["sfc"] ?? 0} />
        <StatCard label="Artikel" value={countByType["article"] ?? 0} />
      </div>

      {/* KPI Block */}
      {kpiBlock && (
        <div
          className="mb-5 px-5 py-3 rounded border-l-4 flex items-center justify-between"
          style={{ background: "var(--bg-surface)", borderLeftColor: "var(--gold)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)" }}>
              Top KPI
            </span>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
              {kpiBlock.number ? `EP.${kpiBlock.number}` : ""} · {kpiBlock.title}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
              {fmtViews(kpiBlock.views)}
            </span>
            <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>Views</span>
            {kpiBlock.prevViews > 0 && (
              <p className="text-xs mt-0.5" style={{ color: kpiBlock.views >= kpiBlock.prevViews ? "#4caf7d" : "#c0392b" }}>
                {kpiBlock.views >= kpiBlock.prevViews ? "↑" : "↓"} vs. letzter Snapshot
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Heute fällig */}
        <section className="cms-card">
          <h2 className="cms-card-title mb-3">Heute fällig</h2>
          {dueTodayLinks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Alles erledigt ✓</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dueTodayLinks.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded border shrink-0" style={{ borderColor: "var(--gold)" }} />
                  <Link href={`/content?type=${item.type}`} className="text-sm hover:underline" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                    {item.episodeNumber ? `Ep.${item.episodeNumber}` : item.title} → {platformMap[item.platformId] ?? item.platformId}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Episode Status — Ampel */}
        <section className="cms-card">
          <h2 className="cms-card-title mb-3">Episode Status</h2>
          {epAmpeln.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Keine Tasks angelegt — Tasks werden beim Planen einer Episode generiert.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {epAmpeln.map(ep => {
                const ratio = ep.done / ep.total;
                const a = ampel(ratio, false);
                return (
                  <li key={ep.id} className="flex items-center gap-3">
                    <span style={{ color: a.color, fontSize: "0.7rem" }}>{a.icon}</span>
                    <Link href={`/content/${ep.id}`} className="text-sm hover:underline flex-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                      {ep.number ? `EP.${ep.number}` : ep.title}
                    </Link>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ep.done}/{ep.total}</span>
                    <span className="text-xs" style={{ color: a.color }}>{a.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Diese Woche */}
        <section className="cms-card">
          <h2 className="cms-card-title mb-3">Diese Woche</h2>
          {dueWeekLinks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Nichts geplant diese Woche</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dueWeekLinks.map((item, i) => {
                const isFilming = item.lifecycleStage === "filming" && item.filmingDate;
                const date = isFilming ? item.filmingDate : item.scheduledAt;
                return (
                  <li key={i} className="flex items-center gap-2">
                    {isFilming && (
                      <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontFamily: "var(--font-cinzel)", fontSize: "0.52rem", letterSpacing: "0.07em" }}>
                        DREH
                      </span>
                    )}
                    <Link href={`/content/${item.id}`} className="text-sm hover:underline flex-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
                      {item.episodeNumber ? `Ep.${item.episodeNumber}` : item.title}
                    </Link>
                    {date && (
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Nächste Episode */}
        <section className="cms-card" style={{ borderTopColor: "var(--gold)", borderTopWidth: 2 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="cms-card-title">Nächste Episode</h2>
              {nextEp.length > 0 ? (
                <>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontStyle: "italic", fontFamily: "var(--font-cormorant)" }}>
                    {nextEp[0].episodeNumber ? `#${nextEp[0].episodeNumber} · ` : ""}{nextEp[0].title}
                  </p>
                  {nextEp[0].uploadDate && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      📅 {new Date(nextEp[0].uploadDate).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine Episode geplant</p>
              )}
            </div>
            <Link href="/prep" className="shrink-0 text-xs px-3 py-1.5 rounded border transition-colors" style={{ borderColor: "var(--gold)", color: "var(--gold)", fontFamily: "var(--font-cinzel)" }}>
              Zum Prep →
            </Link>
          </div>
        </section>
      </div>

      {/* Footer row: Clips + Ideen */}
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {openClips > 0 && (
          <Link href="/content?type=sfc" className="flex items-center justify-between px-4 py-3 rounded border hover:border-gold transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
              ⬡ {openClips} offene Clips
            </span>
            <span className="text-xs" style={{ color: "var(--gold)" }}>Ansehen →</span>
          </Link>
        )}
        {newIdeasCount > 0 && (
          <Link href="/mind-dump" className="flex items-center justify-between px-4 py-3 rounded border hover:border-gold transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
              ⊕ {newIdeasCount} neue Ideen & Topics
            </span>
            <span className="text-xs" style={{ color: "var(--gold)" }}>Ansehen →</span>
          </Link>
        )}
      </div>

      {/* Leitwort */}
      <div className="mt-10 mb-2 text-center">
        <p className="text-base" style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
          »Denn aus ihm und durch ihn und auf ihn hin ist alles.«
        </p>
        <p className="text-xs mt-1 tracking-widest uppercase" style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold)", fontSize: "0.55rem" }}>
          Römer 11,36
        </p>
      </div>
    </div>
  );
}
