import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { guests } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, status, topics, bioMd, socials } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const db = getDb();
  const [row] = await db.insert(guests).values({
    id: crypto.randomUUID(),
    name,
    status: status ?? "angefragt",
    topics: topics ?? "[]",
    bioMd: bioMd ?? null,
    socials: socials ?? "{}",
  }).returning({ id: guests.id });

  return NextResponse.json({ id: row.id });
}
