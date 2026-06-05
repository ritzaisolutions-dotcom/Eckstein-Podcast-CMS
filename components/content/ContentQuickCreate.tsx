"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPlatformsForType,
  isContentType,
  PLATFORM_PLACEHOLDER_URL,
  type ContentType,
} from "@/lib/platforms";

const TYPE_OPTIONS: { value: ContentType; label: string; hint: string }[] = [
  { value: "lfc", label: "LFC", hint: "Long-Form Episode" },
  { value: "sfc", label: "SFC", hint: "Short / Clip" },
  { value: "article", label: "Artikel", hint: "Newsletter & Fundament" },
  { value: "social_post", label: "Post", hint: "Social Media" },
];

function resolveType(value: string | undefined): ContentType {
  if (value && isContentType(value)) return value;
  return "lfc";
}

interface ContentQuickCreateProps {
  defaultType?: string;
  backHref?: string;
}

export default function ContentQuickCreate({ defaultType, backHref = "/content" }: ContentQuickCreateProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [contentType, setContentType] = useState<ContentType>(() => resolveType(defaultType));
  const [title, setTitle] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const primaryPlatform = getPlatformsForType(contentType)[0];

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    setPlatformUrl("");
  }, [contentType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");

    const platformLinks =
      platformUrl.trim() && primaryPlatform
        ? [{ slug: primaryPlatform.slug, url: platformUrl.trim(), externalId: "", scheduledAt: "" }]
        : [];

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          title: title.trim(),
          platformLinks,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erstellen fehlgeschlagen");
      }
      const { id } = await res.json();
      router.push(`/content/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(5,16,31,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="cms-glass-strong w-full max-w-md h-full overflow-y-auto flex flex-col border-l"
        style={{ borderColor: "var(--glass-border-subtle)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--glass-border-subtle)" }}>
          <div>
            <h2 className="text-lg tracking-tight" style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)" }}>
              Neuer Content
            </h2>
            <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-on-glass-muted)", fontStyle: "italic" }}>
              Titel reicht — Rest später
            </p>
          </div>
          <Link
            href={backHref}
            className="text-xs px-3 py-1.5 rounded border"
            style={{ borderColor: "var(--glass-border-subtle)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)" }}
          >
            ✕
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 flex-1">
          <div>
            <label className="cms-label">Typ</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setContentType(opt.value)}
                  className="text-xs px-3 py-2 rounded border transition-colors text-left"
                  style={{
                    borderColor: contentType === opt.value ? "var(--gold)" : "var(--glass-border-subtle)",
                    background: contentType === opt.value ? "rgba(201,168,76,0.15)" : "transparent",
                    color: contentType === opt.value ? "var(--cream)" : "var(--text-on-glass-muted)",
                    fontFamily: "var(--font-cinzel)",
                    letterSpacing: "0.06em",
                  }}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block mt-0.5 opacity-70" style={{ fontFamily: "var(--font-eb-garamond)", fontSize: "0.65rem", letterSpacing: 0 }}>
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="cms-label" htmlFor="quick-title">
              Titel *
            </label>
            <input
              id="quick-title"
              ref={titleRef}
              type="text"
              required
              className="cms-input mt-1"
              placeholder="Worum geht es?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {primaryPlatform && (
            <div>
              <label className="cms-label" htmlFor="quick-url">
                {primaryPlatform.label}-Link <span style={{ opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                id="quick-url"
                type="url"
                className="cms-input mt-1"
                placeholder={PLATFORM_PLACEHOLDER_URL[primaryPlatform.slug] ?? "https://..."}
                value={platformUrl}
                onChange={e => setPlatformUrl(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-sm px-3 py-2 rounded" style={{ background: "rgba(192,57,43,0.12)", color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
              {error}
            </p>
          )}

          <div className="mt-auto pt-4 flex gap-3">
            <Link
              href={backHref}
              className="text-xs px-4 py-2.5 rounded border flex-1 text-center"
              style={{ borderColor: "var(--glass-border-subtle)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)" }}
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="text-xs px-4 py-2.5 rounded flex-1 disabled:opacity-50"
              style={{ background: "rgba(201,168,76,0.25)", color: "var(--cream)", fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}
            >
              {saving ? "Erstelle…" : "Anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
