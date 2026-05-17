import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", title: "Neue Episode ist live 🔥", platforms: ["x", "instagram"], status: "posted", scheduledAt: "2026-05-11", chars: { x: 180, instagram: 420 } },
  { id: "2", title: "Teaser Ep.13 — coming Sunday", platforms: ["x"], status: "scheduled", scheduledAt: "2026-05-22", chars: { x: 240 } },
];

export default function PostsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Social Posts"
        subtitle="X · Instagram"
        actions={
          <Link href="/posts/new">
            <Button size="sm">+ Neuer Post</Button>
          </Link>
        }
      />
      <div className="cms-card p-0 overflow-x-auto">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Text</th>
              <th>Plattformen</th>
              <th>Status</th>
              <th>Datum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/posts/${p.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                    {p.title}
                  </Link>
                </td>
                <td>
                  <div className="flex gap-1">
                    {p.platforms.map(pl => (
                      <span key={pl} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {pl === "x" ? "X" : "IG"}
                      </span>
                    ))}
                  </div>
                </td>
                <td><Badge status={p.status} /></td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{p.scheduledAt}</td>
                <td><Link href={`/posts/${p.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
