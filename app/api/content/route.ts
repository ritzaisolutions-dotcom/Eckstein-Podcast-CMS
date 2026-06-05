import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { eq, count, and, ilike, desc } from "drizzle-orm";
import { getCachedPlatforms, invalidateContentCaches } from "@/lib/cache";
import { requireSession } from "@/lib/require-session";
import { isContentType, validatePlatformLinks } from "@/lib/platforms";
import { deriveContentStatus } from "@/lib/content-status";
import { syncContentStatus } from "@/lib/content-sync";

export async function GET(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "lfc";
  const q = searchParams.get("q") ?? "";

  const db = getDb();
  const conditions = [eq(contentPieces.type, type)];
  if (q) conditions.push(ilike(contentPieces.title, `%${q}%`));

  const pieces = await db
    .select({
      id: contentPieces.id,
      title: contentPieces.title,
      episodeNumber: contentPieces.episodeNumber,
      typeIndex: contentPieces.typeIndex,
    })
    .from(contentPieces)
    .where(and(...conditions))
    .orderBy(desc(contentPieces.createdAt))
    .limit(50);

  return NextResponse.json(pieces);
}

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const body = await req.json();
  const {
    type, title, bio, bodyMd, episodeNumber,
    lifecycleStage, uploadDate, filmingDate,
    parentId,
    platformLinks = [],
  } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "type and title are required" }, { status: 400 });
  }

  if (!isContentType(type)) {
    return NextResponse.json({ error: `Ungültiger Content-Typ: ${type}` }, { status: 400 });
  }

  const platformError = validatePlatformLinks(type, platformLinks);
  if (platformError) {
    return NextResponse.json({ error: platformError }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();

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
    status: deriveContentStatus(lifecycleStage ?? "draft", platformLinks),
    parentId: parentId || null,
  });

  if (platformLinks.length > 0) {
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

    if (linksToInsert.length > 0) {
      await db.insert(contentPlatformLinks).values(linksToInsert);
    }
  }

  await syncContentStatus(id, lifecycleStage ?? "draft");
  invalidateContentCaches();
  return NextResponse.json({ id });
}
