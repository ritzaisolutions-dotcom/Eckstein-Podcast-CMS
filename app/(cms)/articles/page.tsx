export const dynamic = "force-dynamic";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getDb } from "@/lib/db";
import { contentPieces } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export default async function ArticlesPage() {
  const db = getDb();

  const articles = await db
    .select()
    .from(contentPieces)
    .where(eq(contentPieces.type, "article"))
    .orderBy(desc(contentPieces.uploadDate))
    .limit(100);

  const parentIds = articles.map(a => a.parentId).filter((id): id is string => !!id);
  const parents = parentIds.length > 0
    ? await db.select({ id: contentPieces.id, episodeNumber: contentPieces.episodeNumber, title: contentPieces.title })
        .from(contentPieces)
        .where(inArray(contentPieces.id, parentIds))
    : [];
  const parentMap = Object.fromEntries(parents.map(p => [p.id, p]));

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Artikel"
        subtitle={`Blog · Show Notes · ${articles.length} Einträge`}
        actions={
          <Link href="/episodes/new?type=article">
            <Button size="sm">+ Neuer Artikel</Button>
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="cms-card text-center py-16">
          <p className="text-4xl mb-3" style={{ color: "var(--gold)" }}>✦</p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Artikel angelegt.
          </p>
          <Link href="/episodes/new?type=article" className="inline-block mt-4">
            <Button size="sm">Ersten Artikel anlegen</Button>
          </Link>
        </div>
      ) : (
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
              {articles.map(a => {
                const parent = a.parentId ? parentMap[a.parentId] : null;
                const episodeLabel = parent?.episodeNumber
                  ? `Ep.${parent.episodeNumber}`
                  : a.episodeNumber
                    ? `Ep.${a.episodeNumber}`
                    : "—";
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/episodes/${a.id}`} className="hover:underline" style={{ color: "var(--navy)" }}>
                        {a.title}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{episodeLabel}</td>
                    <td><Badge status={a.status as "draft" | "scheduled" | "published"} /></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {a.uploadDate
                        ? new Date(a.uploadDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "—"}
                    </td>
                    <td><Link href={`/episodes/${a.id}`} style={{ color: "var(--gold)" }}>↗</Link></td>
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
