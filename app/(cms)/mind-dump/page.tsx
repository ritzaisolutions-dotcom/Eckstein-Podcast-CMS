import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", title: "Folge über Demut — ist das zu religiös?", status: "idea", source: "cms", tags: ["folgenidee"], createdAt: "2026-05-16", reactions: { fire: 2, star: 1 } },
  { id: "2", title: '"Wer fragt, führt." — gutes Zitat für Opener', status: "idea", source: "telegram", tags: ["quote", "hook"], createdAt: "2026-05-15", reactions: { fire: 0, star: 3 } },
  { id: "3", title: "Gast-Idee: Unternehmer aus Koblenz über lokales Networking", status: "in_arbeit", source: "cms", tags: ["gast"], createdAt: "2026-05-14", reactions: { fire: 1, star: 2 } },
];

const REACTION_EMOJIS = { fire: "🔥", star: "⭐", thumbs_up: "👍" };

export default function MindDumpPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Mind Dump"
        subtitle="Brainstorm & Ideen"
        actions={
          <Link href="/mind-dump/new">
            <Button size="sm">+ Neuer Thread</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input type="search" placeholder="Suchen..." className="cms-input" style={{ maxWidth: 200 }} />
        {["Alle", "Idee", "In Arbeit", "Umgesetzt", "Verworfen"].map(s => (
          <button key={s} className="px-3 py-1.5 rounded border text-xs" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.1em", borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-surface)" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Thread cards */}
      <div className="flex flex-col gap-3">
        {MOCK.map(thread => (
          <Link
            key={thread.id}
            href={`/mind-dump/${thread.id}`}
            className="cms-card flex items-start gap-4 hover:border-gold transition-colors"
            style={{ borderColor: "var(--border)", textDecoration: "none" }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge status={thread.status} />
                {thread.source === "telegram" && (
                  <span className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "rgba(0,136,204,0.1)", color: "rgba(0,136,204,0.8)", border: "1px solid rgba(0,136,204,0.2)" }}>
                    Telegram
                  </span>
                )}
                {thread.tags.map(t => (
                  <span key={t} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                {thread.title}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{thread.createdAt}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              {Object.entries(thread.reactions).map(([key, count]) => count > 0 && (
                <span key={key} className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {REACTION_EMOJIS[key as keyof typeof REACTION_EMOJIS]} {count}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
