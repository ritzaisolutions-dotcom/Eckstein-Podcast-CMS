import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";

export default function DesignPreviewPage() {
  return (
    <div className="px-8 py-10 max-w-4xl mx-auto flex flex-col gap-10">
      <PageHeader title="Design Preview" subtitle="Komponenten-Übersicht" description="Alle UI-Bausteine auf einen Blick" />

      {/* Colors */}
      <section>
        <h2 className="cms-card-title mb-4">Farben</h2>
        <div className="flex gap-3 flex-wrap">
          {[
            { name: "Navy", bg: "#05101f", text: "#f5eed8" },
            { name: "Navy-2", bg: "#081525", text: "#f5eed8" },
            { name: "Navy-3", bg: "#0c1e35", text: "#f5eed8" },
            { name: "Gold", bg: "#c9a84c", text: "#05101f" },
            { name: "Gold Light", bg: "#e2c06a", text: "#05101f" },
            { name: "Gold Pale", bg: "#f0dca0", text: "#05101f" },
            { name: "Cream", bg: "#f5eed8", text: "#05101f" },
          ].map(c => (
            <div key={c.name} className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded border" style={{ background: c.bg, borderColor: "var(--border)" }} />
              <span className="text-xs text-center" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", color: "var(--text-muted)" }}>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="cms-card-title mb-4">Typografie</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Cinzel — Headlines, Buttons</p>
            <h1 style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Eckstein Podcast</h1>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Cormorant Garamond — Subheadlines</p>
            <h2 style={{ fontFamily: "var(--font-cormorant)", color: "var(--navy-3)", fontStyle: "italic", fontSize: "1.6rem" }}>Direkt. Klar. Kein Bullshit.</h2>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>EB Garamond — Body, Inputs</p>
            <p style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)", fontSize: "1.1rem" }}>
              Kevin Ritz und Florian Spieß sprechen über das, was wirklich zählt. Jeden Sonntag um 18:00 Uhr.
            </p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="cms-card-title mb-4">Buttons</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="cms-card-title mb-4">Status Badges</h2>
        <div className="flex gap-2 flex-wrap">
          {["draft", "scheduled", "published", "posted", "idea", "in_arbeit", "umgesetzt", "verworfen", "sammeln", "strukturieren", "ready_to_record", "recorded"].map(s => (
            <Badge key={s} status={s} />
          ))}
        </div>
      </section>

      {/* Stat Cards */}
      <section>
        <h2 className="cms-card-title mb-4">Stat Cards</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Views" value="48.2K" accent />
          <StatCard label="Episoden" value={12} />
          <StatCard label="Nächster Drop" value="So. 18:00" />
          <StatCard label="Mind Dump" value={7} />
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="cms-card-title mb-4">Inputs</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <div>
            <label className="cms-label">Text Input</label>
            <input type="text" className="cms-input" placeholder="Episodentitel..." />
          </div>
          <div>
            <label className="cms-label">Textarea</label>
            <textarea className="cms-input" rows={3} style={{ resize: "vertical" }} placeholder="Beschreibung..." />
          </div>
          <div>
            <label className="cms-label">Select</label>
            <select className="cms-input">
              <option>Entwurf</option>
              <option>Geplant</option>
              <option>Live</option>
            </select>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="cms-card-title mb-4">Cards</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="cms-card">
            <h3 className="cms-card-title">Standard Card</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
              Cream-Hintergrund, navy Text, Gold als Akzent. Die Basis für alle CMS-Panels.
            </p>
          </div>
          <div className="cms-card" style={{ borderTopWidth: 2, borderTopColor: "var(--gold)" }}>
            <h3 className="cms-card-title">Gold-Accent Card</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>
              Für wichtige Panels — nächste Episode, Heute-fällig-Header, Hero-Stats.
            </p>
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="cms-card-title mb-4">Tabelle</h2>
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table">
            <thead>
              <tr><th>#</th><th>Episode</th><th>Status</th><th>Views</th></tr>
            </thead>
            <tbody>
              <tr><td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)" }}>12</td><td>Warum du scheiterst</td><td><Badge status="published" /></td><td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>4.210</td></tr>
              <tr><td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)" }}>11</td><td>Die Lüge der Balance</td><td><Badge status="published" /></td><td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>3.890</td></tr>
              <tr><td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)" }}>13</td><td style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Kein Titel</td><td><Badge status="draft" /></td><td style={{ color: "var(--text-muted)" }}>—</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
