import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodePreps, prepShareLinks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/require-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const db = getDb();

  const [prep] = await db.select().from(episodePreps).where(eq(episodePreps.id, id)).limit(1);
  if (!prep) return NextResponse.json({ error: "not found" }, { status: 404 });

  const links = await db.select({
    id: prepShareLinks.id,
    token: prepShareLinks.token,
    expiresAt: prepShareLinks.expiresAt,
    readOnly: prepShareLinks.readOnly,
    createdAt: prepShareLinks.createdAt,
  })
    .from(prepShareLinks)
    .where(eq(prepShareLinks.prepId, id))
    .orderBy(desc(prepShareLinks.createdAt));

  return NextResponse.json(links);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id } = await params;
  const db = getDb();

  const [prep] = await db.select().from(episodePreps).where(eq(episodePreps.id, id)).limit(1);
  if (!prep) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : 14;

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [link] = await db.insert(prepShareLinks).values({
    prepId: id,
    token,
    expiresAt,
    readOnly: true,
  }).returning();

  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin;

  return NextResponse.json({
    ...link,
    url: `${origin}/share/prep/${token}`,
  });
}
