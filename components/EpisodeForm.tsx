"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

// ─── Platform definitions per content type ────────────────────────────────────

const PLATFORMS_BY_TYPE: Record<string, { slug: string; label: string; color: string; bg: string }[]> = {
  lfc: [
    { slug: "youtube",  label: "YouTube",  color: "#c9a84c", bg: "rgba(201,168,76,0.15)" },
    { slug: "rumble",   label: "Rumble",   color: "#05101f", bg: "rgba(12,30,53,0.08)" },
    { slug: "spotify",  label: "Spotify",  color: "#4caf7d", bg: "rgba(76,175,125,0.12)" },
  ],
  sfc: [
    { slug: "yt_shorts",  label: "YT Shorts",  color: "#c9a84c", bg: "rgba(201,168,76,0.15)" },
    { slug: "ig_reels",   label: "IG Reels",   color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
    { slug: "tiktok",     label: "TikTok",     color: "#05101f", bg: "rgba(12,30,53,0.08)" },
    { slug: "rumble",     label: "Rumble",     color: "#05101f", bg: "rgba(12,30,53,0.08)" },
  ],
  article: [
    { slug: "substack", label: "Substack", color: "#c9a84c", bg: "rgba(201,168,76,0.12)" },
    { slug: "x",        label: "X",        color: "#05101f", bg: "rgba(12,30,53,0.08)" },
    { slug: "website",  label: "Website",  color: "#05101f", bg: "rgba(12,30,53,0.06)" },
  ],
  social_post: [
    { slug: "instagram", label: "Instagram", color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
    { slug: "x",         label: "X",         color: "#05101f", bg: "rgba(12,30,53,0.08)" },
    { slug: "tiktok",    label: "TikTok",    color: "#05101f", bg: "rgba(12,30,53,0.08)" },
  ],
};

const PLACEHOLDER_URL: Record<string, string> = {
  youtube:   "https://youtu.be/...",
  yt_shorts: "https://youtube.com/shorts/...",
  rumble:    "https://rumble.com/v...",
  spotify:   "https://open.spotify.com/episode/...",
  ig_reels:  "https://www.instagram.com/reel/...",
  instagram: "https://www.instagram.com/p/...",
  tiktok:    "https://www.tiktok.com/@eckstein_podcast/video/...",
  substack:  "https://eckstein.substack.com/p/...",
  x:         "https://x.com/EcksteinPodcast/status/...",
  website:   "https://eckstein-podcast.de/...",
};

const CONTENT_TYPE_OPTIONS = [
  { value: "lfc",         label: "LFC — Long Form Content" },
  { value: "sfc",         label: "SFC — Short Form Content" },
  { value: "article",     label: "Article — Das Fundament" },
  { value: "social_post", label: "Beitrag — Social Post" },
];

const LIFECYCLE_OPTIONS = [
  { value: "draft",     label: "Draft" },
  { value: "scripting", label: "Scripting" },
  { value: "filming",   label: "Filming" },
  { value: "editing",   label: "Editing" },
  { value: "revision",  label: "Revision" },
  { value: "live",      label: "Live" },
];

interface PlatformLink {
  slug: string;
  url: string;
  externalId: string;
  scheduledAt: string;
}

interface EpisodeFormProps {
  episodeId?: string;
}

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!episodeId);

  const availablePlatforms = PLATFORMS_BY_TYPE[contentType] ?? [];

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
        setUploadDate(toDatetimeLocal(data.uploadDate));


        if (data.platformLinks?.length > 0) {
          const slugs = new Set<string>(data.platformLinks.map((l: PlatformLink) => l.slug));
          setSelectedPlatforms(slugs);
          const linksMap: Record<string, PlatformLink> = {};
          for (const l of data.platformLinks) linksMap[l.slug] = l;
          setPlatformLinks(linksMap);
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
          setPlatformLinks(pl => ({ ...pl, [slug]: { slug, url: "", externalId: "", scheduledAt: "" } }));
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
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const links = Array.from(selectedPlatforms).map(slug => platformLinks[slug] ?? { slug, url: "", externalId: "", scheduledAt: "" });

    const payload = {
      type: contentType,
      title,
      bio: bio || null,
      bodyMd: bodyMd || null,
      episodeNumber: episodeNumber || null,
      lifecycleStage,
      uploadDate: uploadDate || null,
      filmingDate: null,
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

      const data = await res.json();
      router.push(`/content/${episodeId ?? data.id}`);
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
                    borderColor: lifecycleStage === o.value ? "var(--navy)" : "var(--border)",
                    background: lifecycleStage === o.value ? "var(--navy)" : "transparent",
                    color: lifecycleStage === o.value ? "var(--cream)" : "var(--text-secondary)",
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
        <h2 className="cms-card-title">Veröffentlichung</h2>
        <div>
          <label className="cms-label">Datum & Uhrzeit</label>
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
                    const link = platformLinks[p.slug] ?? { url: "", externalId: "", scheduledAt: "" };
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
                              placeholder={PLACEHOLDER_URL[p.slug] ?? "https://..."}
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
                        {(p.slug === "youtube" || p.slug === "yt_shorts" || p.slug === "ig_reels" || p.slug === "instagram") && (
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
  );
}
