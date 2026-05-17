export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { contentPieces, analyticsSnapshots, platforms, contentPlatformLinks } from "@/lib/db/schema";
import { eq, desc, inArray, sql, and } from "drizzle-orm";

const TYPE_PILLS = [
  { value: "", label: "Alle" },
  { value: "lfc", label: "LFC" },
  { value: "sfc", label: "SFC" },
  { value: "article", label: "Artikel" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "";
  const sortBy = params.sort ?? "views";

  const db = getDb();

  const pieces = await db
    .select()
    .from(contentPieces)
    .where(typeFilter ? eq(contentPieces.type, typeFilter) : undefined)
    .orderBy(desc(contentPieces.uploadDate));

  const ids = pieces.map(p => p.id);
  if (ids.length === 0) {
    return <EmptyState typeFilter={typeFilter} />;
  }

  // Latest snapshot per content+platform
  const snapRows = await db
    .select({
      contentId: analyticsSnapshots.contentId,
      platformId: analyticsSnapshots.platformId,
      views: sql<number>`MAX(${analyticsSnapshots.views})`.as("views"),
      likes: sql<number>`MAX(${analyticsSnapshots.likes})`.as("likes"),
      comments: sql<number>`MAX(${analyticsSnapshots.comments})`.as("comments"),
    })
    .from(analyticsSnapshots)
    .where(inArray(analyticsSnapshots.contentId, ids))
    .groupBy(analyticsSnapshots.contentId, analyticsSnapshots.platformId);

  // Aggregate per content
  const aggregated: Record<string, { views: number; likes: number; comments: number; byPlatform: Record<number, { views: number; likes: number }> }> = {};
  for (const row of snapRows) {
    if (!aggregated[row.contentId]) aggregated[row.contentId] = { views: 0, likes: 0, comments: 0, byPlatform: {} };
    aggregated[row.contentId].views += Number(row.views ?? 0);
    aggregated[row.contentId].likes += Number(row.likes ?? 0);
    aggregated[row.contentId].comments += Number(row.comments ?? 0);
    aggregated[row.contentId].byPlatform[row.platformId] = { views: Number(row.views ?? 0), likes: Number(row.likes ?? 0) };
  }

  // Platform labels
  const platformRows = await db.select().from(platforms);
  const platformMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  // Platform links per content
  const links = await db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids));
  const linkedPlatforms: Record<string, number[]> = {};
  for (const l of links) {
    if (!linkedPlatforms[l.contentId]) linkedPlatforms[l.contentId] = [];
    linkedPlatforms[l.contentId].push(l.platformId);
  }

  // Sort
  const sorted = [...pieces].sort((a, b) => {
    const av = aggregated[a.id]?.views ?? 0;
    const bv = aggregated[b.id]?.views ?? 0;
    if (sortBy === "views") return bv - av;
    if (sortBy === "likes") return (aggregated[b.id]?.likes ?? 0) - (aggregated[a.id]?.likes ?? 0);
    if (sortBy === "comments") return (aggregated[b.id]?.comments ?? 0) - (aggregated[a.id]?.comments ?? 0);
    return 0;
  });

  const totalViews = Object.values(aggregated).reduce((s, r) => s + r.views, 0);
  const totalLikes = Object.values(aggregated).reduce((s, r) => s + r.likes, 0);
  const totalComments = Object.values(aggregated).reduce((s, r) => s + r.comments, 0);

  function fmt(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ ...(typeFilter && { type: typeFilter }), ...(sortBy !== "views" && { sort: sortBy }), ...overrides });
    return `/analytics?${p.toString()}`;
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
          Aggregiert über alle Plattformen · Auto-Pull alle 24h
        </p>
      </div>

      {/* Type Toggle Pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TYPE_PILLS.map(pill => (
          <Link
            key={pill.value}
            href={buildUrl({ type: pill.value })}
            className="text-xs px-4 py-1.5 rounded-full border transition-colors"
            style={{
              borderColor: typeFilter === pill.value ? "var(--navy)" : "var(--border)",
              background: typeFilter === pill.value ? "var(--navy)" : "transparent",
              color: typeFilter === pill.value ? "var(--cream)" : "var(--text-secondary)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.08em",
            }}
          >
            {pill.label}
          </Link>
        ))}

        {/* Sort */}
        <div className="ml-auto flex gap-2">
          {["views", "likes", "comments"].map(s => (
            <Link
              key={s}
              href={buildUrl({ sort: s })}
              className="text-xs px-3 py-1.5 rounded border transition-colors"
              style={{
                borderColor: sortBy === s ? "var(--gold)" : "var(--border)",
                color: sortBy === s ? "var(--gold)" : "var(--text-muted)",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.6rem",
                letterSpacing: "0.06em",
              }}
            >
              {s === "views" ? "Views" : s === "likes" ? "Likes" : "Comments"}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Views", value: fmt(totalViews) },
          { label: "Total Likes", value: fmt(totalLikes) },
          { label: "Total Comments", value: fmt(totalComments) },
        ].map(card => (
          <div key={card.label} className="cms-card text-center py-4">
            <p className="text-2xl" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>{card.value}</p>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)" }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="cms-card overflow-x-auto p-0">
        <table className="cms-table w-full">
          <thead>
            <tr>
              <th className="pl-4">Content</th>
              <th>Typ</th>
              <th>Plattformen</th>
              <th className="text-right">Views</th>
              <th className="text-right">Likes</th>
              <th className="text-right pr-4">Comments</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(piece => {
              const agg = aggregated[piece.id];
              const platIds = linkedPlatforms[piece.id] ?? [];
              return (
                <tr key={piece.id}>
                  <td className="pl-4">
                    <Link href={`/episodes/${piece.id}`} className="hover:underline" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                      {piece.episodeNumber ? <span className="text-xs mr-1" style={{ color: "var(--text-muted)" }}>#{piece.episodeNumber}</span> : null}
                      {piece.title}
                    </Link>
                  </td>
                  <td>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem" }}>
                      {piece.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {platIds.map(id => (
                        <span key={id} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
                          {(platformMap[id] ?? "?").replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right" style={{ fontFamily: "var(--font-cinzel)", color: agg?.views ? "var(--navy)" : "var(--text-muted)" }}>
                    {agg?.views ? fmt(agg.views) : "—"}
                  </td>
                  <td className="text-right" style={{ color: "var(--text-muted)" }}>
                    {agg?.likes ? fmt(agg.likes) : "—"}
                  </td>
                  <td className="text-right pr-4" style={{ color: "var(--text-muted)" }}>
                    {agg?.comments ? fmt(agg.comments) : "—"}
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr style={{ borderTop: "2px solid var(--border)", background: "var(--cream-mid)" }}>
              <td className="pl-4 py-2" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>GESAMT</td>
              <td /><td />
              <td className="text-right font-semibold" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>{fmt(totalViews)}</td>
              <td className="text-right" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-secondary)" }}>{fmt(totalLikes)}</td>
              <td className="text-right pr-4" style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-secondary)" }}>{fmt(totalComments)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ typeFilter }: { typeFilter: string }) {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Analytics</h1>
      </div>
      <div className="cms-card text-center py-16">
        <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>◎</p>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          Noch keine Analytics-Daten. Sobald Content mit Plattform-IDs verknüpft ist, werden Snapshots automatisch alle 24h gezogen.
        </p>
        <Link href="/content" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
          Content anlegen
        </Link>
      </div>
    </div>
  );
}
