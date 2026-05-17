export const dynamic = "force-dynamic";
import Link from "next/link";
import { desc } from "drizzle-orm";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { getDb, vaultEntries } from "@/lib/db";

const STALE_DAYS = 180;

const SEED_ENTRIES = [
  {
    category: "platform", platformSlug: "youtube", title: "YouTube Eckstein Podcast",
    loginUrl: "https://studio.youtube.com",
    quickLinks: JSON.stringify([{ label: "Studio", url: "https://studio.youtube.com" }, { label: "Analytics", url: "https://studio.youtube.com/channel/analytics" }, { label: "Upload", url: "https://www.youtube.com/upload" }]),
  },
  {
    category: "platform", platformSlug: "rumble", title: "Rumble Eckstein",
    loginUrl: "https://rumble.com/account",
    quickLinks: JSON.stringify([{ label: "Dashboard", url: "https://rumble.com/account" }]),
  },
  {
    category: "platform", platformSlug: "spotify", title: "Spotify Podcast",
    loginUrl: "https://podcasters.spotify.com",
    quickLinks: JSON.stringify([{ label: "Dashboard", url: "https://podcasters.spotify.com" }]),
  },
  {
    category: "platform", platformSlug: "instagram", title: "Instagram @eckstein_podcast",
    loginUrl: "https://www.instagram.com",
    quickLinks: JSON.stringify([{ label: "Creator Studio", url: "https://business.facebook.com" }, { label: "Insights", url: "https://www.instagram.com/accounts/insights/" }]),
  },
  {
    category: "platform", platformSlug: "tiktok", title: "TikTok @eckstein_podcast",
    loginUrl: "https://www.tiktok.com/creator-center",
    quickLinks: JSON.stringify([{ label: "Creator Center", url: "https://www.tiktok.com/creator-center" }]),
  },
  {
    category: "platform", platformSlug: "x", title: "X / Twitter @EcksteinPodcast",
    loginUrl: "https://x.com",
    quickLinks: JSON.stringify([{ label: "Analytics", url: "https://analytics.twitter.com" }, { label: "Post", url: "https://x.com/compose/tweet" }]),
  },
  {
    category: "platform", platformSlug: "substack", title: "Substack — Das Fundament",
    loginUrl: "https://substack.com/dashboard",
    quickLinks: JSON.stringify([{ label: "Dashboard", url: "https://substack.com/dashboard" }, { label: "Subscribers", url: "https://substack.com/dashboard/subscribers" }]),
  },
] as const;

export default async function VaultPage() {
  const db = getDb();
  const staleMs = STALE_DAYS * 86_400_000;

  // Seed if empty
  const existing = await db.select({ id: vaultEntries.id }).from(vaultEntries).limit(1);
  if (existing.length === 0) {
    for (const seed of SEED_ENTRIES) {
      await db.insert(vaultEntries).values({
        id: crypto.randomUUID(),
        category: seed.category,
        platformSlug: seed.platformSlug,
        title: seed.title,
        loginUrl: seed.loginUrl,
        quickLinks: seed.quickLinks,
        tags: "[]",
      });
    }
  }

  const rows = await db
    .select({ id: vaultEntries.id, title: vaultEntries.title, username: vaultEntries.username, loginUrl: vaultEntries.loginUrl, lastRotatedAt: vaultEntries.lastRotatedAt, platformSlug: vaultEntries.platformSlug, quickLinks: vaultEntries.quickLinks })
    .from(vaultEntries)
    .orderBy(desc(vaultEntries.updatedAt));

  const entries = rows.map(e => ({
    ...e,
    stale: e.lastRotatedAt ? (Date.now() - new Date(e.lastRotatedAt).getTime()) > staleMs : false,
    quickLinksArr: (() => { try { return JSON.parse(e.quickLinks ?? "[]") as { label: string; url: string }[]; } catch { return []; } })(),
  }));

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

      <div className="mb-4 px-4 py-3 rounded border text-sm" style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
        ⚠️ Kein Ersatz für 1Password/Bitwarden. Nutze dies als Operations-Hub für Eckstein-Accounts — nicht als primären Passwort-Manager.
      </div>

      <div className="flex flex-col gap-2">
        {entries.map(entry => (
          <div key={entry.id} className="cms-card flex items-center gap-4" style={{ borderLeftWidth: entry.stale ? 3 : 1, borderLeftColor: entry.stale ? "#e57373" : "var(--border)" }}>
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-sm" style={{ background: "var(--navy)", color: "var(--gold)" }}>
              ⬘
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>{entry.title}</span>
                {entry.stale && (
                  <span className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "rgba(229,115,115,0.15)", color: "#c62828", border: "1px solid rgba(229,115,115,0.3)" }}>
                    PW veraltet
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-1 flex-wrap items-center">
                {entry.username && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{entry.username}</span>}
                {entry.loginUrl && (
                  <a href={entry.loginUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--gold)" }}>Login →</a>
                )}
                {entry.quickLinksArr.map(ql => (
                  <a key={ql.url} href={ql.url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {ql.label} ↗
                  </a>
                ))}
              </div>
            </div>
            <Link href={`/vault/${entry.id}`}>
              <Button variant="secondary" size="sm">Öffnen</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
