import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <PageHeader title="Einstellungen" />

      <div className="flex flex-col gap-5">
        {/* Passwort */}
        <section className="cms-card flex flex-col gap-4">
          <h2 className="cms-card-title">Passwort ändern</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
            Das Passwort wird als <code>ADMIN_PASSWORD</code> Cloudflare Worker Secret gesetzt. Änderung erfordert <code>wrangler secret put ADMIN_PASSWORD</code>.
          </p>
          <div className="flex gap-2">
            <code className="text-xs px-3 py-2 rounded" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)", fontFamily: "monospace" }}>
              wrangler secret put ADMIN_PASSWORD
            </code>
          </div>
        </section>

        {/* Sonntag-Checkliste Templates */}
        <section className="cms-card flex flex-col gap-4">
          <h2 className="cms-card-title">Sonntag-Checkliste Template</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
            Diese Aufgaben werden bei jeder neuen Episode automatisch erstellt.
          </p>
          <div className="flex flex-col gap-2">
            {[
              "YouTube-Link eintragen", "Rumble hochladen", "Spotify submitted",
              "Shorts geplant", "Newsletter fertig", "X-Post geplant",
              "IG-Post geplant", "Show Notes live", "Thumbnail hochgeladen", "Schlussgebet geprüft",
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-5 text-right shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}>{i + 1}</span>
                <input type="text" defaultValue={task} className="cms-input text-sm" style={{ fontSize: "0.9rem" }} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button size="sm">Speichern</Button>
          </div>
        </section>

        {/* Caption Templates */}
        <section className="cms-card flex flex-col gap-4">
          <h2 className="cms-card-title">Caption-Templates</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
            Variablen: {"{{"} episode_titel {"}}"}, {"{{"} episode_nummer {"}}"}, {"{{"} youtube_url {"}}"}, {"{{"} gast_name {"}}"}
          </p>
          <div className="flex flex-col gap-3">
            {[
              { platform: "X", maxChars: 280, defaultTemplate: "🎙️ Neue Episode #{{episode_nummer}}: {{episode_titel}}\n\n{{youtube_url}}" },
              { platform: "Instagram", maxChars: 2200, defaultTemplate: "{{episode_titel}} 🎙️\n\nNeue Folge des Eckstein Podcasts ist live!" },
            ].map(t => (
              <div key={t.platform} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="cms-label">{t.platform}</label>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>max. {t.maxChars} Zeichen</span>
                </div>
                <textarea
                  defaultValue={t.defaultTemplate}
                  rows={3}
                  className="cms-input"
                  style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button size="sm">Speichern</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
