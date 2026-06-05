export const dynamic = "force-dynamic";
export const maxDuration = 60;

import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCachedPlatforms, getCachedAnalyticsSnapshots, viewsByContentId } from "@/lib/cache";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { eq, desc, asc, ilike, and, inArray, isNull, isNotNull, gte, lte } from "drizzle-orm";
import ContentHubHeader from "@/components/content/ContentHubHeader";
import ContentBoard from "@/components/content/ContentBoard";
import ContentTable from "@/components/content/ContentTable";
import {
  buildContentHubUrl,
  buildHubPiece,
  buildLinksBySlug,
  buildContentDetailUrl,
  buildContentNewUrl,
  EMPTY_CTA_LABELS,
  defaultViewFromParam,
  type SortDir,
  type SortField,
} from "@/lib/content-hub";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    q?: string;
    status?: string;
    sort?: string;
    dir?: string;
    view?: string;
    due?: string;
  }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "";
  const query = params.q ?? "";
  const statusFilter = params.status ?? "";
  const sort = (params.sort ?? "id") as SortField;
  const dir = (params.dir ?? "desc") as SortDir;
  const view = defaultViewFromParam(params.view);
  const dueFilter = params.due ?? "";

  const sortMap: Record<
    SortField,
    | typeof contentPieces.contentId
    | typeof contentPieces.typeIndex
    | typeof contentPieces.type
    | typeof contentPieces.status
    | typeof contentPieces.createdAt
    | typeof contentPieces.uploadDate
  > = {
    id: contentPieces.contentId,
    type_id: contentPieces.typeIndex,
    type: contentPieces.type,
    status: contentPieces.status,
    created: contentPieces.createdAt,
    live: contentPieces.uploadDate,
  };
  const sortCol = sortMap[sort] ?? contentPieces.contentId;
  const sortOrder = dir === "asc" ? asc(sortCol) : desc(sortCol);

  const db = getDb();
  const conditions = [];
  if (typeFilter) conditions.push(eq(contentPieces.type, typeFilter));
  if (statusFilter) conditions.push(eq(contentPieces.status, statusFilter));
  if (query) conditions.push(ilike(contentPieces.title, `%${query}%`));

  let dueIds: string[] | null = null;
  if (dueFilter === "today") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dueRows = await db
      .select({ contentId: contentPlatformLinks.contentId })
      .from(contentPlatformLinks)
      .where(
        and(
          isNull(contentPlatformLinks.postedAt),
          isNotNull(contentPlatformLinks.scheduledAt),
          gte(contentPlatformLinks.scheduledAt, start),
          lte(contentPlatformLinks.scheduledAt, end),
        ),
      );
    dueIds = [...new Set(dueRows.map(r => r.contentId))];
    if (dueIds.length > 0) conditions.push(inArray(contentPieces.id, dueIds));
  }

  const [pieces, platformRows] = dueIds && dueIds.length === 0
    ? [[], await getCachedPlatforms()] as const
    : await Promise.all([
        db
          .select()
          .from(contentPieces)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(sortOrder)
          .limit(200),
        getCachedPlatforms(),
      ]);

  const ids = pieces.map(p => p.id);
  const platformMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  const [links, snapRows] =
    ids.length > 0
      ? await getCachedAnalyticsSnapshots(ids).then(({ snapRows, links }) => [links, snapRows] as const)
      : [[], []] as const;

  const viewsMap = viewsByContentId(snapRows);

  const platformByContentId: Record<string, string[]> = {};
  for (const link of links) {
    const slug = platformMap[link.platformId];
    if (slug) {
      if (!platformByContentId[link.contentId]) platformByContentId[link.contentId] = [];
      platformByContentId[link.contentId].push(slug);
    }
  }

  const hubPieces = pieces.map(piece => {
    const linksBySlug = buildLinksBySlug(piece.id, links, platformMap);
    return buildHubPiece(
      piece,
      linksBySlug,
      viewsMap[piece.id] ?? 0,
      platformByContentId[piece.id] ?? [],
    );
  });

  const filterBase = {
    type: typeFilter,
    q: query,
    status: statusFilter,
    sort,
    dir,
    view,
    due: dueFilter,
  };

  function buildUrl(overrides: Record<string, string>) {
    return buildContentHubUrl(filterBase, overrides);
  }

  const showBoard = view === "board";
  const hubReturnTo = buildContentHubUrl(filterBase);
  const emptyCta = EMPTY_CTA_LABELS[typeFilter] ?? EMPTY_CTA_LABELS[""];

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <ContentHubHeader
        count={hubPieces.length}
        typeFilter={typeFilter}
        query={query}
        statusFilter={statusFilter}
        sort={sort}
        dir={dir}
        view={view}
        dueFilter={dueFilter}
      />

      {hubPieces.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>
            ▤
          </p>
          <p className="text-sm" style={{ color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
            {query || typeFilter || statusFilter || dueFilter
              ? "Keine Einträge gefunden."
              : "Noch kein Content angelegt."}
          </p>
          <Link
            href={buildContentNewUrl(filterBase, typeFilter || undefined)}
            className="inline-block mt-4 text-xs px-4 py-2 rounded cms-glass-strong"
            style={{ color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}
          >
            {emptyCta}
          </Link>
        </div>
      ) : (
        <>
          <div className={showBoard ? "hidden md:block mb-6" : "hidden"}>
            <ContentBoard pieces={hubPieces} returnTo={hubReturnTo} />
          </div>
          <div className={showBoard ? "md:hidden" : "block"}>
            <ContentTable
              pieces={hubPieces}
              sort={sort}
              dir={dir}
              typeFilter={typeFilter}
              buildUrl={buildUrl}
              returnTo={hubReturnTo}
            />
          </div>
        </>
      )}
    </div>
  );
}
