import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", title: "Hook über Scheitern", episode: "Ep.12 · 0:34", status: "scheduled", platforms: ["yt_shorts", "tiktok", "ig_reels"], scheduledAt: "2026-05-18" },
  { id: "2", title: "Florian's Konter", episode: "Ep.12 · 8:12", status: "draft", platforms: ["yt_shorts"], scheduledAt: null },
];

const PLATFORM_LABELS: Record<string, string> = {
  yt_shorts: "YT Shorts", tiktok: "TikTok", ig_reels: "IG Reels", x: "X",
};

export default function ShortsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Shorts"
        subtitle="Short-Form Clips"
        actions={
          <Link href="/shorts/new">
            <Button size="sm">+ Neuer Clip</Button>
          </Link>
        }
      />

      {/* Clip Queue Banner */}
      <div className="mb-4 px-4 py-3 rounded border flex items-center justify-between" style={{ background: "rgba(201,168,76,0.08)", borderColor: "var(--gold)" }}>
        <span className="text-sm" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--navy)" }}>
          ⬡ Clip Queue: <strong>2 Timestamps</strong> warten auf Bearbeitung
        </span>
        <Link href="/shorts/queue" className="text-xs" style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.1em" }}>
          QUEUE ÖFFNEN →
        </Link>
      </div>

      <div className="cms-card p-0 overflow-x-auto">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Episode</th>
              <th>Status</th>
              <th>Plattformen</th>
              <th>Geplant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK.map(clip => (
              <tr key={clip.id}>
                <td>
                  <Link href={`/shorts/${clip.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                    {clip.title}
                  </Link>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{clip.episode}</td>
                <td><Badge status={clip.status} /></td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {clip.platforms.map(p => (
                      <span key={p} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {PLATFORM_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{clip.scheduledAt ?? "—"}</td>
                <td><Link href={`/shorts/${clip.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
