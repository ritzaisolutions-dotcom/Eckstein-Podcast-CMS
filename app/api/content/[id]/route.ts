import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks, platforms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  const links = await db.select().from(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));
  const platformRows = await db.select().from(platforms);
  const idToSlug = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  const platformLinks = links.map(l => ({
    slug: idToSlug[l.platformId] ?? String(l.platformId),
    url: l.url ?? "",
    externalId: l.externalId ?? "",
    scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString().slice(0, 16) : "",
  }));

  return NextResponse.json({ ...piece, platformLinks });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    type, title, bio, bodyMd, episodeNumber,
    lifecycleStage, uploadDate, filmingDate,
    platformLinks = [],
  } = body;

  const db = getDb();

  await db.update(contentPieces)
    .set({
      type,
      title,
      bio: bio || null,
      bodyMd: bodyMd || null,
      episodeNumber: episodeNumber ? Number(episodeNumber) : null,
      lifecycleStage: lifecycleStage ?? "draft",
      uploadDate: uploadDate ? new Date(uploadDate) : null,
      filmingDate: filmingDate ? new Date(filmingDate) : null,
      status: lifecycleStage === "live" ? "published" : "draft",
      updatedAt: new Date(),
    })
    .where(eq(contentPieces.id, id));

  // Replace all platform links
  await db.delete(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));

  if (platformLinks.length > 0) {
    const platformRows = await db.select().from(platforms);
    const slugToId = Object.fromEntries(platformRows.map(p => [p.slug, p.id]));

    const linksToInsert = platformLinks
      .filter((l: { slug: string }) => slugToId[l.slug])
      .map((l: { slug: string; url: string; externalId: string; scheduledAt: string }) => ({
        contentId: id,
        platformId: slugToId[l.slug],
        url: l.url || null,
        externalId: l.externalId || null,
        scheduledAt: l.scheduledAt ? new Date(l.scheduledAt) : null,
      }));

    if (linksToInsert.length > 0) {
      await db.insert(contentPlatformLinks).values(linksToInsert);
    }
  }



  return NextResponse.json({ id });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  await db.delete(contentPlatformLinks).where(eq(contentPlatformLinks.contentId, id));
  await db.delete(contentPieces).where(eq(contentPieces.id, id));



  return NextResponse.json({ ok: true });
}
