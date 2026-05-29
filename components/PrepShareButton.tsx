"use client";

import { useState } from "react";
import Button from "./ui/Button";

interface PrepShareButtonProps {
  prepId: string;
}

export default function PrepShareButton({ prepId }: PrepShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createShareLink() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/prep/${prepId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 14 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Link konnte nicht erstellt werden");
      }
      const data = await res.json();
      setShareUrl(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" onClick={createShareLink} disabled={loading}>
        {loading ? "Erstellt…" : "Share-Link"}
      </Button>
      {shareUrl && (
        <div className="flex items-center gap-2 max-w-xs">
          <input
            readOnly
            value={shareUrl}
            className="cms-input text-xs py-1 px-2 flex-1 min-w-0"
            onFocus={e => e.target.select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className="text-xs px-2 py-1 rounded shrink-0"
            style={{ background: "var(--navy)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      )}
      {error && (
        <p className="text-xs" style={{ color: "#b54a4a" }}>{error}</p>
      )}
    </div>
  );
}
