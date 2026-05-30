import { getDb, vaultEntries } from "@/lib/db";

export const VAULT_SEED_ENTRIES = [
  {
    category: "platform", platformSlug: "youtube", title: "YouTube Eckstein Podcast",
    loginUrl: "https://studio.youtube.com",
    quickLinks: JSON.stringify([{ label: "Kanal", url: "https://www.youtube.com/@EcksteinPodcast" }, { label: "Studio", url: "https://studio.youtube.com" }, { label: "Analytics", url: "https://studio.youtube.com/channel/analytics" }, { label: "Upload", url: "https://www.youtube.com/upload" }]),
  },
  {
    category: "platform", platformSlug: "rumble", title: "Rumble Eckstein",
    loginUrl: "https://rumble.com/account",
    quickLinks: JSON.stringify([{ label: "Kanal", url: "https://rumble.com/c/EcksteinPodcast" }, { label: "Dashboard", url: "https://rumble.com/account" }]),
  },
  {
    category: "platform", platformSlug: "spotify", title: "Spotify Podcast",
    loginUrl: "https://podcasters.spotify.com",
    quickLinks: JSON.stringify([{ label: "Dashboard", url: "https://podcasters.spotify.com" }, { label: "Analytics", url: "https://podcasters.spotify.com/analytics" }]),
  },
  {
    category: "platform", platformSlug: "instagram", title: "Instagram @eckstein_podcast",
    loginUrl: "https://www.instagram.com",
    quickLinks: JSON.stringify([{ label: "Profil", url: "https://www.instagram.com/eckstein_podcast/" }, { label: "Insights", url: "https://www.instagram.com/accounts/insights/" }, { label: "Creator Studio", url: "https://business.facebook.com" }]),
  },
  {
    category: "platform", platformSlug: "tiktok", title: "TikTok @eckstein_podcast",
    loginUrl: "https://www.tiktok.com/creator-center",
    quickLinks: JSON.stringify([{ label: "Profil", url: "https://www.tiktok.com/@eckstein_podcast" }, { label: "Creator Center", url: "https://www.tiktok.com/creator-center" }]),
  },
  {
    category: "platform", platformSlug: "x", title: "X / Twitter @EcksteinPodcast",
    loginUrl: "https://x.com/login",
    quickLinks: JSON.stringify([{ label: "Profil", url: "https://x.com/EcksteinPodcast" }, { label: "Analytics", url: "https://analytics.twitter.com" }, { label: "Post", url: "https://x.com/compose/tweet" }]),
  },
  {
    category: "platform", platformSlug: "substack", title: "Substack — Das Fundament",
    loginUrl: "https://substack.com/dashboard",
    quickLinks: JSON.stringify([{ label: "Dashboard", url: "https://substack.com/dashboard" }, { label: "Subscribers", url: "https://substack.com/dashboard/subscribers" }]),
  },
] as const;

/** Idempotent seed — run via `pnpm db:seed-vault`, not on page load. */
export async function ensureVaultPlatformSeeds(): Promise<number> {
  const db = getDb();
  const existingSlugs = await db.select({ slug: vaultEntries.platformSlug }).from(vaultEntries);
  const slugSet = new Set(existingSlugs.map(r => r.slug).filter(Boolean));
  const missing = VAULT_SEED_ENTRIES.filter(seed => !slugSet.has(seed.platformSlug));
  if (missing.length === 0) return 0;

  await db.insert(vaultEntries).values(
    missing.map(seed => ({
      id: crypto.randomUUID(),
      category: seed.category,
      platformSlug: seed.platformSlug,
      title: seed.title,
      loginUrl: seed.loginUrl,
      quickLinks: seed.quickLinks,
      tags: "[]",
    })),
  );
  return missing.length;
}
