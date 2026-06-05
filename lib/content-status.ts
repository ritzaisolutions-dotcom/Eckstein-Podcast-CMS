function hasTimestamp(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return String(value).trim().length > 0;
}

function hasUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

export interface PlatformLinkStatusInput {
  url?: string | null;
  scheduledAt?: string | Date | null;
  postedAt?: string | Date | null;
}

/** Derive publish status from lifecycle + platform links — not manually editable. */
export function deriveContentStatus(
  lifecycleStage: string,
  platformLinks: PlatformLinkStatusInput[],
): "draft" | "scheduled" | "published" {
  if (lifecycleStage === "live") return "published";
  if (platformLinks.some(l => hasTimestamp(l.postedAt))) return "published";
  if (platformLinks.some(l => hasTimestamp(l.scheduledAt) || hasUrl(l.url))) return "scheduled";
  return "draft";
}
