import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", title: "Show Notes Ep.12 — Warum du scheiterst", episode: "Ep.12", status: "published", publishedAt: "2026-05-11" },
  { id: "2", title: "Show Notes Ep.11 — Work-Life-Balance", episode: "Ep.11", status: "published", publishedAt: "2026-05-04" },
];

export default function ArticlesPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Artikel"
        subtitle="Blog · Show Notes"
        actions={
          <Link href="/articles/new">
            <Button size="sm">+ Neuer Artikel</Button>
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
              <th>Datum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK.map(a => (
              <tr key={a.id}>
                <td>
                  <Link href={`/articles/${a.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                    {a.title}
                  </Link>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{a.episode}</td>
                <td><Badge status={a.status} /></td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{a.publishedAt}</td>
                <td><Link href={`/articles/${a.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
