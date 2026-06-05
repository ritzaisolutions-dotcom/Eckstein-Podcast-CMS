export const CONTENT_TYPES = ["lfc", "sfc", "article", "social_post"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface PlatformDef {
  slug: string;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
}

/** Single source of truth — allowed platforms per content type. */
export const PLATFORMS_BY_TYPE: Record<ContentType, PlatformDef[]> = {
  lfc: [
    { slug: "youtube", label: "YouTube", shortLabel: "YT", color: "#c9a84c", bg: "rgba(201,168,76,0.15)" },
    { slug: "spotify", label: "Spotify", shortLabel: "SP", color: "#4caf7d", bg: "rgba(76,175,125,0.12)" },
  ],
  sfc: [
    { slug: "youtube", label: "YouTube", shortLabel: "YT", color: "#c9a84c", bg: "rgba(201,168,76,0.15)" },
    { slug: "tiktok", label: "TikTok", shortLabel: "TT", color: "#e2c06a", bg: "rgba(226,192,106,0.1)" },
    { slug: "instagram", label: "Instagram", shortLabel: "IG", color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
  ],
  article: [
    { slug: "website", label: "Website", shortLabel: "WEB", color: "#f0dca0", bg: "rgba(240,220,160,0.08)" },
  ],
  social_post: [
    { slug: "instagram", label: "Instagram", shortLabel: "IG", color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
  ],
};

export const PLATFORM_PLACEHOLDER_URL: Record<string, string> = {
  youtube: "https://youtu.be/...",
  spotify: "https://open.spotify.com/episode/...",
  tiktok: "https://www.tiktok.com/@eckstein_podcast/video/...",
  instagram: "https://www.instagram.com/p/...",
  website: "https://eckstein-podcast.de/...",
};

/** Platforms that support externalId + analytics cron pull. */
export const ANALYTICS_PLATFORM_SLUGS = new Set(["youtube", "instagram"]);

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function getPlatformsForType(type: string): PlatformDef[] {
  return isContentType(type) ? PLATFORMS_BY_TYPE[type] : [];
}

export function allowedPlatformSlugs(type: string): Set<string> {
  return new Set(getPlatformsForType(type).map(p => p.slug));
}

export function validatePlatformLinks(
  type: string,
  links: { slug: string }[],
): string | null {
  if (!isContentType(type)) return `Ungültiger Content-Typ: ${type}`;
  const allowed = allowedPlatformSlugs(type);
  const invalid = links.map(l => l.slug).filter(slug => !allowed.has(slug));
  if (invalid.length > 0) {
    return `Plattformen nicht erlaubt für ${type}: ${invalid.join(", ")}`;
  }
  return null;
}

export function supportsAnalyticsExternalId(slug: string): boolean {
  return ANALYTICS_PLATFORM_SLUGS.has(slug);
}

export function getPlatformDef(type: string, slug: string): PlatformDef | undefined {
  return getPlatformsForType(type).find(p => p.slug === slug);
}

/** Display styling for platform chips in lists (includes legacy slugs). */
export const PLATFORM_CHIP_STYLES: Record<string, { bg: string; color: string; label?: string }> = {
  youtube: { bg: "rgba(201,168,76,0.15)", color: "var(--gold-light)", label: "YouTube" },
  spotify: { bg: "rgba(76,175,125,0.12)", color: "#4caf7d", label: "Spotify" },
  tiktok: { bg: "rgba(226,192,106,0.1)", color: "var(--gold-pale)", label: "TikTok" },
  instagram: { bg: "rgba(201,168,76,0.1)", color: "var(--gold-light)", label: "Instagram" },
  website: { bg: "rgba(240,220,160,0.08)", color: "var(--gold-pale)", label: "Website" },
  yt_shorts: { bg: "rgba(201,168,76,0.15)", color: "var(--gold-light)", label: "YT Shorts" },
  ig_reels: { bg: "rgba(201,168,76,0.1)", color: "var(--gold-light)", label: "IG Reels" },
  rumble: { bg: "rgba(245,238,216,0.06)", color: "var(--text-on-glass-muted)", label: "Rumble" },
  substack: { bg: "rgba(201,168,76,0.12)", color: "var(--gold-light)", label: "Substack" },
  x: { bg: "rgba(245,238,216,0.06)", color: "var(--text-on-glass-muted)", label: "X" },
};

export function platformChipLabel(slug: string): string {
  return PLATFORM_CHIP_STYLES[slug]?.label ?? slug.replace("_", " ");
}
