import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EpisodeForm from "@/components/EpisodeForm";

export default function NewEpisodePage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <PageHeader
        title="Neue Episode"
        actions={
          <Link href="/episodes">
            <Button variant="ghost" size="sm">← Zurück</Button>
          </Link>
        }
      />
      <EpisodeForm />
    </div>
  );
}
