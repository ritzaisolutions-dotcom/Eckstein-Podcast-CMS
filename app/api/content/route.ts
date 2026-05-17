import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks, platforms } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    type, title, bio, bodyMd, episodeNumber,
    lifecycleStage, uploadDate, filmingDate,
    platformLinks = [],
  } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "type and title are required" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();

  // Calculate next typeIndex for this content type
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(contentPieces)
    .where(eq(contentPieces.type, type));
  const typeIndex = Number(cnt) + 1;

  await db.insert(contentPieces).values({
    id,
    type,
    typeIndex,
    title,
    bio: bio || null,
    bodyMd: bodyMd || null,
    episodeNumber: episodeNumber ? Number(episodeNumber) : null,
    lifecycleStage: lifecycleStage ?? "draft",
    uploadDate: uploadDate ? new Date(uploadDate) : null,
    filmingDate: filmingDate ? new Date(filmingDate) : null,
    status: lifecycleStage === "live" ? "published" : "draft",
  });

  // Insert platform links if any
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
