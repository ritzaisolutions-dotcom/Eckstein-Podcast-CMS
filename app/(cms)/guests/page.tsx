import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const MOCK = [
  { id: "1", name: "Stefan Müller", status: "aufgenommen", topics: ["Unternehmertum", "Führung"], episodesCount: 2 },
  { id: "2", name: "Anna Berger", status: "zugesagt", topics: ["Psychologie", "Resilienz"], episodesCount: 0 },
  { id: "3", name: "Max Hoffmann", status: "angefragt", topics: ["Finanzen", "Investing"], episodesCount: 0 },
];

export default function GuestsPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader
        title="Gäste"
        subtitle="Gast-Datenbank"
        actions={
          <Link href="/guests/new">
            <Button size="sm">+ Gast hinzufügen</Button>
          </Link>
        }
      />
      <div className="cms-card p-0 overflow-x-auto">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Themen</th>
              <th>Episoden</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK.map(g => (
              <tr key={g.id}>
                <td>
                  <Link href={`/guests/${g.id}`} className="hover:underline font-medium" style={{ color: "var(--navy)" }}>
                    {g.name}
                  </Link>
                </td>
                <td><Badge status={g.status} /></td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {g.topics.map(t => (
                      <span key={t} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--bg-surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {g.episodesCount > 0 ? g.episodesCount : "—"}
                </td>
                <td><Link href={`/guests/${g.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
