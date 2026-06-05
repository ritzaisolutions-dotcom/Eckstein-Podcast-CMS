import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contentPieces } from "@/lib/db/schema";
import { invalidateContentCaches } from "@/lib/cache";
import { requireSession } from "@/lib/require-session";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/lib/lifecycle";
import { syncContentStatus } from "@/lib/content-sync";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const stage = body.stage as string;

  if (!stage || !LIFECYCLE_STAGES.includes(stage as LifecycleStage)) {
    return NextResponse.json({ error: "Ungültiger Lifecycle-Stage" }, { status: 400 });
  }

  const db = getDb();
  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, id)).limit(1);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db
    .update(contentPieces)
    .set({ lifecycleStage: stage, updatedAt: new Date() })
    .where(eq(contentPieces.id, id));

  const status = await syncContentStatus(id, stage);
  invalidateContentCaches();

  return NextResponse.json({ id, lifecycleStage: stage, status });
}
