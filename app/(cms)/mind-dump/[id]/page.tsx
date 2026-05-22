export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { forumThreads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import IdeaEditForm from "./IdeaEditForm";

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id)).limit(1);
  if (!thread) notFound();

  const tags: string[] = (() => { try { return JSON.parse(thread.tags ?? "[]"); } catch { return []; } })();

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mind-dump" className="text-sm" style={{ color: "var(--text-muted)" }}>← Ideen & Topics</Link>
        <span className="text-sm" style={{ color: "var(--border)" }}>/</span>
        <h1 className="text-lg truncate" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
          {thread.title}
        </h1>
      </div>

      <IdeaEditForm
        id={id}
        initial={{ title: thread.title, bodyMd: thread.bodyMd ?? "", tags, status: thread.status }}
      />
    </div>
  );
}
