import Link from "next/link";
import Button from "@/components/ui/Button";
import EpisodeForm from "@/components/EpisodeForm";

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--navy)" }}>
            Content bearbeiten
          </h1>
        </div>
        <Link href="/content">
          <Button variant="ghost" size="sm">← Zurück</Button>
        </Link>
      </div>
      <EpisodeForm episodeId={id} />
    </div>
  );
}
