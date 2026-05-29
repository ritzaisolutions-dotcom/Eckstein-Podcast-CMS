export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { episodePreps, prepSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PrepSectionEditor from "./PrepSectionEditor";
import PrepShareButton from "@/components/PrepShareButton";

const STATUS_OPTIONS = [
  { value: "sammeln",         label: "Sammeln" },
  { value: "strukturieren",   label: "Strukturieren" },
  { value: "ready_to_record", label: "Ready to Record" },
  { value: "recorded",        label: "Recorded" },
];

export default async function PrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const [prep] = await db.select().from(episodePreps).where(eq(episodePreps.id, id)).limit(1);
  if (!prep) notFound();

  const sections = await db.select().from(prepSections)
    .where(eq(prepSections.prepId, id))
    .orderBy(prepSections.orderIndex);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/prep" className="text-sm" style={{ color: "var(--text-muted)" }}>← Episode Prep</Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
            {prep.episodeNumber ? <span className="text-base mr-2" style={{ color: "var(--text-muted)" }}>EP.{prep.episodeNumber}</span> : null}
            {prep.workingTitle}
          </h1>
          {prep.plannedDate && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Geplant: {new Date(prep.plannedDate).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <PrepShareButton prepId={id} />
          {STATUS_OPTIONS.map(s => (
            <span key={s.value} className="text-xs px-2 py-0.5 rounded" style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              background: prep.status === s.value ? "var(--navy)" : "var(--cream-mid)",
              color: prep.status === s.value ? "var(--cream)" : "var(--text-muted)",
            }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <PrepSectionEditor prepId={id} initialSections={sections} />
    </div>
  );
}
