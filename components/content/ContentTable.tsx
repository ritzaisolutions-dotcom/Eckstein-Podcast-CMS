import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { PLATFORM_CHIP_STYLES, platformChipLabel } from "@/lib/platforms";
import type { HubPiece, SortDir, SortField } from "@/lib/content-hub";
import { lifecycleLabel } from "@/lib/lifecycle";

interface ContentTableProps {
  pieces: HubPiece[];
  sort: SortField;
  dir: SortDir;
  typeFilter: string;
  buildUrl: (overrides: Record<string, string>) => string;
}

function SortTh({
  label,
  field,
  sort,
  dir,
  buildUrl,
  className,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  dir: SortDir;
  buildUrl: (overrides: Record<string, string>) => string;
  className?: string;
}) {
  const isActive = sort === field;
  const nextDir: SortDir = isActive && dir === "desc" ? "asc" : "desc";
  const arrow = isActive ? (dir === "desc" ? " ↓" : " ↑") : "";
  return (
    <th className={className}>
      <Link
        href={buildUrl({ sort: field, dir: nextDir })}
        style={{
          color: isActive ? "var(--gold-light)" : "var(--text-on-glass-muted)",
          textDecoration: "none",
          whiteSpace: "nowrap",
          fontWeight: isActive ? 700 : undefined,
        }}
      >
        {label}{arrow}
      </Link>
    </th>
  );
}

function PlatformTag({ slug }: { slug: string }) {
  const chip = PLATFORM_CHIP_STYLES[slug] ?? { bg: "rgba(245,238,216,0.08)", color: "var(--text-on-glass-muted)" };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: chip.bg, color: chip.color, fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.06em" }}>
      {platformChipLabel(slug).toUpperCase()}
    </span>
  );
}

export default function ContentTable({ pieces, sort, dir, typeFilter, buildUrl }: ContentTableProps) {
  return (
    <div className="cms-card overflow-x-auto p-0">
      <table className="cms-table w-full">
        <thead>
          <tr>
            <SortTh label="#" field="id" sort={sort} dir={dir} buildUrl={buildUrl} className="pl-4 w-10" />
            <SortTh label="Typ-ID" field="type_id" sort={sort} dir={dir} buildUrl={buildUrl} className="w-20" />
            <th>Titel</th>
            <th>Lifecycle</th>
            <SortTh label="Typ" field="type" sort={sort} dir={dir} buildUrl={buildUrl} />
            <SortTh label="Status" field="status" sort={sort} dir={dir} buildUrl={buildUrl} />
            <SortTh label="Erstellt" field="created" sort={sort} dir={dir} buildUrl={buildUrl} />
            <th>Plattformen</th>
            <th className="text-right pr-4">Views</th>
          </tr>
        </thead>
        <tbody>
          {pieces.map(piece => (
            <tr key={piece.id}>
              <td className="pl-4 shrink-0">
                <span style={{ color: "var(--gold-light)", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem" }}>
                  #{piece.contentId}
                </span>
              </td>
              <td>
                {piece.typeIndex != null ? (
                  <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem" }}>
                    {(piece.type ?? "").toUpperCase()}-{piece.typeIndex}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </td>
              <td>
                <Link href={`/content/${piece.id}`} className="hover:underline block" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                  {piece.episodeNumber ? <span className="text-xs mr-1.5" style={{ color: "var(--text-muted)" }}>EP.{piece.episodeNumber}</span> : null}
                  {piece.title}
                </Link>
              </td>
              <td>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    color: "var(--gold-pale)",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.55rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {lifecycleLabel(piece.lifecycleStage)}
                </span>
              </td>
              <td>
                <Link
                  href={buildUrl({ type: typeFilter === piece.type ? "" : piece.type })}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: typeFilter === piece.type ? "rgba(201,168,76,0.2)" : "rgba(245,238,216,0.06)",
                    color: typeFilter === piece.type ? "var(--gold-light)" : "var(--text-secondary)",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.6rem",
                    textDecoration: "none",
                  }}
                >
                  {piece.type.toUpperCase()}
                </Link>
              </td>
              <td><Badge status={piece.status as "draft" | "scheduled" | "published"} /></td>
              <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(piece.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
              </td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {piece.platSlugs.slice(0, 4).map(slug => (
                    <PlatformTag key={slug} slug={slug} />
                  ))}
                </div>
              </td>
              <td className="text-right pr-4 text-sm" style={{ fontFamily: "var(--font-cinzel)", color: piece.views > 0 ? "var(--gold-light)" : "var(--text-muted)" }}>
                {piece.views > 0 ? (piece.views >= 1000 ? (piece.views / 1000).toFixed(1) + "k" : piece.views) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
