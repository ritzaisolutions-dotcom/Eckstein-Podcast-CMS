function hasTimestamp(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return String(value).trim().length > 0;
}

/** Derive publish status from lifecycle + platform links — not manually editable. */
export function deriveContentStatus(
  lifecycleStage: string,
  platformLinks: { scheduledAt?: string | Date | null; postedAt?: string | Date | null }[],
): "draft" | "scheduled" | "published" {
  if (lifecycleStage === "live") return "published";
  if (platformLinks.some(l => hasTimestamp(l.postedAt))) return "published";
  if (platformLinks.some(l => hasTimestamp(l.scheduledAt))) return "scheduled";
  return "draft";
}
