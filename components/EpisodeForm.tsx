"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import LfcPickerModal from "./LfcPickerModal";
import {
  getPlatformsForType,
  PLATFORM_PLACEHOLDER_URL,
  supportsAnalyticsExternalId,
} from "@/lib/platforms";
import { LIFECYCLE_OPTIONS } from "@/lib/lifecycle";
import { toDatetimeLocalValue } from "@/lib/datetime-local";

interface ParentLfc {
  id: string;
  title: string;
  episodeNumber: number | null;
  typeIndex: number | null;
}

const CONTENT_TYPE_OPTIONS = [
  { value: "lfc",         label: "LFC — Long Form Content" },
  { value: "sfc",         label: "SFC — Short Form Content" },
  { value: "article",     label: "Article — Das Fundament" },
  { value: "social_post", label: "Beitrag — Social Post" },
];

interface PlatformLink {
  slug: string;
  url: string;
  externalId: string;
  scheduledAt: string;
  postedAt: string | null;
}

interface EpisodeFormProps {
  episodeId?: string;
}

export default function EpisodeForm({ episodeId }: EpisodeFormProps) {
  const router = useRouter();

  const [contentType, setContentType] = useState("lfc");
  const [lifecycleStage, setLifecycleStage] = useState("draft");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [platformLinks, setPlatformLinks] = useState<Record<string, PlatformLink>>({});
  const [title, setTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [bio, setBio] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [filmingDate, setFilmingDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!episodeId);
  const [parentLfc, setParentLfc] = useState<ParentLfc | null>(null);
  const [showLfcPicker, setShowLfcPicker] = useState(false);

  const availablePlatforms = getPlatformsForType(contentType);
  const allowedSlugs = new Set(availablePlatforms.map(p => p.slug));
  const legacySelectedSlugs = Array.from(selectedPlatforms).filter(slug => !allowedSlugs.has(slug));

  // Load existing content when editing
  useEffect(() => {
    if (!episodeId) return;
    fetch(`/api/content/${episodeId}`)
      .then(r => r.json())
      .then(data => {
        setContentType(data.type ?? "lfc");
        setLifecycleStage(data.lifecycleStage ?? "draft");
        setTitle(data.title ?? "");
        setEpisodeNumber(data.episodeNumber ? String(data.episodeNumber) : "");
        setBio(data.bio ?? "");
        setBodyMd(data.bodyMd ?? "");
        setUploadDate(toDatetimeLocalValue(data.uploadDate));
        setFilmingDate(toDatetimeLocalValue(data.filmingDate));

        if (data.platformLinks?.length > 0) {
          const slugs = new Set<string>(data.platformLinks.map((l: PlatformLink) => l.slug));
          setSelectedPlatforms(slugs);
          const linksMap: Record<string, PlatformLink> = {};
          for (const l of data.platformLinks) {
            linksMap[l.slug] = {
              slug: l.slug,
              url: l.url ?? "",
              externalId: l.externalId ?? "",
              scheduledAt: l.scheduledAt ?? "",
              postedAt: l.postedAt ?? null,
            };
          }
          setPlatformLinks(linksMap);
        }

        if (data.parentId && data.type === "sfc") {
          fetch(`/api/content/${data.parentId}`)
            .then(r => r.json())
            .then(parent => setParentLfc({
              id: parent.id,
              title: parent.title,
              episodeNumber: parent.episodeNumber,
              typeIndex: parent.typeIndex,
            }))
            .catch(() => {});
        }
      })
      .catch(() => setError("Fehler beim Laden"))
      .finally(() => setLoading(false));
  }, [episodeId]);

  function togglePlatform(slug: string) {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
        if (!platformLinks[slug]) {
          setPlatformLinks(pl => ({ ...pl, [slug]: { slug, url: "", externalId: "", scheduledAt: "", postedAt: null } }));
        }
      }
      return next;
    });
  }

  function updatePlatformLink(slug: string, field: keyof PlatformLink, value: string) {
    setPlatformLinks(pl => ({ ...pl, [slug]: { ...pl[slug], [field]: value } }));
  }

  function handleTypeChange(t: string) {
    setContentType(t);
    setSelectedPlatforms(new Set());
    setPlatformLinks({});
    if (t === "sfc") {
      setParentLfc(null);
      setShowLfcPicker(true);
    } else {
      setParentLfc(null);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const allowed = new Set(getPlatformsForType(contentType).map(p => p.slug));
    const links = Array.from(selectedPlatforms)
      .filter(slug => allowed.has(slug))
      .map(slug => {
        const link = platformLinks[slug] ?? { slug, url: "", externalId: "", scheduledAt: "", postedAt: null };
        return {
          slug,
          url: link.url,
          externalId: link.externalId,
          scheduledAt: link.scheduledAt,
          postedAt: link.postedAt,
        };
      });

    const payload = {
      type: contentType,
      title,
      bio: bio || null,
      bodyMd: bodyMd || null,
      episodeNumber: episodeNumber || null,
      lifecycleStage,
      uploadDate: uploadDate || null,
      filmingDate: filmingDate || null,
      parentId: contentType === "sfc" ? (parentLfc?.id ?? null) : null,
      platformLinks: links,
    };

    try {
      const url = episodeId ? `/api/content/${episodeId}` : "/api/content";
      const method = episodeId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Fehler beim Speichern");
        return;
      }

      await res.json();
      router.push(episodeId ? `/content/${episodeId}` : `/content?type=${contentType}`);
      router.refresh();
    } catch {
      setError("Netzwerkfehler — bitte erneut versuchen");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="cms-card py-8 text-center text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Lade...</div>;
  }

  return (
    <>
    {showLfcPicker && (
      <LfcPickerModal
        onSelect={lfc => { setParentLfc(lfc); setShowLfcPicker(false); }}
        onSkip={() => setShowLfcPicker(false)}
      />
    )}

    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {error && (
        <div className="px-4 py-3 rounded border text-sm" style={{ borderColor: "#c0392b", background: "rgba(192,57,43,0.06)", color: "#c0392b", fontFamily: "var(--font-eb-garamond)" }}>
          {error}
        </div>
      )}

      {/* Content Type + Lifecycle */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Art & Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Content-Typ</label>
            <select className="cms-input" value={contentType} onChange={e => handleTypeChange(e.target.value)}>
              {CONTENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="cms-label">Status</label>
            <div className="flex gap-1.5 flex-wrap pt-1">
              {LIFECYCLE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setLifecycleStage(o.value)}
                  className="text-xs px-3 py-1.5 rounded border transition-colors"
                  style={{
                    borderColor: lifecycleStage === o.value ? "var(--gold)" : "var(--glass-border-subtle)",
                    background: lifecycleStage === o.value ? "rgba(201,168,76,0.18)" : "transparent",
                    color: lifecycleStage === o.value ? "var(--cream)" : "var(--text-on-glass-muted)",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LFC Parent Link (only for SFC) */}
      {contentType === "sfc" && (
        <div className="cms-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="cms-card-title">Verknüpfte LFC-Episode</h2>
            <button
              type="button"
              onClick={() => setShowLfcPicker(true)}
              className="text-xs px-3 py-1 rounded border transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.07em",
                fontSize: "0.6rem",
              }}
            >
              {parentLfc ? "Ändern" : "Verknüpfen"}
            </button>
          </div>

          {parentLfc ? (
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded border"
              style={{ borderColor: "var(--gold)", background: "rgba(201,168,76,0.08)" }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs" style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.07em" }}>
                  LFC
                </span>
                {parentLfc.episodeNumber && (
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem" }}>
                    #{parentLfc.episodeNumber}
                  </span>
                )}
                <span className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-eb-garamond)" }}>
                  {parentLfc.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setParentLfc(null)}
                className="ml-3 text-xs shrink-0"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel)" }}
                title="Verknüpfung entfernen"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
              Kein LFC verknüpft — dieser Short steht eigenständig.
            </p>
          )}
        </div>
      )}

      {/* Basic info */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Grunddaten</h2>

        {(contentType === "lfc" || contentType === "sfc") && (
          <div>
            <label className="cms-label">Episode #</label>
            <input
              type="number"
              min={1}
              className="cms-input"
              placeholder="13"
              value={episodeNumber}
              onChange={e => setEpisodeNumber(e.target.value)}
              style={{ maxWidth: 120 }}
            />
          </div>
        )}

        <div>
          <label className="cms-label">Titel *</label>
          <input
            type="text"
            required
            className="cms-input"
            placeholder="Titel..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="cms-label">Kurzbeschreibung</label>
          <textarea
            rows={2}
            className="cms-input"
            style={{ resize: "vertical" }}
            placeholder="Kurze Beschreibung für Listings..."
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        </div>

        <div>
          <label className="cms-label">Show Notes / Body (Markdown)</label>
          <textarea
            rows={6}
            className="cms-input"
            style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
            placeholder={"# Show Notes\n\n..."}
            value={bodyMd}
            onChange={e => setBodyMd(e.target.value)}
          />
        </div>
      </div>

      {/* Datum */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Termine</h2>
        <div>
          <label className="cms-label">Drehtermin</label>
          <input
            type="datetime-local"
            value={filmingDate}
            onChange={e => setFilmingDate(e.target.value)}
            className="cms-input"
            step="60"
          />
        </div>
        <div>
          <label className="cms-label">Veröffentlichung</label>
          <input
            type="datetime-local"
            value={uploadDate}
            onChange={e => setUploadDate(e.target.value)}
            className="cms-input"
            step="60"
          />
          {uploadDate && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {new Date(uploadDate).toLocaleString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* Platform Tags */}
      <div className="cms-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="cms-card-title">Plattformen</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Klicken zum Hinzufügen</span>
        </div>

        {availablePlatforms.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Keine Plattformen für diesen Content-Typ.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map(p => {
                const active = selectedPlatforms.has(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => togglePlatform(p.slug)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      borderColor: active ? p.color : "var(--border)",
                      background: active ? p.bg : "transparent",
                      color: active ? p.color : "var(--text-muted)",
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.07em",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {active ? "✓ " : ""}{p.label}
                  </button>
                );
              })}
            </div>

            {selectedPlatforms.size > 0 && (
              <div className="flex flex-col gap-4 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                {availablePlatforms
                  .filter(p => selectedPlatforms.has(p.slug))
                  .map(p => {
                    const link = platformLinks[p.slug] ?? { url: "", externalId: "", scheduledAt: "", postedAt: null };
                    return (
                      <div key={p.slug}>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: p.bg, color: p.color, fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.07em" }}
                          >
                            {p.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="md:col-span-2">
                            <label className="cms-label">Link</label>
                            <input
                              type="url"
                              className="cms-input"
                              placeholder={PLATFORM_PLACEHOLDER_URL[p.slug] ?? "https://..."}
                              value={link.url}
                              onChange={e => updatePlatformLink(p.slug, "url", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="cms-label">Geplant am</label>
                            <input
                              type="datetime-local"
                              step="60"
                              className="cms-input"
                              value={link.scheduledAt}
                              onChange={e => updatePlatformLink(p.slug, "scheduledAt", e.target.value)}
                            />
                          </div>
                        </div>
                        {supportsAnalyticsExternalId(p.slug) && (
                          <div className="mt-2">
                            <label className="cms-label">Video/Post-ID (für Analytics-Pull)</label>
                            <input
                              type="text"
                              className="cms-input"
                              placeholder="abc123xyz"
                              value={link.externalId}
                              onChange={e => updatePlatformLink(p.slug, "externalId", e.target.value)}
                              style={{ maxWidth: 240 }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {legacySelectedSlugs.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-eb-garamond)" }}>
                  Legacy-Plattformen (nur lesbar — beim Speichern entfernt)
                </p>
                {legacySelectedSlugs.map(slug => {
                  const link = platformLinks[slug];
                  return (
                    <div key={slug} className="text-xs px-3 py-2 rounded border opacity-70" style={{ borderColor: "var(--border)", fontFamily: "var(--font-eb-garamond)" }}>
                      <span className="cms-label">{slug}</span>
                      {link?.url && <span className="block truncate mt-1">{link.url}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Verwerfen
        </Button>
        <Button type="submit" disabled={saving} size="sm">
          {saving ? "Speichern..." : episodeId ? "Aktualisieren" : "Content erstellen"}
        </Button>
      </div>
    </form>
    </>
  );
}
