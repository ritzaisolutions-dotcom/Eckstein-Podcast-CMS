"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPlatformsForType, PLATFORM_PLACEHOLDER_URL } from "@/lib/platforms";
import { platformDotState, type DotState } from "@/lib/content-hub";

export interface PlatformLinkState {
  slug: string;
  url: string;
  scheduledAt: string;
  postedAt: string | null;
}

interface PlatformDotRowProps {
  contentId: string;
  contentType: string;
  links: PlatformLinkState[];
}

function dotClass(state: DotState) {
  if (state === "live") return "cms-dot cms-dot-live";
  if (state === "scheduled") return "cms-dot cms-dot-scheduled";
  return "cms-dot cms-dot-off";
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export default function PlatformDotRow({ contentId, contentType, links: initialLinks }: PlatformDotRowProps) {
  const router = useRouter();
  const defs = getPlatformsForType(contentType);
  const [links, setLinks] = useState<Record<string, PlatformLinkState>>(() => {
    const map: Record<string, PlatformLinkState> = {};
    for (const def of defs) {
      const existing = initialLinks.find(l => l.slug === def.slug);
      map[def.slug] = existing ?? { slug: def.slug, url: "", scheduledAt: "", postedAt: null };
    }
    return map;
  });
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenSlug(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function patchLink(slug: string, patch: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/content/${contentId}/platforms/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Speichern fehlgeschlagen");
      }
      const data = await res.json();
      setLinks(prev => ({
        ...prev,
        [slug]: {
          slug,
          url: data.url ?? "",
          scheduledAt: data.scheduledAt ? toDatetimeLocal(data.scheduledAt) : "",
          postedAt: data.postedAt ?? null,
        },
      }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft(slug: string) {
    const link = links[slug];
    await patchLink(slug, {
      url: link.url,
      scheduledAt: link.scheduledAt || null,
    });
    setOpenSlug(null);
  }

  async function markLive(slug: string) {
    await patchLink(slug, { postedAt: "now" });
    setOpenSlug(null);
  }

  if (defs.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {defs.map(def => {
          const link = links[def.slug];
          const state = platformDotState({
            slug: def.slug,
            url: link.url || null,
            scheduledAt: link.scheduledAt ? new Date(link.scheduledAt) : null,
            postedAt: link.postedAt ? new Date(link.postedAt) : null,
          });
          const isOpen = openSlug === def.slug;

          return (
            <div key={def.slug} className="relative">
              <button
                type="button"
                onClick={() => setOpenSlug(isOpen ? null : def.slug)}
                className="flex items-center gap-2 px-2 py-1.5 rounded border transition-colors"
                style={{
                  borderColor: isOpen ? "var(--gold)" : "var(--glass-border-subtle)",
                  background: isOpen ? "rgba(201,168,76,0.1)" : "transparent",
                }}
              >
                <span className={dotClass(state)} />
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", color: "var(--text-on-glass-muted)", letterSpacing: "0.06em" }}>
                  {def.shortLabel}
                </span>
              </button>

              {isOpen && (
                <div
                  ref={popoverRef}
                  className="absolute left-0 top-full mt-2 z-20 cms-glass-strong p-3 rounded min-w-[260px] shadow-lg"
                  style={{ border: "1px solid var(--glass-border-subtle)" }}
                >
                  <p className="cms-glass-title mb-2">{def.label}</p>
                  <label className="cms-label">URL</label>
                  <input
                    type="url"
                    className="cms-input text-sm mb-2"
                    placeholder={PLATFORM_PLACEHOLDER_URL[def.slug] ?? "https://..."}
                    value={link.url}
                    onChange={e => setLinks(prev => ({ ...prev, [def.slug]: { ...prev[def.slug], url: e.target.value } }))}
                  />
                  <label className="cms-label">Geplant am</label>
                  <input
                    type="datetime-local"
                    step={60}
                    className="cms-input text-sm mb-3"
                    value={link.scheduledAt}
                    onChange={e => setLinks(prev => ({ ...prev, [def.slug]: { ...prev[def.slug], scheduledAt: e.target.value } }))}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveDraft(def.slug)}
                      className="text-xs px-3 py-1.5 rounded border"
                      style={{ borderColor: "var(--gold)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}
                    >
                      {saving ? "…" : "Speichern"}
                    </button>
                    {!link.postedAt && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => markLive(def.slug)}
                        className="text-xs px-3 py-1.5 rounded"
                        style={{ background: "rgba(76,175,125,0.2)", color: "#4caf7d", fontFamily: "var(--font-cinzel)" }}
                      >
                        Als live markieren
                      </button>
                    )}
                  </div>
                  {link.postedAt && (
                    <p className="text-xs mt-2" style={{ color: "#4caf7d", fontFamily: "var(--font-eb-garamond)" }}>
                      Live seit {new Date(link.postedAt).toLocaleString("de-DE")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
