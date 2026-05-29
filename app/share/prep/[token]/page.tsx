export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { episodePreps, prepSections, prepShareLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function PrepSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();

  const [link] = await db.select().from(prepShareLinks).where(eq(prepShareLinks.token, token)).limit(1);
  if (!link) notFound();

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
        <div className="cms-card text-center max-w-md p-8">
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
            Dieser Share-Link ist abgelaufen.
          </p>
        </div>
      </div>
    );
  }

  const [prep] = await db.select().from(episodePreps).where(eq(episodePreps.id, link.prepId)).limit(1);
  if (!prep) notFound();

  const sections = await db.select().from(prepSections)
    .where(eq(prepSections.prepId, prep.id))
    .orderBy(prepSections.orderIndex);

  return (
    <div className="min-h-dvh px-4 py-10" style={{ background: "var(--cream)" }}>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-cinzel)", color: "var(--gold)" }}>
            Eckstein Podcast · Episode Prep
          </p>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
            {prep.episodeNumber ? (
              <span className="text-lg mr-2" style={{ color: "var(--text-muted)" }}>EP.{prep.episodeNumber}</span>
            ) : null}
            {prep.workingTitle}
          </h1>
          {prep.plannedDate && (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic" }}>
              Geplant: {new Date(prep.plannedDate).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            Nur-Lese-Ansicht · {link.expiresAt
              ? `Gültig bis ${new Date(link.expiresAt).toLocaleDateString("de-DE")}`
              : "Ohne Ablaufdatum"}
          </p>
        </header>

        <div className="space-y-6">
          {sections.map(section => (
            <section key={section.id} className="cms-card">
              <h2 className="text-sm uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
                {section.label}
              </h2>
              {section.bodyMd ? (
                <div
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-primary)" }}
                >
                  {section.bodyMd}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>
                  Noch leer
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
