export const dynamic = "force-dynamic";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { getDb } from "@/lib/db";
import { getCachedPlatforms } from "@/lib/cache";
import { contentPieces, contentPlatformLinks } from "@/lib/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";

export default async function NewsletterPage() {
  const db = getDb();

  // Fetch articles (type = article or newsletter)
  const articles = await db
    .select()
    .from(contentPieces)
    .where(and(
      eq(contentPieces.type, "article"),
    ))
    .orderBy(desc(contentPieces.uploadDate))
    .limit(50);

  const ids = articles.map(a => a.id);
  const links = ids.length > 0
    ? await db.select().from(contentPlatformLinks).where(inArray(contentPlatformLinks.contentId, ids))
    : [];
  const platformRows = await getCachedPlatforms();
  const platMap = Object.fromEntries(platformRows.map(p => [p.id, p.slug]));

  const platByContent: Record<string, string[]> = {};
  for (const l of links) {
    if (!platByContent[l.contentId]) platByContent[l.contentId] = [];
    platByContent[l.contentId].push(platMap[l.platformId] ?? "");
  }

  // Filter to only articles linked to substack or x
  const fundament = articles.filter(a => {
    const slugs = platByContent[a.id] ?? [];
    return slugs.some(s => s === "substack" || s === "x") || slugs.length === 0;
  });

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>Das Fundament</h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
            Artikel auf Substack & X · {fundament.length} Einträge
          </p>
        </div>
        <Link href="/content?type=article" className="text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}>
          + NEUER ARTIKEL
        </Link>
      </div>

      {fundament.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>✦</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Artikel angelegt. Das Fundament erscheint jeden Sonntag auf Substack und X.
          </p>
          <Link href="/episodes/new?type=article" className="inline-block mt-4 text-xs px-4 py-2 rounded" style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}>
            Ersten Artikel anlegen
          </Link>
        </div>
      ) : (
        <div className="cms-card p-0 overflow-x-auto">
          <table className="cms-table w-full">
            <thead>
              <tr>
                <th className="pl-4">Titel</th>
                <th>Status</th>
                <th>Plattformen</th>
                <th>Datum</th>
                <th className="pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {fundament.map(article => {
                const slugs = platByContent[article.id] ?? [];
                return (
                  <tr key={article.id}>
                    <td className="pl-4">
                      <Link href={`/episodes/${article.id}`} className="hover:underline" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                        {article.title}
                      </Link>
                      {article.bio && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{article.bio}</p>
                      )}
                    </td>
                    <td><Badge status={article.status as "draft" | "scheduled" | "published"} /></td>
                    <td>
                      <div className="flex gap-1">
                        {slugs.map(s => (
                          <span key={s} className="text-xs px-1.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--cream-mid)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                            {s === "substack" ? "Substack" : s === "x" ? "X" : s.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {article.uploadDate ? new Date(article.uploadDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                    </td>
                    <td className="pr-4">
                      <Link href={`/episodes/${article.id}`} style={{ color: "var(--gold)", fontSize: "0.85rem" }}>↗</Link>
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
