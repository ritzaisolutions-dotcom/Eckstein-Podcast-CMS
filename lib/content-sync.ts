import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { deriveContentStatus } from "@/lib/content-status";

export async function syncContentStatus(contentId: string, lifecycleStage: string) {
  const db = getDb();
  const links = await db
    .select({
      scheduledAt: contentPlatformLinks.scheduledAt,
      postedAt: contentPlatformLinks.postedAt,
    })
    .from(contentPlatformLinks)
    .where(eq(contentPlatformLinks.contentId, contentId));

  const status = deriveContentStatus(lifecycleStage, links);
  await db
    .update(contentPieces)
    .set({ status, updatedAt: new Date() })
    .where(eq(contentPieces.id, contentId));

  return status;
}
