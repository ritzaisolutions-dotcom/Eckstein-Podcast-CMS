import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { getCachedPlatforms, invalidateContentCaches } from "@/lib/cache";
import { requireSession } from "@/lib/require-session";
import { allowedPlatformSlugs } from "@/lib/platforms";
import { syncContentStatus } from "@/lib/content-sync";

function parsePostedAt(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === false) return null;
  if (value === true || value === "now") return new Date();
  if (typeof value === "string" && value.trim()) return new Date(value);
  return null;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string") return new Date(value);
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string }> },
) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id, slug } = await params;
  const body = await req.json();

  const db = getDb();
  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  const allowed = allowedPlatformSlugs(piece.type);
  if (!allowed.has(slug)) {
    return NextResponse.json({ error: `Plattform nicht erlaubt für ${piece.type}: ${slug}` }, { status: 400 });
  }

  const platformRows = await getCachedPlatforms();
  const platformId = platformRows.find(p => p.slug === slug)?.id;
  if (!platformId) return NextResponse.json({ error: "Plattform unbekannt" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(contentPlatformLinks)
    .where(and(eq(contentPlatformLinks.contentId, id), eq(contentPlatformLinks.platformId, platformId)))
    .limit(1);

  const url = body.url !== undefined ? (body.url?.trim() || null) : existing?.url ?? null;
  const scheduledAt = parseOptionalDate(body.scheduledAt) ?? existing?.scheduledAt ?? null;
  const postedAt = parsePostedAt(body.postedAt) ?? existing?.postedAt ?? null;
  const externalId = body.externalId !== undefined ? (body.externalId?.trim() || null) : existing?.externalId ?? null;

  if (existing) {
    await db
      .update(contentPlatformLinks)
      .set({ url, scheduledAt, postedAt, externalId })
      .where(and(eq(contentPlatformLinks.contentId, id), eq(contentPlatformLinks.platformId, platformId)));
  } else {
    await db.insert(contentPlatformLinks).values({
      contentId: id,
      platformId,
      url,
      scheduledAt,
      postedAt,
      externalId,
    });
  }

  const status = await syncContentStatus(id, piece.lifecycleStage);
  invalidateContentCaches();

  return NextResponse.json({
    slug,
    url: url ?? "",
    scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    postedAt: postedAt ? postedAt.toISOString() : null,
    externalId: externalId ?? "",
    status,
  });
}
