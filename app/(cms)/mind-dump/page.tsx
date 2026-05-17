export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { forumThreads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  idea:      { label: "Idee",      color: "var(--gold)",   bg: "rgba(201,168,76,0.12)" },
  in_arbeit: { label: "In Arbeit", color: "var(--navy)",   bg: "rgba(12,30,53,0.08)" },
  umgesetzt: { label: "Umgesetzt", color: "#4caf7d",       bg: "rgba(76,175,125,0.12)" },
  verworfen: { label: "Verworfen", color: "var(--text-muted)", bg: "var(--cream-mid)" },
};

export default async function MindDumpPage() {
  const db = getDb();

  const threads = await db
    .select()
    .from(forumThreads)
    .orderBy(desc(forumThreads.createdAt))
    .limit(50);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Ideen & Topics</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            Brainstorm · {threads.length} Einträge
          </p>
        </div>
        <Link
          href="/mind-dump/new"
          className="text-xs px-4 py-2 rounded"
          style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}
        >
          + NEU
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>⊕</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Ideen. Schreib alles rein — Folgenideen, Quotes, Gast-Vorschläge.
          </p>
          <Link href="/mind-dump/new" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Erste Idee anlegen
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {threads.map(thread => {
            const tags: string[] = (() => { try { return JSON.parse(thread.tags ?? "[]"); } catch { return []; } })();
            const reactions: Record<string, number> = (() => { try { return JSON.parse(thread.reactions ?? "{}"); } catch { return {}; } })();
            const s = STATUS_DISPLAY[thread.status] ?? STATUS_DISPLAY.idea;
            return (
              <Link
                key={thread.id}
                href={`/mind-dump/${thread.id}`}
                className="cms-card flex items-start gap-4 hover:border-gold transition-colors"
                style={{ textDecoration: "none" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color, fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.06em" }}>
                      {s.label}
                    </span>
                    {thread.source === "telegram" && (
                      <span className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "rgba(0,136,204,0.1)", color: "rgba(0,136,204,0.8)", border: "1px solid rgba(0,136,204,0.2)" }}>
                        Telegram
                      </span>
                    )}
                    {tags.map(t => (
                      <span key={t} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--cream-mid)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                    {thread.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(thread.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  {reactions.fire > 0 && <span className="text-sm" style={{ color: "var(--text-muted)" }}>🔥 {reactions.fire}</span>}
                  {reactions.star > 0 && <span className="text-sm" style={{ color: "var(--text-muted)" }}>⭐ {reactions.star}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
