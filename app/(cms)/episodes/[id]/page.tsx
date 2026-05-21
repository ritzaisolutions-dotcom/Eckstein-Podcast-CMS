import Link from "next/link";
import Button from "@/components/ui/Button";
import EpisodeForm from "@/components/EpisodeForm";
import DeleteContentButton from "@/components/DeleteContentButton";
import { getDb } from "@/lib/db";
import { contentPieces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [piece] = await db
    .select({ title: contentPieces.title })
    .from(contentPieces)
    .where(eq(contentPieces.id, id))
    .limit(1);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
            Content bearbeiten
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {piece && <DeleteContentButton id={id} title={piece.title} />}
          <Link href="/content">
            <Button variant="ghost" size="sm">← Zurück</Button>
          </Link>
        </div>
      </div>
      <EpisodeForm episodeId={id} />
    </div>
  );
}
