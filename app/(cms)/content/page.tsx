export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks, analyticsSnapshots, platforms } from "@/lib/db/schema";
import { eq, desc, ilike, and, inArray, sql } from "drizzle-orm";
import Badge from "@/components/ui/Badge";
import TypeSelect from "./TypeSelect";

const TYPE_OPTIONS = [
  { value: "", label: "Alle" },
  { value: "lfc", label: "LFC — Long-Form" },
  { value: "sfc", label: "SFC — Shorts" },
  { value: "article", label: "Artikel" },
  { value: "newsletter", label: "Newsletter" },
  { value: "social_post", label: "Social Posts" },
  { value: "media", label: "Media" },
];

const TYPE_LABELS: Record<string, string> = {
  lfc: "LFC", sfc: "SFC", article: "Artikel", newsletter: "Newsletter", social_post: "Social", media: "Media",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "";
  const query = params.q ?? "";
  const statusFilter = params.status ?? "";

  const db = getDb();

  // Build where conditions
  const conditions = [];
  if (typeFilter) conditions.push(eq(contentPieces.type, typeFilter));
  if (statusFilter) conditions.push(eq(contentPieces.status, statusFilter));
  if (query) conditions.push(ilike(contentPieces.title, `%${query}%`));

  // Pieces + platform rows in parallel (pieces needed for ids, platform rows independent)
  const [pieces, platformRows] = await Promise.all([
    db.select()
      .from(contentPieces)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contentPieces.createdAt))
      .limit(100),
    db.select().from(platforms),
  ]);

  const ids = pieces.map(p => p.id);
  const platformMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  // Platform links + snapshots in parallel (both depend on ids)
  const [links, snapshots] = ids.length > 0
    ? await Promise.all([
        db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids)),
        db.select({
            contentId: analyticsSnapshots.contentId,
            views: sql<number>`SUM(${analyticsSnapshots.views})`.as("views"),
          })
          .from(analyticsSnapshots)
          .where(inArray(analyticsSnapshots.contentId, ids))
          .groupBy(analyticsSnapshots.contentId),
      ])
    : [[], []];

  const viewsMap = Object.fromEntries(snapshots.map(s => [s.contentId, Number(s.views)]));

  const platformByContentId: Record<string, string[]> = {};
  for (const link of links) {
    const slug = platformMap[link.platformId];
    if (slug) {
      if (!platformByContentId[link.contentId]) platformByContentId[link.contentId] = [];
      platformByContentId[link.contentId].push(slug);
    }
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ ...(typeFilter && { type: typeFilter }), ...(query && { q: query }), ...(statusFilter && { status: statusFilter }), ...overrides });
    return `/content?${p.toString()}`;
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Content</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            {pieces.length} Einträge{typeFilter ? ` · ${TYPE_LABELS[typeFilter] ?? typeFilter}` : ""}
          </p>
        </div>
        <Link
          href="/episodes/new"
          className="text-xs px-4 py-2 rounded"
          style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}
        >
          + NEU
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type Dropdown */}
        <TypeSelect current={typeFilter} query={query} statusFilter={statusFilter} />

        {/* Status Pills */}
        {(["", "draft", "scheduled", "published"] as const).map(s => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className="text-xs px-3 py-1.5 rounded border transition-colors"
            style={{
              borderColor: statusFilter === s ? "var(--navy)" : "var(--border)",
              background: statusFilter === s ? "var(--navy)" : "transparent",
              color: statusFilter === s ? "var(--cream)" : "var(--text-secondary)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.06em",
            }}
          >
            {s === "" ? "Alle" : s === "draft" ? "Entwurf" : s === "scheduled" ? "Geplant" : "Live"}
          </Link>
        ))}

        {/* Search */}
        <form method="GET" action="/content" className="ml-auto">
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="Suche..."
            className="cms-input text-sm py-1.5 px-3"
            style={{ width: 200 }}
          />
        </form>
      </div>

      {/* Table */}
      {pieces.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>▤</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            {query || typeFilter || statusFilter ? "Keine Einträge gefunden." : "Noch kein Content angelegt."}
          </p>
          <Link href="/episodes/new" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Erste Episode anlegen
          </Link>
        </div>
      ) : (
        <div className="cms-card overflow-x-auto p-0">
          <table className="cms-table w-full">
            <thead>
              <tr>
                <th className="pl-4">Titel</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Erstellt</th>
                <th>Live-Gang</th>
                <th>Plattformen</th>
                <th className="text-right pr-4">Views</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map(piece => {
                const platSlugs = platformByContentId[piece.id] ?? [];
                const views = viewsMap[piece.id] ?? 0;
                return (
                  <tr
                    key={piece.id}
                    className="cursor-pointer"
                    onClick={undefined}
                  >
                    <td className="pl-4">
                      <Link href={`/episodes/${piece.id}`} className="hover:underline block" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                        {piece.episodeNumber ? <span className="text-xs mr-1.5" style={{ color: "var(--text-muted)" }}>#{piece.episodeNumber}</span> : null}
                        {piece.title}
                        {piece.hasPrayer && <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>✝</span>}
                      </Link>
                      {piece.bio && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{piece.bio}</p>
                      )}
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                        {TYPE_LABELS[piece.type] ?? piece.type}
                      </span>
                    </td>
                    <td><Badge status={piece.status as "draft" | "scheduled" | "published"} /></td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(piece.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {piece.uploadDate ? new Date(piece.uploadDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {platSlugs.slice(0, 3).map(slug => (
                          <PlatformTag key={slug} slug={slug} />
                        ))}
                        {platSlugs.length > 3 && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{platSlugs.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right pr-4 text-sm" style={{ fontFamily: "var(--font-cinzel)", color: views > 0 ? "var(--navy)" : "var(--text-muted)" }}>
                      {views > 0 ? (views >= 1000 ? (views / 1000).toFixed(1) + "k" : views) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlatformTag({ slug }: { slug: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    youtube:   { bg: "rgba(201,168,76,0.15)",  color: "var(--navy)" },
    yt_shorts: { bg: "rgba(201,168,76,0.15)",  color: "var(--navy)" },
    rumble:    { bg: "rgba(12,30,53,0.08)",    color: "var(--text-secondary)" },
    spotify:   { bg: "rgba(12,30,53,0.08)",    color: "var(--text-secondary)" },
    instagram: { bg: "rgba(201,168,76,0.1)",   color: "var(--navy-3)" },
    ig_reels:  { bg: "rgba(201,168,76,0.1)",   color: "var(--navy-3)" },
    tiktok:    { bg: "rgba(12,30,53,0.06)",    color: "var(--text-secondary)" },
    x:         { bg: "rgba(12,30,53,0.08)",    color: "var(--text-secondary)" },
    substack:  { bg: "rgba(201,168,76,0.12)",  color: "var(--navy)" },
    website:   { bg: "rgba(12,30,53,0.06)",    color: "var(--text-muted)" },
  };
  const style = colors[slug] ?? { bg: "var(--cream-mid)", color: "var(--text-muted)" };
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.color, fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.06em" }}>
      {slug.replace("_", " ").replace("yt ", "YT ").replace("ig ", "IG ").toUpperCase()}
    </span>
  );
}
