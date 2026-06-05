import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import ContentCardPreview from "@/components/content/ContentCardPreview";
import { LIFECYCLE_OPTIONS } from "@/lib/lifecycle";

const BOARD_COLUMNS = [
  { stage: "draft", count: 1, cards: [{ ep: null, title: "Idee: Geld & Gebet", type: "article" as const, dots: [{ label: "WEB", state: "off" as const }] }] },
  { stage: "scripting", count: 0, cards: [] },
  { stage: "filming", count: 1, cards: [{ ep: 43, title: "Nächster Dreh — Vorbereitung", type: "lfc" as const, dots: [{ label: "YT", state: "off" as const }, { label: "SP", state: "off" as const }], schedule: "Dreh: Fr. 14:00" }] },
  { stage: "editing", count: 2, cards: [
    { ep: 42, title: "Warum du scheiterst, wenn du zu lange wartest", type: "lfc" as const, dots: [{ label: "YT", state: "live" as const }, { label: "SP", state: "scheduled" as const }], schedule: "Geplant: So. 18:00" },
    { ep: null, title: "Clip — 3 Fehler im Mindset", type: "sfc" as const, dots: [{ label: "YT", state: "live" as const }, { label: "TT", state: "off" as const }, { label: "IG", state: "scheduled" as const }] },
  ]},
  { stage: "revision", count: 0, cards: [] },
  { stage: "live", count: 1, cards: [{ ep: 41, title: "EP.41 — Live auf allen Kanälen", type: "lfc" as const, dots: [{ label: "YT", state: "live" as const }, { label: "SP", state: "live" as const }] }] },
];

function pill(active: boolean) {
  return {
    borderColor: active ? "var(--gold)" : "var(--glass-border-subtle)",
    background: active ? "rgba(201,168,76,0.15)" : "transparent",
    color: active ? "var(--cream)" : "var(--text-on-glass-muted)",
    fontFamily: "var(--font-cinzel)",
    letterSpacing: "0.06em" as const,
    fontSize: "0.6rem",
  };
}

export default function DesignPreviewPage() {
  return (
    <div className="cms-shell min-h-dvh">
      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto flex flex-col gap-10">
        <PageHeader
          title="Design Preview"
          subtitle="Dark Liquid Glass · Content Hub"
          description="Abnahme nach Phase 1–6 — Board, Quick Create, Edit Panel live unter /content"
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/content" className="text-xs px-4 py-2 rounded cms-glass-strong" style={{ color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            → Live Hub
          </Link>
          <Link href="/content/new?type=lfc" className="text-xs px-4 py-2 rounded border" style={{ ...pill(false), padding: "0.5rem 1rem" }}>
            → Quick Create
          </Link>
        </div>

        {/* Full Hub mockup */}
        <section>
          <h2 className="cms-glass-title mb-4">Content Hub — Board (Desktop)</h2>

          {/* Header mock */}
          <div className="cms-glass p-4 mb-4 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)", fontSize: "1.25rem" }}>Content Hub</h3>
                <p className="text-xs" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
                  24 Einträge · LFC
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-3 py-2 rounded border" style={pill(true)}>Board</span>
                <span className="text-xs px-3 py-2 rounded border" style={pill(false)}>Tabelle</span>
                <span className="text-xs px-4 py-2 rounded cms-glass-strong" style={{ color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>+ NEU</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Alle", "LFC", "SFC", "Artikel", "Posts"].map((label, i) => (
                <span key={label} className="text-xs px-3 py-1.5 rounded border" style={pill(i === 1)}>
                  {label}
                </span>
              ))}
              <span className="text-xs px-3 py-1.5 rounded border ml-auto" style={pill(false)}>Heute fällig</span>
            </div>
          </div>

          {/* Board columns */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {LIFECYCLE_OPTIONS.map(opt => {
              const col = BOARD_COLUMNS.find(c => c.stage === opt.value);
              const cards = col?.cards ?? [];
              return (
                <div key={opt.value} className="cms-glass-column flex flex-col gap-2 p-3 min-w-[200px] w-[200px] shrink-0">
                  <div className="flex items-center justify-between px-0.5 mb-1">
                    <span className="cms-glass-title">{opt.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cards.length ? "rgba(201,168,76,0.15)" : "rgba(245,238,216,0.05)", color: cards.length ? "var(--gold-light)" : "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
                      {cards.length}
                    </span>
                  </div>
                  {cards.length === 0 ? (
                    <p className="text-xs py-4 text-center" style={{ color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>—</p>
                  ) : (
                    cards.map((card, i) => (
                      <ContentCardPreview
                        key={i}
                        episodeNumber={card.ep}
                        title={card.title}
                        type={card.type}
                        platforms={card.dots}
                        scheduleLabel={"schedule" in card ? card.schedule : undefined}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Create + Edit panel mock */}
        <section>
          <h2 className="cms-glass-title mb-4">Quick Create & Edit Panel</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="cms-glass-strong p-5 rounded-lg border" style={{ borderColor: "var(--glass-border-subtle)" }}>
              <h3 className="cms-glass-title mb-3">Quick Create</h3>
              <p className="text-sm mb-4" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
                Slide-over · Typ → Titel → optional URL
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {["LFC", "SFC", "Artikel", "Post"].map((t, i) => (
                  <span key={t} className="text-xs px-3 py-2 rounded border" style={pill(i === 0)}>{t}</span>
                ))}
              </div>
              <div className="cms-input text-sm mb-3 opacity-80" style={{ padding: "0.5rem 0.75rem" }}>
                Titel…
              </div>
              <div className="cms-input text-sm mb-4 opacity-60" style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
                YouTube-Link (optional)
              </div>
              <span className="text-xs px-4 py-2 rounded inline-block" style={{ background: "rgba(201,168,76,0.25)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
                Anlegen
              </span>
            </div>

            <div className="cms-glass-strong p-5 rounded-lg border" style={{ borderColor: "var(--glass-border-subtle)" }}>
              <h3 className="cms-glass-title mb-3">Edit Panel — Status</h3>
              <div className="flex gap-1 border-b mb-4 pb-2" style={{ borderColor: "var(--glass-border-subtle)" }}>
                {["Status", "Details", "Inhalt"].map((t, i) => (
                  <span key={t} className="text-xs px-3 py-1" style={{ color: i === 0 ? "var(--cream)" : "var(--text-on-glass-muted)", borderBottom: i === 0 ? "2px solid var(--gold)" : "none", fontFamily: "var(--font-cinzel)" }}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="cms-label mb-2">Lifecycle</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {LIFECYCLE_OPTIONS.map((o, i) => (
                  <span key={o.value} className="text-xs px-2 py-1 rounded border" style={pill(i === 3)}>
                    {o.label}
                  </span>
                ))}
              </div>
              <p className="cms-label mb-2">Plattformen</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1"><span className="cms-dot cms-dot-live" /><span className="text-xs" style={{ color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>YT</span></div>
                <div className="flex items-center gap-1"><span className="cms-dot cms-dot-scheduled" /><span className="text-xs" style={{ color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}>SP</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar + column peek (compact) */}
        <section>
          <h2 className="cms-glass-title mb-4">Navigation</h2>
          <div className="flex gap-4 min-h-[200px]">
            <aside className="cms-glass w-44 shrink-0 p-3 flex flex-col gap-1 rounded-lg">
              <div className="cms-glass-nav-active flex items-center gap-2 px-3 py-2 rounded-sm text-sm cms-glass-strong">
                <span style={{ color: "var(--gold-light)" }}>▤</span>
                <span style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--cream)" }}>Content</span>
              </div>
              {["Dashboard", "Analytics", "Das Fundament"].map(label => (
                <div key={label} className="cms-glass-nav-item flex items-center gap-2 px-3 py-2 rounded-sm text-sm">
                  <span style={{ fontFamily: "var(--font-eb-garamond)" }}>{label}</span>
                </div>
              ))}
            </aside>
            <p className="text-sm self-center" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
              Content nav item = hero glass when active · Fundament → /content?type=article
            </p>
          </div>
        </section>

        {/* Glass surfaces */}
        <section>
          <h2 className="cms-glass-title mb-4">Glass Surfaces</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="cms-glass p-4">
              <h3 className="cms-glass-title mb-2">cms-glass</h3>
              <p className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)" }}>
                Standard panel — Sidebar, Spalten.
              </p>
            </div>
            <div className="cms-glass-strong cms-glass-hover p-4 cursor-default">
              <h3 className="cms-glass-title mb-2">cms-glass-strong + hover</h3>
              <p className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)" }}>
                Karten, aktive Nav, Modals.
              </p>
            </div>
          </div>
        </section>

        {/* Platform dots */}
        <section>
          <h2 className="cms-glass-title mb-4">Platform Dots</h2>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { cls: "cms-dot-off", label: "Offen" },
              { cls: "cms-dot-scheduled", label: "Geplant" },
              { cls: "cms-dot-live", label: "Live" },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-2">
                <span className={`cms-dot ${d.cls}`} />
                <span className="text-sm" style={{ color: "var(--text-on-glass-muted)", fontFamily: "var(--font-eb-garamond)" }}>{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Colors + Typography */}
        <section>
          <h2 className="cms-glass-title mb-4">Farben & Typografie</h2>
          <div className="flex gap-3 flex-wrap mb-6">
            {[
              { name: "Navy", bg: "#05101f", text: "#f5eed8" },
              { name: "Gold", bg: "#c9a84c", text: "#05101f" },
              { name: "Cream", bg: "#f5eed8", text: "#05101f" },
              { name: "Glass", bg: "rgba(245,238,216,0.11)", text: "#f5eed8", border: "rgba(201,168,76,0.22)" },
            ].map(c => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded border" style={{ background: c.bg, borderColor: c.border ?? "var(--glass-border-subtle)" }} />
                <span className="text-xs text-center cms-glass-title">{c.name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 cms-glass p-4">
            <h1 style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)", fontSize: "1.75rem" }}>Eckstein Podcast</h1>
            <h2 style={{ fontFamily: "var(--font-cormorant)", color: "var(--gold-pale)", fontStyle: "italic", fontSize: "1.4rem" }}>Content Hub</h2>
            <p style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass)", fontSize: "1.05rem" }}>
              Scan → Act → Confirm. Wo steht es · Was fehlt · Was ist heute dran.
            </p>
          </div>
        </section>

        {/* Legacy components */}
        <section>
          <h2 className="cms-glass-title mb-4">Legacy cms-* in Shell</h2>
          <div className="flex gap-3 flex-wrap items-center mb-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge status="draft" />
            <Badge status="scheduled" />
            <Badge status="published" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Episoden" value={12} accent />
            <StatCard label="Views" value="48.2K" />
          </div>
          <div className="cms-card">
            <h3 className="cms-card-title">cms-card (auto-glass)</h3>
            <p className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-secondary)" }}>
              Bestehende Seiten nutzen cms-card — innerhalb cms-shell wird automatisch Glass gerendert.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
