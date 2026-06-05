import Link from "next/link";
import { TYPE_FILTER_PILLS, buildContentHubUrl, type HubView } from "@/lib/content-hub";

interface ContentHubHeaderProps {
  count: number;
  typeFilter: string;
  query: string;
  statusFilter: string;
  sort: string;
  dir: string;
  view: HubView;
  dueFilter: string;
}

function pillStyle(active: boolean) {
  return {
    borderColor: active ? "var(--gold)" : "var(--glass-border-subtle)",
    background: active ? "rgba(201,168,76,0.15)" : "transparent",
    color: active ? "var(--cream)" : "var(--text-on-glass-muted)",
    fontFamily: "var(--font-cinzel)",
    letterSpacing: "0.06em" as const,
  };
}

export default function ContentHubHeader({
  count,
  typeFilter,
  query,
  statusFilter,
  sort,
  dir,
  view,
  dueFilter,
}: ContentHubHeaderProps) {
  const base = { type: typeFilter, q: query, status: statusFilter, sort, dir, view, due: dueFilter };

  function url(overrides: Record<string, string>) {
    return buildContentHubUrl(base, overrides);
  }

  const typeLabel = TYPE_FILTER_PILLS.find(p => p.value === typeFilter)?.label;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)" }}>
            Content Hub
          </h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
            {count} Einträge{typeLabel && typeLabel !== "Alle" ? ` · ${typeLabel}` : ""}
            {dueFilter === "today" ? " · heute fällig" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded border overflow-hidden" style={{ borderColor: "var(--glass-border-subtle)" }}>
            <Link
              href={url({ view: "board" })}
              className="text-xs px-3 py-2 transition-colors"
              style={{
                ...pillStyle(view === "board"),
                borderRadius: 0,
                border: "none",
              }}
            >
              Board
            </Link>
            <Link
              href={url({ view: "table" })}
              className="text-xs px-3 py-2 transition-colors border-l"
              style={{
                ...pillStyle(view === "table"),
                borderRadius: 0,
                border: "none",
                borderLeftColor: "var(--glass-border-subtle)",
              }}
            >
              Tabelle
            </Link>
          </div>
          <Link
            href={typeFilter ? `/content/new?type=${typeFilter}` : "/content/new"}
            className="text-xs px-4 py-2 rounded cms-glass-strong"
            style={{ color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}
          >
            + NEU
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {TYPE_FILTER_PILLS.map(p => (
          <Link
            key={p.value || "all"}
            href={url({ type: p.value })}
            className="text-xs px-3 py-1.5 rounded border transition-colors"
            style={pillStyle(typeFilter === p.value)}
          >
            {p.label}
          </Link>
        ))}

        <span className="hidden sm:inline w-px h-5 mx-1" style={{ background: "var(--glass-border-subtle)" }} />

        {(["", "draft", "scheduled", "published"] as const).map(s => (
          <Link
            key={s || "all-status"}
            href={url({ status: s })}
            className="text-xs px-3 py-1.5 rounded border transition-colors"
            style={pillStyle(statusFilter === s)}
          >
            {s === "" ? "Alle Status" : s === "draft" ? "Entwurf" : s === "scheduled" ? "Geplant" : "Live"}
          </Link>
        ))}

        <Link
          href={url({ due: dueFilter === "today" ? "" : "today" })}
          className="text-xs px-3 py-1.5 rounded border transition-colors"
          style={{
            ...pillStyle(dueFilter === "today"),
            ...(dueFilter === "today" ? { borderColor: "rgba(192,57,43,0.5)", background: "rgba(192,57,43,0.12)" } : {}),
          }}
        >
          Heute fällig
        </Link>

        <form method="GET" action="/content" className="ml-auto w-full sm:w-auto">
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {view !== "board" && <input type="hidden" name="view" value={view} />}
          {dueFilter && <input type="hidden" name="due" value={dueFilter} />}
          {sort !== "id" && <input type="hidden" name="sort" value={sort} />}
          {dir !== "desc" && <input type="hidden" name="dir" value={dir} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="Suche..."
            className="cms-input text-sm py-1.5 px-3 w-full sm:w-[200px]"
          />
        </form>
      </div>

      {view === "board" && (
        <p className="text-xs mb-3 md:hidden" style={{ color: "var(--text-on-glass-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
          Auf dem Handy: Tabellenansicht. Board ab Tablet-Breite.
        </p>
      )}
    </>
  );
}
