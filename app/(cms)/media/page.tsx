export const dynamic = "force-dynamic";
import PageHeader from "@/components/ui/PageHeader";
import MediaUpload from "@/components/MediaUpload";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

function formatBytes(b: number | null) {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTags(raw: string | null): string[] {
  try {
    return JSON.parse(raw ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  const db = getDb();
  const assets = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt)).limit(200);

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Media Library"
        subtitle={`Vercel Blob · ${assets.length} Dateien`}
      />

      <MediaUpload />

      {assets.length === 0 ? (
        <div className="cms-card text-center py-12 mt-4">
          <p className="text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            Noch keine Medien hochgeladen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
          {assets.map(asset => {
            const tags = parseTags(asset.tags);
            const isImage = asset.mime.startsWith("image/");
            return (
              <a
                key={asset.id}
                href={asset.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cms-card p-2 flex flex-col gap-2 group cursor-pointer hover:border-gold transition-colors no-underline"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="aspect-square rounded overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.blobUrl} alt={asset.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: "var(--text-muted)" }}>
                      {asset.mime.includes("video") ? "▶" : asset.mime.includes("pdf") ? "📄" : "🎵"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs truncate" style={{ color: "var(--navy)", fontFamily: "var(--font-eb-garamond)" }}>
                    {asset.filename}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatBytes(asset.sizeBytes)}</p>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map(t => (
                      <span key={t} className="text-xs px-1 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
