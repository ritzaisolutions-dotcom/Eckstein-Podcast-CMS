export const dynamic = "force-dynamic";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EpisodeForm from "@/components/EpisodeForm";

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch episode from D1 when bindings are live
  // const db = getDb();
  // const episode = await db.query.contentPieces.findFirst({ where: eq(contentPieces.id, id) });

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Episode bearbeiten`}
        subtitle={`ID: ${id}`}
        actions={
          <Link href="/episodes">
            <Button variant="ghost" size="sm">← Zurück</Button>
          </Link>
        }
      />
      <EpisodeForm episodeId={id} />
    </div>
  );
}
