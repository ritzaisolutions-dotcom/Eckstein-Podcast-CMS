import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { prepSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const { sectionId } = await params;
  const { bodyMd, status } = await req.json();

  const db = getDb();
  await db.update(prepSections).set({
    bodyMd: bodyMd ?? "",
    status: status ?? "offen",
    lastEditedAt: new Date(),
    lastEditedBy: "kevin",
  }).where(eq(prepSections.id, sectionId));

  return NextResponse.json({ ok: true });
}
