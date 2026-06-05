type Status = "draft" | "scheduled" | "published" | "posted" | "idea" | "in_arbeit" | "umgesetzt" | "verworfen" | "sammeln" | "strukturieren" | "ready_to_record" | "recorded" | string;

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  draft:            { bg: "rgba(245,238,216,0.06)", color: "var(--text-on-glass-muted)", border: "var(--glass-border-subtle)" },
  idea:             { bg: "rgba(245,238,216,0.06)", color: "var(--text-on-glass-muted)", border: "var(--glass-border-subtle)" },
  sammeln:          { bg: "rgba(245,238,216,0.06)", color: "var(--text-on-glass-muted)", border: "var(--glass-border-subtle)" },
  scheduled:        { bg: "rgba(201,168,76,0.2)",   color: "var(--gold-light)",          border: "rgba(201,168,76,0.45)" },
  strukturieren:    { bg: "rgba(201,168,76,0.15)",  color: "var(--gold-pale)",           border: "rgba(201,168,76,0.35)" },
  in_arbeit:        { bg: "rgba(201,168,76,0.15)",  color: "var(--gold-pale)",           border: "rgba(201,168,76,0.35)" },
  published:        { bg: "rgba(76,175,125,0.18)",  color: "#4caf7d",                    border: "rgba(76,175,125,0.35)" },
  posted:           { bg: "rgba(76,175,125,0.18)",  color: "#4caf7d",                    border: "rgba(76,175,125,0.35)" },
  umgesetzt:        { bg: "rgba(76,175,125,0.18)",  color: "#4caf7d",                    border: "rgba(76,175,125,0.35)" },
  ready_to_record:  { bg: "rgba(201,168,76,0.25)",  color: "var(--gold-light)",          border: "var(--gold)" },
  recorded:         { bg: "rgba(245,238,216,0.1)",  color: "var(--cream)",               border: "var(--glass-border-subtle)" },
  verworfen:        { bg: "transparent",            color: "rgba(245,238,216,0.35)",     border: "rgba(245,238,216,0.15)" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Unveröffentlicht",
  scheduled: "Geplant",
  published: "Live",
  posted: "Gepostet",
  idea: "Idee",
  in_arbeit: "In Arbeit",
  umgesetzt: "Umgesetzt",
  verworfen: "Verworfen",
  sammeln: "Sammeln",
  strukturieren: "Strukturieren",
  ready_to_record: "Ready",
  recorded: "Aufgenommen",
};

export default function Badge({ status }: { status: Status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs border"
      style={{
        background: s.bg,
        color: s.color,
        borderColor: s.border,
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
