export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Button from "@/components/ui/Button";
import EpisodeForm from "@/components/EpisodeForm";
import DeleteContentButton from "@/components/DeleteContentButton";
import { getDb } from "@/lib/db";
import { contentPieces } from "@/lib/db/schema";

export default async function ContentAdvancedEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const backHref = returnTo?.startsWith("/content") ? returnTo : `/content/${id}`;
  const db = getDb();
  const [piece] = await db
    .select({ title: contentPieces.title })
    .from(contentPieces)
    .where(eq(contentPieces.id, id))
    .limit(1);

  if (!piece) notFound();

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)" }}>
            Erweiterter Editor
          </h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
            SFC-LFC, Analytics-IDs, alle Plattform-Felder
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteContentButton id={id} title={piece.title} />
          <Link href={backHref}>
            <Button variant="ghost" size="sm">← Zurück</Button>
          </Link>
        </div>
      </div>
      <EpisodeForm episodeId={id} />
    </div>
  );
}
