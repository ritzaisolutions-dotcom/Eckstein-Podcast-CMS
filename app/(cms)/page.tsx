import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date) {
  return `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

// Placeholder data — will be replaced with real DB queries once Cloudflare bindings are live
const MOCK = {
  todayDue: [
    { label: "Ep.12 → Rumble hochladen", href: "/episodes" },
    { label: "Ep.12 → X-Post posten", href: "/posts" },
    { label: "Newsletter live schalten", href: "/newsletter" },
  ],
  thisWeek: [
    { label: "Clip-Queue: 4 offen", href: "/shorts" },
    { label: "Ep.13 Prep: in Arbeit", href: "/prep" },
    { label: "Gast-Anfrage: ausstehend", href: "/guests" },
  ],
  checklist: { done: 6, total: 10, episode: "Ep.12" },
  openClips: [
    { note: "Hook über Scheitern", timestamp: "0:34", episode: "Ep.12" },
    { note: "Florian's Konter", timestamp: "8:12", episode: "Ep.12" },
  ],
  nextEpisode: { number: 13, title: "Arbeitstitel: TBD", date: "Sonntag 25.05. 18:00", prepStatus: "strukturieren" },
  mindDumpNew: 3,
};

export default function OheDashboard() {
  const today = formatDate(new Date());
  const checklistPct = Math.round((MOCK.checklist.done / MOCK.checklist.total) * 100);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <PageHeader
        title="OHE"
        subtitle={today}
        description="Offene · Heute · Everything"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Heute fällig" value={MOCK.todayDue.length} accent />
        <StatCard label="Diese Woche" value={MOCK.thisWeek.length} />
        <StatCard label="Offene Clips" value={MOCK.openClips.length} />
        <StatCard label="Mind Dump neu" value={MOCK.mindDumpNew} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Heute fällig */}
        <section className="cms-card">
          <h2 className="cms-card-title">Heute fällig</h2>
          {MOCK.todayDue.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Alles erledigt 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {MOCK.todayDue.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded border shrink-0 mt-0.5" style={{ borderColor: "var(--gold)", background: "transparent" }} />
                  <Link href={item.href} className="text-sm hover:underline" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Diese Woche */}
        <section className="cms-card">
          <h2 className="cms-card-title">Diese Woche</h2>
          <ul className="flex flex-col gap-2">
            {MOCK.thisWeek.map((item, i) => (
              <li key={i}>
                <Link href={item.href} className="text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
                  → {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Checkliste */}
        <section className="cms-card">
          <h2 className="cms-card-title">
            Checkliste {MOCK.checklist.episode}
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              {MOCK.checklist.done}/{MOCK.checklist.total}
            </span>
          </h2>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--cream-mid)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${checklistPct}%`, background: checklistPct === 100 ? "#4caf7d" : "var(--gold)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            {checklistPct}% erledigt
          </p>
          <Link href="/episodes" className="inline-block mt-3 text-xs" style={{ color: "var(--gold)" }}>
            Zur Episode →
          </Link>
        </section>

        {/* Clip Queue */}
        <section className="cms-card">
          <h2 className="cms-card-title">
            Clip Queue
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              {MOCK.openClips.length} offen
            </span>
          </h2>
          {MOCK.openClips.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Queue leer</p>
          ) : (
            <ul className="flex flex-col gap-2 mt-1">
              {MOCK.openClips.map((clip, i) => (
                <li key={i} className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem" }}>
                    {clip.episode} · {clip.timestamp}
                  </span>
                  <span className="ml-2">{clip.note}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/shorts" className="inline-block mt-3 text-xs" style={{ color: "var(--gold)" }}>
            Zur Clip Queue →
          </Link>
        </section>

        {/* Nächste Episode */}
        <section className="cms-card md:col-span-2" style={{ borderTopColor: "var(--gold)", borderTopWidth: 2 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="cms-card-title">
                Nächste Episode
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  #{MOCK.nextEpisode.number}
                </span>
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                {MOCK.nextEpisode.title}
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>📅 {MOCK.nextEpisode.date}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Prep: {MOCK.nextEpisode.prepStatus}</span>
              </div>
            </div>
            <Link href="/prep" className="shrink-0 text-xs px-3 py-1.5 rounded border transition-colors" style={{ borderColor: "var(--gold)", color: "var(--gold)", fontFamily: "var(--font-cinzel)" }}>
              Zum Prep →
            </Link>
          </div>
        </section>
      </div>

      {/* Mind Dump teaser */}
      {MOCK.mindDumpNew > 0 && (
        <div className="mt-4 flex items-center justify-between px-4 py-3 rounded border" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ⊕ {MOCK.mindDumpNew} neue Mind-Dump-Einträge
          </span>
          <Link href="/mind-dump" className="text-xs" style={{ color: "var(--gold)" }}>Ansehen →</Link>
        </div>
      )}
    </div>
  );
}
