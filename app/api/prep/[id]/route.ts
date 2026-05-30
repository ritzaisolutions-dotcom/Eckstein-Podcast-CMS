import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodePreps, prepSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/require-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const db = getDb();

  const [prep] = await db.select().from(episodePreps).where(eq(episodePreps.id, id)).limit(1);
  if (!prep) return NextResponse.json({ error: "not found" }, { status: 404 });

  const sections = await db.select().from(prepSections).where(eq(prepSections.prepId, id));
  return NextResponse.json({ ...prep, sections });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const { workingTitle, status, episodeNumber, plannedDate } = body;

  const db = getDb();
  await db.update(episodePreps).set({
    workingTitle,
    status: status ?? "sammeln",
    episodeNumber: episodeNumber ? Number(episodeNumber) : null,
    plannedDate: plannedDate ? new Date(plannedDate) : null,
    updatedAt: new Date(),
  }).where(eq(episodePreps.id, id));

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const db = getDb();
  await db.delete(prepSections).where(eq(prepSections.prepId, id));
  await db.delete(episodePreps).where(eq(episodePreps.id, id));
  return NextResponse.json({ ok: true });
}
