import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Image from "next/image";

const MOCK = [
  { id: "1", filename: "ep12-thumbnail.png", mime: "image/png", sizeBytes: 248_000, blobUrl: "/brand/logo-master-navy.png", tags: ["thumbnail", "ep12"], uploadedAt: "2026-05-10" },
  { id: "2", filename: "eckstein-logo-master.png", mime: "image/png", sizeBytes: 180_000, blobUrl: "/brand/logo-master-navy.png", tags: ["logo", "brand"], uploadedAt: "2026-01-01" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="Media Library"
        subtitle="R2 Storage"
        actions={
          <Button size="sm">↑ Hochladen</Button>
        }
      />

      {/* Upload zone */}
      <div
        className="mb-5 border-2 border-dashed rounded flex items-center justify-center py-10 cursor-pointer transition-colors"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ color: "var(--gold)" }}>◫</div>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>
            Dateien hierher ziehen oder klicken
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PNG, JPG, MP4, PDF, MP3 — max. 500MB</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {MOCK.map(asset => (
          <div key={asset.id} className="cms-card p-2 flex flex-col gap-2 group cursor-pointer hover:border-gold transition-colors" style={{ borderColor: "var(--border)" }}>
            <div className="aspect-square rounded overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
              {asset.mime.startsWith("image/") ? (
                <Image src={asset.blobUrl} alt={asset.filename} width={200} height={200} className="w-full h-full object-cover" />
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
            <div className="flex flex-wrap gap-1">
              {asset.tags.map(t => (
                <span key={t} className="text-xs px-1 rounded" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
