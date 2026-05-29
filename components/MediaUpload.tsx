"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

export default function MediaUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload fehlgeschlagen");
      }
      const uploaded = await uploadRes.json();

      const registerRes = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploaded.filename ?? file.name,
          blobUrl: uploaded.url,
          mime: uploaded.mime ?? file.type,
          sizeBytes: uploaded.sizeBytes ?? file.size,
          tags: [],
        }),
      });
      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Speichern fehlgeschlagen");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    void uploadFile(files[0]);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf"
        onChange={e => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        className="mb-5 border-2 border-dashed rounded flex items-center justify-center py-10 cursor-pointer transition-colors"
        style={{ borderColor: uploading ? "var(--gold)" : "var(--border)", opacity: uploading ? 0.7 : 1 }}
      >
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ color: "var(--gold)" }}>◫</div>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>
            {uploading ? "Wird hochgeladen…" : "Dateien hierher ziehen oder klicken"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PNG, JPG, MP4, PDF, MP3 — max. 500MB</p>
        </div>
      </div>
      {error && (
        <p className="text-sm mb-4" style={{ color: "#b54a4a", fontFamily: "var(--font-eb-garamond)" }}>{error}</p>
      )}
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? "Lädt…" : "↑ Hochladen"}
      </Button>
    </div>
  );
}
