export const LIFECYCLE_STAGES = [
  "draft",
  "scripting",
  "filming",
  "editing",
  "revision",
  "live",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/** UI labels (DE) — DB keys remain English. */
export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  draft: "Entwurf",
  scripting: "Skript",
  filming: "Dreh",
  editing: "Schnitt",
  revision: "Revision",
  live: "Live",
};

export const LIFECYCLE_OPTIONS = LIFECYCLE_STAGES.map(value => ({
  value,
  label: LIFECYCLE_LABELS[value],
}));

export function lifecycleLabel(stage: string): string {
  if (stage in LIFECYCLE_LABELS) {
    return LIFECYCLE_LABELS[stage as LifecycleStage];
  }
  return stage;
}
