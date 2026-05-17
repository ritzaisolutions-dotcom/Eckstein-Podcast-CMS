import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", title: "Warum Scheitern kein Versagen ist", episode: "Ep.12", status: "published", publishedAt: "2026-05-11", platforms: ["substack", "x"] },
  { id: "2", title: "Die Lüge der Balance", episode: "Ep.11", status: "published", publishedAt: "2026-05-04", platforms: ["substack"] },
  { id: "3", title: "Ep.13 Newsletter", episode: "Ep.13", status: "draft", publishedAt: null, platforms: [] },
];

export default function NewsletterPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Das Fundament"
        subtitle="Newsletter — Sonntags"
        actions={
          <Link href="/newsletter/new">
            <Button size="sm">+ Neuer Newsletter</Button>
          </Link>
        }
      />
      <div className="cms-card p-0 overflow-x-auto">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Episode</th>
              <th>Status</th>
              <th>Plattformen</th>
              <th>Datum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK.map(n => (
              <tr key={n.id}>
                <td>
                  <Link href={`/newsletter/${n.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                    {n.title}
                  </Link>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{n.episode}</td>
                <td><Badge status={n.status} /></td>
                <td>
                  <div className="flex gap-1">
                    {n.platforms.map(p => (
                      <span key={p} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {p === "substack" ? "Substack" : "X"}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{n.publishedAt ?? "—"}</td>
                <td><Link href={`/newsletter/${n.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
