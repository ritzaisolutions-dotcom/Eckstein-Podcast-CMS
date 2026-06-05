import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  contentPieces, contentPlatformLinks,
  analyticsSnapshots, mediaAssetLinks, contentTags,
  episodeTasks, clipQueue, episodePreps,
} from "@/lib/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import { getCachedPlatforms, invalidateContentCaches } from "@/lib/cache";
import { requireSession } from "@/lib/require-session";
import { isContentType, validatePlatformLinks, allowedPlatformSlugs } from "@/lib/platforms";
import { syncContentStatus } from "@/lib/content-sync";
import { toDatetimeLocalValue } from "@/lib/datetime-local";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id } = await params;
  const db = getDb();

  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  const links = await db.select().from(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));
  const platformRows = await getCachedPlatforms();
  const idToSlug = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  const platformLinks = links.map(l => ({
    slug: idToSlug[l.platformId] ?? String(l.platformId),
    url: l.url ?? "",
    externalId: l.externalId ?? "",
    scheduledAt: l.scheduledAt ? toDatetimeLocalValue(l.scheduledAt) : "",
    postedAt: l.postedAt ? l.postedAt.toISOString() : null,
  }));

  return NextResponse.json({ ...piece, platformLinks });
}

async function pruneDisallowedLinks(db: ReturnType<typeof getDb>, contentId: string, type: string) {
  const allowed = allowedPlatformSlugs(type);
  const platformRows = await getCachedPlatforms();
  const slugToId = Object.fromEntries(platformRows.map(p => [p.slug, p.id]));
  const disallowedIds = platformRows
    .filter(p => !allowed.has(p.slug))
    .map(p => p.id);

  if (disallowedIds.length === 0) return;

  await db
    .delete(contentPlatformLinks)
    .where(and(
      eq(contentPlatformLinks.contentId, contentId),
      inArray(contentPlatformLinks.platformId, disallowedIds),
    ));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const {
    type, title, bio, bodyMd, episodeNumber,
    lifecycleStage, uploadDate, filmingDate,
    parentId,
    platformLinks,
  } = body;

  const db = getDb();
  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  const nextType = type ?? piece.type;
  if (!isContentType(nextType)) {
    return NextResponse.json({ error: `Ungültiger Content-Typ: ${nextType}` }, { status: 400 });
  }

  if (platformLinks !== undefined) {
    const platformError = validatePlatformLinks(nextType, platformLinks);
    if (platformError) {
      return NextResponse.json({ error: platformError }, { status: 400 });
    }
  }

  const nextLifecycle = lifecycleStage ?? piece.lifecycleStage;
  const nextEpisodeNumber =
    episodeNumber !== undefined
      ? episodeNumber ? Number(episodeNumber) : null
      : piece.episodeNumber;

  await db.update(contentPieces)
    .set({
      type: nextType,
      title: title ?? piece.title,
      bio: bio !== undefined ? (bio || null) : piece.bio,
      bodyMd: bodyMd !== undefined ? (bodyMd || null) : piece.bodyMd,
      episodeNumber: nextEpisodeNumber,
      lifecycleStage: nextLifecycle,
      uploadDate: uploadDate !== undefined ? (uploadDate ? new Date(uploadDate) : null) : piece.uploadDate,
      filmingDate: filmingDate !== undefined ? (filmingDate ? new Date(filmingDate) : null) : piece.filmingDate,
      parentId: parentId !== undefined ? (parentId ?? null) : piece.parentId,
      updatedAt: new Date(),
    })
    .where(eq(contentPieces.id, id));

  if (nextType !== piece.type) {
    await pruneDisallowedLinks(db, id, nextType);
  }

  if (platformLinks !== undefined) {
    const platformRows = await getCachedPlatforms();
    const slugToId = Object.fromEntries(platformRows.map(p => [p.slug, p.id]));

    const linksToInsert = platformLinks
      .filter((l: { slug: string }) => slugToId[l.slug])
      .map((l: { slug: string; url: string; externalId: string; scheduledAt: string; postedAt?: string | null }) => ({
        contentId: id,
        platformId: slugToId[l.slug],
        url: l.url || null,
        externalId: l.externalId || null,
        scheduledAt: l.scheduledAt ? new Date(l.scheduledAt) : null,
        postedAt: l.postedAt ? new Date(l.postedAt) : null,
      }));

    await db.transaction(async (tx) => {
      await tx.delete(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));
      if (linksToInsert.length > 0) {
        await tx.insert(contentPlatformLinks).values(linksToInsert);
      }
    });
  }

  const status = await syncContentStatus(id, nextLifecycle);
  invalidateContentCaches();
  return NextResponse.json({ id, status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id } = await params;
  const db = getDb();

  await db.update(contentPieces)
    .set({ parentId: null })
    .where(eq(contentPieces.parentId, id));

  await db.update(episodePreps)
    .set({ linkedContentId: null })
    .where(eq(episodePreps.linkedContentId, id));

  await Promise.all([
    db.delete(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id)),
    db.delete(analyticsSnapshots).where(eq(analyticsSnapshots.contentId, id)),
    db.delete(mediaAssetLinks).where(eq(mediaAssetLinks.contentId, id)),
    db.delete(contentTags).where(eq(contentTags.contentId, id)),
    db.delete(episodeTasks).where(eq(episodeTasks.contentId, id)),
    db.delete(clipQueue).where(
      or(eq(clipQueue.contentId, id), eq(clipQueue.clipContentId, id))
    ),
  ]);

  await db.delete(contentPieces).where(eq(contentPieces.id, id));

  invalidateContentCaches();
  return NextResponse.json({ ok: true });
}
