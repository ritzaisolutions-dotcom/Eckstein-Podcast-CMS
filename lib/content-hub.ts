import { getPlatformsForType } from "./platforms";
import { LIFECYCLE_STAGES, lifecycleLabel } from "./lifecycle";
import { contentPieces } from "./db/schema";

/**
 * Drizzle column projection for content list views.
 * Excludes body_md and other large/unused columns to keep queries fast.
 */
export const contentListSelect = {
  id: contentPieces.id,
  contentId: contentPieces.contentId,
  typeIndex: contentPieces.typeIndex,
  type: contentPieces.type,
  title: contentPieces.title,
  bio: contentPieces.bio,
  episodeNumber: contentPieces.episodeNumber,
  status: contentPieces.status,
  lifecycleStage: contentPieces.lifecycleStage,
  createdAt: contentPieces.createdAt,
  uploadDate: contentPieces.uploadDate,
  hasPrayer: contentPieces.hasPrayer,
} as const;

export type DotState = "off" | "scheduled" | "live";
export type HubView = "board" | "table";

export const TYPE_FILTER_PILLS = [
  { value: "", label: "Alle" },
  { value: "lfc", label: "LFC" },
  { value: "sfc", label: "SFC" },
  { value: "article", label: "Artikel" },
  { value: "social_post", label: "Posts" },
] as const;

export const TYPE_LABELS: Record<string, string> = {
  lfc: "LFC",
  sfc: "SFC",
  article: "Artikel",
  newsletter: "Newsletter",
  social_post: "Post",
  media: "Media",
};

export interface PlatformLinkInfo {
  slug: string;
  url: string | null;
  scheduledAt: Date | null;
  postedAt: Date | null;
}

export interface HubPiece {
  id: string;
  contentId: number | null;
  typeIndex: number | null;
  type: string;
  title: string;
  bio: string | null;
  episodeNumber: number | null;
  status: string;
  lifecycleStage: string;
  createdAt: Date;
  uploadDate: Date | null;
  hasPrayer: boolean | null;
  platformDots: { shortLabel: string; slug: string; state: DotState }[];
  scheduleLabel: string | null;
  views: number;
  platSlugs: string[];
}

export function platformDotState(link: PlatformLinkInfo | undefined): DotState {
  if (!link) return "off";
  if (link.postedAt) return "live";
  if (link.url?.trim() || link.scheduledAt) return "scheduled";
  return "off";
}

export function buildLinksBySlug(
  contentId: string,
  links: readonly {
    contentId: string;
    platformId: number;
    url: string | null;
    scheduledAt: Date | null;
    postedAt: Date | null;
  }[],
  platformMap: Record<number, string>,
): Record<string, PlatformLinkInfo> {
  const bySlug: Record<string, PlatformLinkInfo> = {};
  for (const link of links) {
    if (link.contentId !== contentId) continue;
    const slug = platformMap[link.platformId];
    if (!slug) continue;
    bySlug[slug] = {
      slug,
      url: link.url,
      scheduledAt: link.scheduledAt,
      postedAt: link.postedAt,
    };
  }
  return bySlug;
}

export function buildPlatformDots(type: string, linksBySlug: Record<string, PlatformLinkInfo>) {
  return getPlatformsForType(type).map(def => ({
    shortLabel: def.shortLabel,
    slug: def.slug,
    state: platformDotState(linksBySlug[def.slug]),
  }));
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatScheduleLabel(linksBySlug: Record<string, PlatformLinkInfo>): string | null {
  let earliest: Date | null = null;
  for (const link of Object.values(linksBySlug)) {
    const scheduledAt = asDate(link.scheduledAt);
    if (link.postedAt || !scheduledAt) continue;
    if (!earliest || scheduledAt < earliest) earliest = scheduledAt;
  }
  if (!earliest) return null;
  return `Geplant: ${earliest.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
}

export function buildHubPiece(
  piece: {
    id: string;
    contentId: number | null;
    typeIndex: number | null;
    type: string;
    title: string;
    bio: string | null;
    episodeNumber: number | null;
    status: string;
    lifecycleStage: string;
    createdAt: Date;
    uploadDate: Date | null;
    hasPrayer: boolean | null;
  },
  linksBySlug: Record<string, PlatformLinkInfo>,
  views: number,
  platSlugs: string[],
): HubPiece {
  return {
    ...piece,
    platformDots: buildPlatformDots(piece.type, linksBySlug),
    scheduleLabel: formatScheduleLabel(linksBySlug),
    views,
    platSlugs,
  };
}

export { LIFECYCLE_STAGES, lifecycleLabel };

export type SortField = "id" | "type_id" | "type" | "status" | "created" | "live";
export type SortDir = "asc" | "desc";

export function buildContentHubUrl(params: {
  type?: string;
  q?: string;
  status?: string;
  sort?: string;
  dir?: string;
  view?: string;
  due?: string;
}, overrides: Record<string, string> = {}): string {
  const merged = { ...params, ...overrides };
  const p = new URLSearchParams();
  if (merged.type) p.set("type", merged.type);
  if (merged.q) p.set("q", merged.q);
  if (merged.status) p.set("status", merged.status);
  if (merged.sort && merged.sort !== "id") p.set("sort", merged.sort);
  if (merged.dir && merged.dir !== "desc") p.set("dir", merged.dir);
  if (merged.view && merged.view !== "board") p.set("view", merged.view);
  if (merged.due) p.set("due", merged.due);
  const qs = p.toString();
  return qs ? `/content?${qs}` : "/content";
}

export function defaultViewFromParam(viewParam: string | undefined): HubView {
  return viewParam === "table" ? "table" : "board";
}

export function buildContentDetailUrl(id: string, returnTo?: string): string {
  if (!returnTo || returnTo === "/content") return `/content/${id}`;
  return `/content/${id}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildContentNewUrl(
  hubParams: { type?: string; q?: string; status?: string; sort?: string; dir?: string; view?: string; due?: string },
  typeOverride?: string,
): string {
  const p = new URLSearchParams();
  const type = typeOverride ?? hubParams.type;
  if (type) p.set("type", type);
  p.set("returnTo", buildContentHubUrl(hubParams));
  return `/content/new?${p.toString()}`;
}

export const EMPTY_CTA_LABELS: Record<string, string> = {
  "": "Ersten Content anlegen",
  lfc: "Erste Episode anlegen",
  sfc: "Ersten Short anlegen",
  article: "Ersten Artikel anlegen",
  social_post: "Ersten Post anlegen",
};

export const PUBLISH_STATUS_LABELS: Record<string, string> = {
  "": "Alle Status",
  draft: "Unveröffentlicht",
  scheduled: "Geplant",
  published: "Live",
};
