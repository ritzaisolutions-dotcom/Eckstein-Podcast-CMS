type Status = "draft" | "scheduled" | "published" | "posted" | "idea" | "in_arbeit" | "umgesetzt" | "verworfen" | "sammeln" | "strukturieren" | "ready_to_record" | "recorded" | string;

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  draft:            { bg: "transparent",            color: "var(--navy-3)",   border: "var(--navy-3)" },
  idea:             { bg: "transparent",            color: "var(--navy-3)",   border: "var(--navy-3)" },
  sammeln:          { bg: "transparent",            color: "var(--navy-3)",   border: "var(--navy-3)" },
  scheduled:        { bg: "var(--gold)",            color: "var(--navy)",     border: "var(--gold)" },
  strukturieren:    { bg: "rgba(201,168,76,0.2)",   color: "var(--navy)",     border: "var(--gold)" },
  in_arbeit:        { bg: "rgba(201,168,76,0.2)",   color: "var(--navy)",     border: "var(--gold)" },
  published:        { bg: "var(--navy)",            color: "var(--cream)",    border: "var(--navy)" },
  posted:           { bg: "var(--navy)",            color: "var(--cream)",    border: "var(--navy)" },
  umgesetzt:        { bg: "var(--navy)",            color: "var(--cream)",    border: "var(--navy)" },
  ready_to_record:  { bg: "var(--gold-light)",      color: "var(--navy)",     border: "var(--gold-light)" },
  recorded:         { bg: "var(--navy-3)",          color: "var(--cream)",    border: "var(--navy-3)" },
  verworfen:        { bg: "transparent",            color: "rgba(12,30,53,0.35)", border: "rgba(12,30,53,0.2)" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
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
