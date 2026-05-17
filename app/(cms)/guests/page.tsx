export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { guests, contentPieces } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  angefragt:  { label: "Angefragt",  color: "var(--text-muted)",      bg: "var(--cream-mid)" },
  zugesagt:   { label: "Zugesagt",   color: "var(--gold)",             bg: "rgba(201,168,76,0.12)" },
  aufgenommen:{ label: "Aufgenommen",color: "#4caf7d",                 bg: "rgba(76,175,125,0.12)" },
  mehrfach:   { label: "Mehrfach",   color: "var(--navy)",             bg: "rgba(12,30,53,0.08)" },
};

export default async function GuestsPage() {
  const db = getDb();

  const rows = await db
    .select()
    .from(guests)
    .orderBy(desc(guests.createdAt));

  const episodeCounts = await db
    .select({ guestId: contentPieces.guestId, cnt: count() })
    .from(contentPieces)
    .groupBy(contentPieces.guestId);
  const epCountMap = Object.fromEntries(episodeCounts.map(r => [r.guestId, Number(r.cnt)]));

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Gäste</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            Podcast-Gäste · {rows.length} Einträge
          </p>
        </div>
        <Link
          href="/guests/new"
          className="text-xs px-4 py-2 rounded"
          style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}
        >
          + GAST
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>◎</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Gäste angelegt. Gäste werden automatisch mit Episoden verknüpft.
          </p>
          <Link href="/guests/new" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Ersten Gast anlegen
          </Link>
        </div>
      ) : (
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table w-full">
            <thead>
              <tr>
                <th className="pl-4">Name</th>
                <th>Status</th>
                <th>Themen</th>
                <th>Episoden</th>
                <th className="pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(g => {
                const topics: string[] = (() => { try { return JSON.parse(g.topics ?? "[]"); } catch { return []; } })();
                const s = STATUS_LABELS[g.status] ?? STATUS_LABELS.angefragt;
                const epCount = epCountMap[g.id] ?? 0;
                return (
                  <tr key={g.id}>
                    <td className="pl-4">
                      <Link href={`/guests/${g.id}`} className="hover:underline font-medium" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                        {g.name}
                      </Link>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color, fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.06em" }}>
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {topics.slice(0, 3).map(t => (
                          <span key={t} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--cream-mid)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                            {t}
                          </span>
                        ))}
                        {topics.length > 3 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{topics.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: epCount > 0 ? "var(--navy)" : "var(--text-muted)" }}>
                      {epCount > 0 ? epCount : "—"}
                    </td>
                    <td className="pr-4">
                      <Link href={`/guests/${g.id}`} style={{ color: "var(--gold)", fontSize: "0.85rem" }}>↗</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
