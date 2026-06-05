export const dynamic = "force-dynamic";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { guests, contentPieces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const [guest] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  if (!guest) notFound();

  const episodes = await db.select({ id: contentPieces.id, title: contentPieces.title, episodeNumber: contentPieces.episodeNumber, uploadDate: contentPieces.uploadDate })
    .from(contentPieces)
    .where(eq(contentPieces.guestId, id));

  const topics: string[] = (() => { try { return JSON.parse(guest.topics ?? "[]"); } catch { return []; } })();
  const socials: Record<string, string> = (() => { try { return JSON.parse(guest.socials ?? "{}"); } catch { return {}; } })();

  const STATUS_LABELS: Record<string, string> = { angefragt: "Angefragt", zugesagt: "Zugesagt", aufgenommen: "Aufgenommen", mehrfach: "Mehrfach" };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/guests" className="text-sm" style={{ color: "var(--text-muted)" }}>← Gäste</Link>
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>{guest.name}</h1>
        <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: "var(--cream-mid)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem" }}>
          {STATUS_LABELS[guest.status] ?? guest.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Bio + Socials */}
        <div className="cms-card">
          <h2 className="cms-card-title mb-3">Profil</h2>
          {guest.bioMd && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-eb-garamond)" }}>{guest.bioMd}</p>}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {topics.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--cream-mid)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{t}</span>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {socials.instagram && <a href={`https://instagram.com/${socials.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--gold)" }}>Instagram {socials.instagram} ↗</a>}
            {socials.x && <a href={`https://x.com/${socials.x.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--gold)" }}>X {socials.x} ↗</a>}
            {socials.website && <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--gold)" }}>Website ↗</a>}
          </div>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <Link href={`/guests/${id}/edit`} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-cinzel)" }}>
              Bearbeiten
            </Link>
          </div>
        </div>

        {/* Episodes */}
        <div className="cms-card">
          <h2 className="cms-card-title mb-3">Episoden ({episodes.length})</h2>
          {episodes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Noch keine Episoden verknüpft.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {episodes.map(ep => (
                <li key={ep.id}>
                  <Link href={`/content/${ep.id}`} className="text-sm hover:underline" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                    {ep.episodeNumber ? <span className="text-xs mr-1" style={{ color: "var(--text-muted)" }}>#{ep.episodeNumber}</span> : null}
                    {ep.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
