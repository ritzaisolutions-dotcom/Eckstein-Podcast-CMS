type DotState = "off" | "scheduled" | "live";

interface PlatformDot {
  label: string;
  state: DotState;
}

interface ContentCardPreviewProps {
  episodeNumber: number | null;
  title: string;
  type: "lfc" | "sfc" | "article" | "social_post";
  platforms: PlatformDot[];
  scheduleLabel?: string;
}

const TYPE_LABELS: Record<string, string> = {
  lfc: "LFC",
  sfc: "SFC",
  article: "Artikel",
  social_post: "Post",
};

function dotClass(state: DotState) {
  if (state === "live") return "cms-dot cms-dot-live";
  if (state === "scheduled") return "cms-dot cms-dot-scheduled";
  return "cms-dot cms-dot-off";
}

export default function ContentCardPreview({
  episodeNumber,
  title,
  type,
  platforms,
  scheduleLabel,
}: ContentCardPreviewProps) {
  return (
    <article className="cms-glass-strong cms-glass-hover p-3 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {episodeNumber != null && (
            <span
              className="shrink-0 text-xs"
              style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold-light)", fontSize: "0.65rem" }}
            >
              EP.{episodeNumber}
            </span>
          )}
          <span
            className="shrink-0 text-xs px-1.5 py-0.5 rounded"
            style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-pale)", fontFamily: "var(--font-cinzel)", fontSize: "0.5rem" }}
          >
            {TYPE_LABELS[type]}
          </span>
        </div>
      </div>
      <h3
        className="text-sm leading-snug mb-2 truncate"
        style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass)" }}
      >
        {title}
      </h3>
      <div className="flex items-center gap-2 mb-1">
        {platforms.map(p => (
          <div key={p.label} className="flex items-center gap-1" title={p.label}>
            <span className={dotClass(p.state)} />
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.48rem", color: "var(--text-on-glass-muted)", letterSpacing: "0.06em" }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
      {scheduleLabel && (
        <p className="text-xs mt-1" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
          {scheduleLabel}
        </p>
      )}
    </article>
  );
}
