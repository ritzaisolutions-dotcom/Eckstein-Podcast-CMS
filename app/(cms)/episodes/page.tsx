import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Placeholder — will be replaced with DB queries
const MOCK_EPISODES = [
  { id: "1", episodeNumber: 12, title: "Warum du scheiterst — und was das gut ist", status: "published", uploadDate: "2026-05-11", duration: "ca. 67 Min", hasPrayer: true, ytViews: 4210, igViews: 870 },
  { id: "2", episodeNumber: 11, title: "Die Lüge der Work-Life-Balance", status: "published", uploadDate: "2026-05-04", duration: "ca. 58 Min", hasPrayer: false, ytViews: 3890, igViews: 720 },
  { id: "3", episodeNumber: 13, title: "", status: "draft", uploadDate: null, duration: null, hasPrayer: null, ytViews: 0, igViews: 0 },
];

const PLATFORM_STATUS = [
  { slug: "yt", label: "YT" },
  { slug: "rumble", label: "Rumble" },
  { slug: "spotify", label: "Spotify" },
];

export default function EpisodesPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Episoden"
        subtitle="Long-Form"
        actions={
          <Link href="/episodes/new">
            <Button size="sm">+ Neue Episode</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          placeholder="Suchen..."
          className="cms-input"
          style={{ maxWidth: 220 }}
        />
        {["Alle", "Entwurf", "Geplant", "Live"].map(s => (
          <button
            key={s}
            className="px-3 py-1.5 rounded border text-xs transition-colors"
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              background: "var(--bg-surface)",
            }}
          >
            {s}
          </button>
        ))}
        <select
          className="cms-input"
          style={{ maxWidth: 160, fontSize: "0.8rem" }}
          defaultValue="uploadDate_desc"
        >
          <option value="uploadDate_desc">Neueste zuerst</option>
          <option value="uploadDate_asc">Älteste zuerst</option>
          <option value="views_desc">Meist gesehen</option>
          <option value="episodeNumber_desc">Ep.-Nummer ↓</option>
        </select>
      </div>

      {/* Table */}
      <div className="cms-card p-0 overflow-x-auto">
        <table className="cms-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Titel</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 100 }}>Datum</th>
              <th style={{ width: 120 }}>Plattformen</th>
              <th style={{ width: 100 }}>Views</th>
              <th style={{ width: 70 }}>Dauer</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EPISODES.map(ep => (
              <tr key={ep.id}>
                <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>
                  {ep.episodeNumber ?? "—"}
                </td>
                <td>
                  <Link
                    href={`/episodes/${ep.id}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {ep.title || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Kein Titel</span>}
                  </Link>
                  {ep.hasPrayer && (
                    <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }} title="Schlussgebet">✝</span>
                  )}
                </td>
                <td><Badge status={ep.status} /></td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {ep.uploadDate ?? "—"}
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {PLATFORM_STATUS.map(p => (
                      <span
                        key={p.slug}
                        className="text-xs px-1 rounded"
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.55rem",
                          background: ep.status === "published" ? "rgba(5,16,31,0.08)" : "transparent",
                          color: ep.status === "published" ? "var(--navy-3)" : "rgba(12,30,53,0.25)",
                          border: "1px solid var(--border)",
                        }}
                        title={ep.status === "published" ? "Live" : "Ausstehend"}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: ep.ytViews > 0 ? "var(--navy)" : "var(--text-muted)" }}>
                  {ep.ytViews > 0 ? ep.ytViews.toLocaleString("de") : "—"}
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{ep.duration ?? "—"}</td>
                <td>
                  <Link href={`/episodes/${ep.id}`} style={{ color: "var(--gold)", fontSize: "0.85rem" }}>↗</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
