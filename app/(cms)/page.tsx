export const dynamic = "force-dynamic";
export const maxDuration = 30;
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCachedPlatforms, getCachedContentCounts } from "@/lib/cache";
import { contentPieces, contentPlatformLinks, episodeTasks, forumThreads, analyticsSnapshots } from "@/lib/db/schema";
import { eq, and, lte, isNull, isNotNull, count, desc, gte, inArray, or, sql } from "drizzle-orm";

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date) {
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

const LIFECYCLE_PIPELINE = ["draft", "scripting", "filming", "editing", "revision", "live"];
const PIPELINE_LABELS: Record<string, string> = {
  draft: "Draft", scripting: "Scripting", filming: "Filming",
  editing: "Editing", revision: "Revision", live: "Live",
};

function ampelColor(stage: string): string {
  if (stage === "live") return "#4caf7d";
  if (stage === "editing" || stage === "revision") return "var(--gold)";
  if (stage === "filming") return "var(--gold)";
  return "rgba(12,30,53,0.25)";
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

export default async function Dashboard() {
  const db = getDb();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    { total: totalCount, byType: countByType },
    platformRows,
    dueTodayLinks,
    dueWeekLinks,
    recentEps,
    newIdeas,
    latestPublished,
    recentIdeas,
    platViews,
  ] = await Promise.all([
    getCachedContentCounts(),
    getCachedPlatforms(),

    // Heute fällig
    db.select({
        contentId: contentPlatformLinks.contentId,
        platformId: contentPlatformLinks.platformId,
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
      .limit(6),

    // Diese Woche
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
      .limit(6),

    // Recent LFCs for pipeline view
    db.select()
      .from(contentPieces)
      .where(eq(contentPieces.type, "lfc"))
      .orderBy(desc(contentPieces.createdAt))
      .limit(5),

    // Neue Ideen count
    db.select({ cnt: count() })
      .from(forumThreads)
      .where(gte(forumThreads.createdAt, weekAgo)),

    // Latest published for KPI
    db.select()
      .from(contentPieces)
      .where(and(eq(contentPieces.type, "lfc"), eq(contentPieces.status, "published")))
      .orderBy(desc(contentPieces.uploadDate))
      .limit(1),

    // Recent ideas for display
    db.select({ id: forumThreads.id, title: forumThreads.title })
      .from(forumThreads)
      .orderBy(desc(forumThreads.createdAt))
      .limit(4),

    // Platform performance aggregate
    db.select({
        platformId: analyticsSnapshots.platformId,
        views: sql<number>`SUM(${analyticsSnapshots.views})`.as("views"),
      })
      .from(analyticsSnapshots)
      .groupBy(analyticsSnapshots.platformId)
      .orderBy(desc(sql`SUM(${analyticsSnapshots.views})`))
      .limit(4),
  ]);

  const platformMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));
  const newIdeasCount = Number(newIdeas[0]?.cnt ?? 0);

  // Episode tasks + KPI snaps fetched in parallel (second batch)
  const recentEpIds = recentEps.map(e => e.id);
  type EpisodeTask = typeof episodeTasks.$inferSelect;
  type KpiSnap = { views: number };
  const [allTasks, kpiSnaps] = await Promise.all([
    recentEpIds.length > 0
      ? db.select().from(episodeTasks).where(inArray(episodeTasks.contentId, recentEpIds))
      : Promise.resolve([] as EpisodeTask[]),
    latestPublished.length > 0
      ? db.select({ views: analyticsSnapshots.views })
          .from(analyticsSnapshots)
          .where(eq(analyticsSnapshots.contentId, latestPublished[0].id))
          .orderBy(desc(analyticsSnapshots.capturedAt))
          .limit(2)
      : Promise.resolve([] as KpiSnap[]),
  ]);

  const tasksByEp: Record<string, typeof allTasks> = {};
  for (const t of allTasks) {
    if (!tasksByEp[t.contentId]) tasksByEp[t.contentId] = [];
    tasksByEp[t.contentId].push(t);
  }

  const kpiNumber = latestPublished[0]?.episodeNumber ?? null;
  const kpiViews = kpiSnaps[0]?.views ?? 0;
  const kpiPrevViews = kpiSnaps[1]?.views ?? 0;

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            {formatDate(today)}
          </p>
        </div>
        {kpiViews > 0 && (
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: "0.55rem" }}>
              {kpiNumber ? `EP.${kpiNumber}` : "Letzte Episode"} · Views
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-2xl" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>{fmt(kpiViews)}</span>
              {kpiPrevViews > 0 && (
                <span className="text-xs" style={{ color: kpiViews >= kpiPrevViews ? "#4caf7d" : "#c0392b" }}>
                  {kpiViews >= kpiPrevViews ? "↑" : "↓"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gesamt-Zahl — grosse Zeile */}
      <div className="cms-card mb-3 py-4 px-5 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: "0.55rem" }}>
            Content Pieces gesamt
          </span>
          <div className="text-4xl mt-0.5" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)", lineHeight: 1 }}>
            {totalCount}
          </div>
        </div>
        <Link href="/content" className="text-xs px-3 py-1.5 rounded border transition-colors shrink-0" style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}>
          Alle ansehen →
        </Link>
      </div>

      {/* 4 Type-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {[
          { type: "lfc",         label: "Episoden",  sub: "Long Form Content" },
          { type: "sfc",         label: "Shorts",    sub: "Short Form Content" },
          { type: "article",     label: "Artikel",   sub: "Das Fundament" },
          { type: "social_post", label: "Beiträge",  sub: "Social Posts" },
        ].map(({ type, label, sub }) => (
          <Link key={type} href={`/content?type=${type}`} className="cms-card hover:border-gold transition-colors text-center py-4">
            <div className="text-2xl" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
              {countByType[type] ?? 0}
            </div>
            <div className="text-xs mt-0.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: "0.6rem" }}>
              {label}
            </div>
            <div className="text-xs mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem" }}>
              {sub}
            </div>
          </Link>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">

        {/* Heute fällig */}
        <section className="cms-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="cms-card-title mb-0">Heute fällig</h2>
            {dueTodayLinks.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(192,57,43,0.1)", color: "#c0392b", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
                {dueTodayLinks.length}
              </span>
            )}
          </div>
          {dueTodayLinks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Alles erledigt ✓</p>
          ) : (
            <ul className="flex flex-col gap-0">
              {dueTodayLinks.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <span className="w-3.5 h-3.5 rounded border shrink-0" style={{ borderColor: "var(--gold)" }} />
                  <Link href={`/content?type=${item.type}`} className="text-sm hover:underline flex-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                    {item.episodeNumber ? `EP.${item.episodeNumber}` : item.title}
                    <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      → {(platformMap[item.platformId] ?? "?").replace("_", " ").toUpperCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Episode Pipeline */}
        <section className="cms-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="cms-card-title mb-0">Episode-Pipeline</h2>
            <Link href="/content?type=lfc" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
              Alle →
            </Link>
          </div>
          {recentEps.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Noch keine Episoden</p>
          ) : (
            <ul className="flex flex-col gap-0">
              {recentEps.map(ep => {
                const stageIdx = LIFECYCLE_PIPELINE.indexOf(ep.lifecycleStage ?? "draft");
                return (
                  <li key={ep.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ampelColor(ep.lifecycleStage ?? "draft") }} />
                    <Link href={`/episodes/${ep.id}`} className="text-xs shrink-0 hover:underline" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", minWidth: 36 }}>
                      {ep.episodeNumber ? `EP.${ep.episodeNumber}` : `#${ep.contentId}`}
                    </Link>
                    <Link href={`/episodes/${ep.id}`} className="text-sm hover:underline flex-1 truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                      {ep.title}
                    </Link>
                    <div className="flex gap-0.5 shrink-0">
                      {LIFECYCLE_PIPELINE.map((s, i) => (
                        <span
                          key={s}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "0.48rem",
                            letterSpacing: "0.04em",
                            background: i < stageIdx ? "var(--cream-mid)" : i === stageIdx ? "rgba(201,168,76,0.2)" : "transparent",
                            color: i < stageIdx ? "var(--text-muted)" : i === stageIdx ? "var(--gold)" : "var(--border)",
                            textDecoration: i < stageIdx ? "line-through" : "none",
                            border: i === stageIdx ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
                          }}
                        >
                          {PIPELINE_LABELS[s]}
                        </span>
                      ))}
                    </div>
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
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Nichts geplant</p>
          ) : (
            <ul className="flex flex-col gap-0">
              {dueWeekLinks.map((item, i) => {
                const isFilming = item.lifecycleStage === "filming" && item.filmingDate;
                const date = isFilming ? item.filmingDate : item.scheduledAt;
                return (
                  <li key={i} className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    {isFilming && (
                      <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>
                        DREH
                      </span>
                    )}
                    <Link href={`/episodes/${item.id}`} className="text-sm hover:underline flex-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
                      {item.episodeNumber ? `EP.${item.episodeNumber}` : item.title}
                    </Link>
                    {date && (
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {new Date(date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Ideen & Topics */}
        <section className="cms-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="cms-card-title mb-0">Ideen & Topics</h2>
            <Link href="/mind-dump" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
              Alle →
            </Link>
          </div>
          {recentIdeas.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Noch keine Ideen</p>
          ) : (
            <ul className="flex flex-col gap-0">
              {recentIdeas.map(idea => (
                <li key={idea.id} className="flex items-start gap-2 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--text-muted)" }} />
                  <Link href={`/mind-dump/${idea.id}`} className="text-sm hover:underline" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
                    {idea.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {newIdeasCount > 0 && (
            <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontStyle: "italic" }}>
              {newIdeasCount} neue diese Woche
            </p>
          )}
        </section>
      </div>

      {/* Plattform-Performance */}
      {platViews.length > 0 && (
        <section className="cms-card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="cms-card-title mb-0">Plattform-Performance</h2>
            <Link href="/analytics" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
              Analytics →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platViews.map(p => {
              const slug = platformMap[p.platformId] ?? String(p.platformId);
              return (
                <div key={p.platformId} className="text-center py-2">
                  <div className="text-lg" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>{fmt(Number(p.views))}</div>
                  <div className="text-xs uppercase tracking-widest mt-0.5" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: "0.55rem" }}>
                    {slug.replace("_", " ")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Leitwort */}
      <div className="mt-8 mb-2 text-center py-6 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-xl md:text-2xl" style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", color: "var(--navy-3)", letterSpacing: "0.02em", lineHeight: 1.4 }}>
          »Denn aus ihm und durch ihn und auf ihn hin ist alles.«
        </p>
        <p className="text-xs mt-2 tracking-widest uppercase" style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold)", fontSize: "0.6rem" }}>
          Römer 11,36
        </p>
      </div>
    </div>
  );
}
