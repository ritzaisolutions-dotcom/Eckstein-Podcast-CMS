import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { forumThreads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, bodyMd, tags, status } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  await db
    .update(forumThreads)
    .set({ title, bodyMd: bodyMd ?? "", tags: tags ?? "[]", status: status ?? "idea" })
    .where(eq(forumThreads.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  await db.delete(forumThreads).where(eq(forumThreads.id, id));
  return NextResponse.json({ ok: true });
}
