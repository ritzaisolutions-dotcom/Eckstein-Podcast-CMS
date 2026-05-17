export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { forumThreads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

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
      </div>

      <div className="cms-card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)" }}>{thread.title}</h1>
          <span className="shrink-0 text-xs px-2 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem" }}>
            {thread.status}
          </span>
        </div>

        {thread.bodyMd && (
          <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)", lineHeight: 1.7 }}>
            {thread.bodyMd}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--cream-mid)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{t}</span>
            ))}
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(thread.createdAt).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          {thread.source === "telegram" && " · via Telegram"}
        </p>
      </div>
    </div>
  );
}
