export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { episodePreps, prepSections } from "@/lib/db/schema";
import { desc, inArray, count, sql } from "drizzle-orm";
import Button from "@/components/ui/Button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sammeln:         { label: "Sammeln",  color: "var(--text-muted)" },
  strukturieren:   { label: "Struktur", color: "var(--gold)" },
  ready_to_record: { label: "Ready",    color: "#4caf7d" },
  recorded:        { label: "Recorded", color: "var(--navy)" },
};

export default async function PrepPage() {
  const db = getDb();

  const preps = await db
    .select()
    .from(episodePreps)
    .orderBy(desc(episodePreps.createdAt))
    .limit(50);

  let sectionStats: Record<string, { total: number; done: number }> = {};

  if (preps.length > 0) {
    const ids = preps.map(p => p.id);
    const rows = await db
      .select({
        prepId: prepSections.prepId,
        total: count(),
        done: sql<number>`COUNT(*) FILTER (WHERE ${prepSections.status} = 'final')`,
      })
      .from(prepSections)
      .where(inArray(prepSections.prepId, ids))
      .groupBy(prepSections.prepId);

    for (const r of rows) {
      sectionStats[r.prepId] = { total: Number(r.total), done: Number(r.done) };
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
            Episode Prep
          </h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            Roter Faden & Vorbereitung
          </p>
        </div>
        <Link href="/prep/new">
          <Button size="sm">+ Neuer Prep</Button>
        </Link>
      </div>

      {preps.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>◉</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Episode-Preps. Erstelle den ersten Prep für deine nächste Episode.
          </p>
          <Link href="/prep/new" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Prep erstellen
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {preps.map(prep => {
            const stats = sectionStats[prep.id] ?? { total: 0, done: 0 };
            const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const statusInfo = STATUS_LABELS[prep.status] ?? { label: prep.status, color: "var(--text-muted)" };

            return (
              <Link
                key={prep.id}
                href={`/prep/${prep.id}`}
                className="cms-card flex items-center gap-4 hover:border-gold transition-colors"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: "var(--navy)", color: "var(--gold)", fontFamily: "var(--font-cinzel)" }}
                >
                  {prep.episodeNumber ?? "–"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                      {prep.workingTitle}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--cream-mid)", color: statusInfo.color, fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.08em" }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  {stats.total > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--cream-mid)", maxWidth: 120 }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#4caf7d" : "var(--gold)" }} />
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stats.done}/{stats.total} Sections</span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine Sections</span>
                  )}
                </div>
                {prep.plannedDate && (
                  <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                    📅 {new Date(prep.plannedDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
