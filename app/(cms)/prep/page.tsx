import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", episodeNumber: 13, workingTitle: "Demut als Stärke?", status: "strukturieren", plannedDate: "2026-05-25", sectionsTotal: 10, sectionsDone: 4 },
  { id: "2", episodeNumber: 12, workingTitle: "Warum du scheiterst", status: "recorded", plannedDate: "2026-05-11", sectionsTotal: 10, sectionsDone: 10 },
];

export default function PrepPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Episode Prep"
        subtitle="Roter Faden & Vorbereitung"
        actions={
          <Link href="/prep/new">
            <Button size="sm">+ Neuer Prep</Button>
          </Link>
        }
      />
      <div className="flex flex-col gap-3">
        {MOCK.map(prep => {
          const pct = Math.round((prep.sectionsDone / prep.sectionsTotal) * 100);
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
                {prep.episodeNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                    {prep.workingTitle}
                  </span>
                  <Badge status={prep.status} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--cream-mid)", maxWidth: 120 }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#4caf7d" : "var(--gold)" }} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prep.sectionsDone}/{prep.sectionsTotal} Sections</span>
                </div>
              </div>
              <div className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                📅 {prep.plannedDate}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
