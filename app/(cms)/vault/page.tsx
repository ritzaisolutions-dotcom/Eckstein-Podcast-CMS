import Link from "next/link";
import { desc } from "drizzle-orm";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { getDb, vaultEntries } from "@/lib/db";

export const dynamic = "force-dynamic";

interface VaultListEntry {
  id: string;
  title: string;
  username: string | null;
  loginUrl: string | null;
  stale: boolean;
}

async function loadEntries(): Promise<VaultListEntry[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@opennextjs/cloudflare");
    const { env } = getRequestContext();
    if (!env.DB) return [];

    const db = getDb(env.DB as D1Database);
    const rows = await db
      .select({
        id: vaultEntries.id,
        title: vaultEntries.title,
        username: vaultEntries.username,
        loginUrl: vaultEntries.loginUrl,
        lastRotatedAt: vaultEntries.lastRotatedAt,
      })
      .from(vaultEntries)
      .orderBy(desc(vaultEntries.updatedAt));

    const staleMs = 180 * 86_400_000;
    return rows.map((entry) => ({
      id: entry.id,
      title: entry.title,
      username: entry.username,
      loginUrl: entry.loginUrl,
      stale: entry.lastRotatedAt
        ? Date.now() - entry.lastRotatedAt.getTime() > staleMs
        : false,
    }));
  } catch {
    return [];
  }
}

export default async function VaultPage() {
  const entries = await loadEntries();

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Vault"
        subtitle="Passwoerter & Accounts"
        actions={(
          <Link href="/vault/new">
            <Button size="sm">+ Eintrag</Button>
          </Link>
        )}
      />

      <div
        className="mb-4 px-4 py-3 rounded border text-sm"
        style={{
          borderColor: "rgba(201,168,76,0.3)",
          background: "rgba(201,168,76,0.06)",
          color: "var(--text-muted)",
          fontFamily: "var(--font-eb-garamond)",
          fontStyle: "italic",
        }}
      >
        Kein Ersatz fuer 1Password oder Bitwarden. Nutze dies als Operations-Hub fuer
        Eckstein-Accounts, nicht als primaeren Passwort-Manager.
      </div>

      {entries.length === 0 ? (
        <div className="cms-card">
          <p
            className="text-sm"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}
          >
            Noch keine Vault-Eintraege vorhanden.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="cms-card flex items-center gap-4"
              style={{
                borderLeftWidth: entry.stale ? 3 : 1,
                borderLeftColor: entry.stale ? "#e57373" : "var(--border)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-sm"
                style={{ background: "var(--navy)", color: "var(--gold)" }}
              >
                O
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {entry.title}
                  </span>
                  {entry.stale ? (
                    <span
                      className="text-xs px-1.5 rounded"
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.55rem",
                        background: "rgba(229,115,115,0.15)",
                        color: "#c62828",
                        border: "1px solid rgba(229,115,115,0.3)",
                      }}
                    >
                      PW veraltet
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {entry.username ? <span>{entry.username}</span> : null}
                  {entry.loginUrl ? (
                    <a
                      href={entry.loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--gold)" }}
                    >
                      Login -&gt;
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/vault/${entry.id}`}>
                  <Button variant="secondary" size="sm">Oeffnen</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
