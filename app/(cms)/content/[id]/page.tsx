export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { getCachedPlatforms } from "@/lib/cache";
import { getPlatformsForType } from "@/lib/platforms";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import ContentEditPanel from "@/components/content/ContentEditPanel";
import DeleteContentButton from "@/components/DeleteContentButton";

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const hubBackHref = returnTo?.startsWith("/content") ? returnTo : "/content";
  const db = getDb();

  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) notFound();

  const links = await db.select().from(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));
  const platformRows = await getCachedPlatforms();
  const idToSlug = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  const linksBySlug: Record<string, { url: string; scheduledAt: string; postedAt: string | null }> = {};
  for (const link of links) {
    const slug = idToSlug[link.platformId];
    if (!slug) continue;
    linksBySlug[slug] = {
      url: link.url ?? "",
      scheduledAt: toDatetimeLocalValue(link.scheduledAt),
      postedAt: link.postedAt ? link.postedAt.toISOString() : null,
    };
  }

  const platformLinks = getPlatformsForType(piece.type).map(def => ({
    slug: def.slug,
    url: linksBySlug[def.slug]?.url ?? "",
    scheduledAt: linksBySlug[def.slug]?.scheduledAt ?? "",
    postedAt: linksBySlug[def.slug]?.postedAt ?? null,
  }));

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex justify-end mb-3">
        <DeleteContentButton id={id} title={piece.title} />
      </div>
      <ContentEditPanel
        hubBackHref={hubBackHref}
        data={{
          id: piece.id,
          type: piece.type,
          title: piece.title,
          bio: piece.bio,
          bodyMd: piece.bodyMd,
          episodeNumber: piece.episodeNumber,
          lifecycleStage: piece.lifecycleStage,
          status: piece.status,
          filmingDate: piece.filmingDate ? piece.filmingDate.toISOString() : null,
          uploadDate: piece.uploadDate ? piece.uploadDate.toISOString() : null,
          platformLinks,
        }}
      />
    </div>
  );
}
