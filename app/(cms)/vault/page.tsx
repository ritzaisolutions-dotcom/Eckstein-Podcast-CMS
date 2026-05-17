import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Alle", "Plattformen", "Infra", "Mail", "Zahlung", "Tools", "Misc"];

const MOCK = [
  { id: "1", category: "platform", title: "YouTube Eckstein Kanal", username: "eckstein_podcast", loginUrl: "https://studio.youtube.com", lastRotated: "2026-01-10", stale: false },
  { id: "2", category: "platform", title: "Instagram @eckstein_podcast", username: "eckstein_podcast", loginUrl: "https://instagram.com", lastRotated: "2025-10-01", stale: true },
  { id: "3", category: "infra", title: "Cloudflare Account", username: "kevin@ritz-ai.solutions", loginUrl: "https://dash.cloudflare.com", lastRotated: "2026-02-15", stale: false },
];

const DAY_MS = 86_400_000;
const STALE_DAYS = 180;

export default function VaultPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Vault"
        subtitle="Passwörter & Accounts"
        actions={
          <Link href="/vault/new">
            <Button size="sm">+ Eintrag</Button>
          </Link>
        }
      />

      {/* Disclaimer */}
      <div className="mb-4 px-4 py-3 rounded border text-sm" style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
        ⚠️ Kein Ersatz für 1Password/Bitwarden. Nutze dies als Operations-Hub für Eckstein-Accounts — nicht als primären Passwort-Manager.
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(c => (
          <button key={c} className="px-3 py-1.5 rounded border text-xs" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.1em", borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-surface)" }}>
            {c}
          </button>
        ))}
        <input type="search" placeholder="Suchen..." className="cms-input" style={{ maxWidth: 180 }} />
      </div>

      <div className="flex flex-col gap-2">
        {MOCK.map(entry => (
          <div
            key={entry.id}
            className="cms-card flex items-center gap-4"
            style={{ borderLeftWidth: entry.stale ? 3 : 1, borderLeftColor: entry.stale ? "#e57373" : "var(--border)" }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-sm"
              style={{ background: "var(--navy)", color: "var(--gold)" }}
            >
              ⬘
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                  {entry.title}
                </span>
                {entry.stale && (
                  <span className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "rgba(229,115,115,0.15)", color: "#c62828", border: "1px solid rgba(229,115,115,0.3)" }}>
                    PW veraltet
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{entry.username}</span>
                <a href={entry.loginUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                  Login →
                </a>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/vault/${entry.id}`}>
                <Button variant="secondary" size="sm">Öffnen</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
