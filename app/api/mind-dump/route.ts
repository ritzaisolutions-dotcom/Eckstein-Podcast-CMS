import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { forumThreads } from "@/lib/db/schema";
import { requireSession } from "@/lib/require-session";

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const body = await req.json();
  const { title, bodyMd, tags, status } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  const [row] = await db.insert(forumThreads).values({
    id: crypto.randomUUID(),
    title,
    bodyMd: bodyMd ?? "",
    tags: tags ?? "[]",
    status: status ?? "idea",
  }).returning({ id: forumThreads.id });

  return NextResponse.json({ id: row.id });
}
