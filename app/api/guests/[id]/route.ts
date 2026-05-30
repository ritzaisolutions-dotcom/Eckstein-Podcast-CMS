import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/require-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const db = getDb();
  const [guest] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  if (!guest) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(guest);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const body = await req.json();
  const { name, status, topics, bioMd, socials } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const db = getDb();
  await db.update(guests).set({
    name,
    status: status ?? "angefragt",
    topics: topics ?? "[]",
    bioMd: bioMd ?? null,
    socials: socials ?? "{}",
  }).where(eq(guests.id, id));

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;
  const { id } = await params;
  const db = getDb();
  await db.delete(guests).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}
