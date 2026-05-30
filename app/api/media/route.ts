import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/require-session";

export async function GET(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const db = getDb();
  const assets = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt)).limit(200);

  return NextResponse.json(assets.map(a => ({
    ...a,
    tags: JSON.parse(a.tags ?? "[]") as string[],
  })));
}

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const body = await req.json();
  const { filename, blobUrl, mime, sizeBytes, tags } = body as {
    filename?: string;
    blobUrl?: string;
    mime?: string;
    sizeBytes?: number;
    tags?: string[];
  };

  if (!filename || !blobUrl || !mime) {
    return NextResponse.json({ error: "filename, blobUrl, and mime required" }, { status: 400 });
  }

  const db = getDb();
  const [asset] = await db.insert(mediaAssets).values({
    filename,
    blobUrl,
    mime,
    sizeBytes: sizeBytes ?? null,
    tags: JSON.stringify(tags ?? []),
  }).returning();

  return NextResponse.json({
    ...asset,
    tags: JSON.parse(asset.tags ?? "[]") as string[],
  });
}
