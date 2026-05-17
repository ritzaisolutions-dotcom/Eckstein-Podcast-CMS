"use client";

import { useState } from "react";
import Button from "./ui/Button";

const PLATFORMS_LFC = [
  { slug: "youtube", label: "YouTube" },
  { slug: "rumble", label: "Rumble" },
  { slug: "spotify", label: "Spotify" },
];

interface EpisodeFormProps {
  episodeId?: string;
}

export default function EpisodeForm({ episodeId }: EpisodeFormProps) {
  const [status, setStatus] = useState("draft");
  const [hasPrayer, setHasPrayer] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    // TODO: call Server Action / API with form data
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Basic info */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Grunddaten</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Episode #</label>
            <input type="number" name="episodeNumber" min={1} className="cms-input" placeholder="13" />
          </div>
          <div>
            <label className="cms-label">Dauer</label>
            <input type="text" name="durationLabel" className="cms-input" placeholder="ca. 60 Min" />
          </div>
        </div>

        <div>
          <label className="cms-label">Titel</label>
          <input type="text" name="title" required className="cms-input" placeholder="Episodentitel..." />
        </div>

        <div>
          <label className="cms-label">Bio / Kurzbeschreibung</label>
          <textarea name="bio" rows={2} className="cms-input" style={{ resize: "vertical" }} placeholder="Kurze Beschreibung für Listings..." />
        </div>

        <div>
          <label className="cms-label">Show Notes (Markdown)</label>
          <textarea name="bodyMd" rows={8} className="cms-input" style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }} placeholder="# Show Notes&#10;&#10;..." />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasPrayer"
            name="hasPrayer"
            checked={hasPrayer}
            onChange={e => setHasPrayer(e.target.checked)}
            className="w-4 h-4 accent-[var(--gold)]"
          />
          <label htmlFor="hasPrayer" className="cms-label" style={{ margin: 0, cursor: "pointer" }}>
            Schlussgebet ✝
          </label>
        </div>
      </div>

      {/* Status & Datum */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Status & Veröffentlichung</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cms-label">Status</label>
            <select name="status" value={status} onChange={e => setStatus(e.target.value)} className="cms-input">
              <option value="draft">Entwurf</option>
              <option value="scheduled">Geplant</option>
              <option value="published">Live</option>
            </select>
          </div>
          <div>
            <label className="cms-label">Veröffentlichungsdatum</label>
            <input type="datetime-local" name="uploadDate" className="cms-input" />
          </div>
        </div>
      </div>

      {/* Platform links */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Plattform-Links</h2>
        {PLATFORMS_LFC.map(p => (
          <div key={p.slug}>
            <label className="cms-label">{p.label} URL</label>
            <input
              type="url"
              name={`platform_${p.slug}`}
              className="cms-input"
              placeholder={`https://${p.slug}.com/...`}
            />
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <div>
                <label className="cms-label">Video-ID ({p.label})</label>
                <input type="text" name={`external_id_${p.slug}`} className="cms-input" placeholder="abc123" />
              </div>
              <div>
                <label className="cms-label">Geplant am</label>
                <input type="datetime-local" name={`scheduled_at_${p.slug}`} className="cms-input" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Thumbnail */}
      <div className="cms-card flex flex-col gap-3">
        <h2 className="cms-card-title">Thumbnail</h2>
        <div
          className="border-2 border-dashed rounded flex items-center justify-center py-8 cursor-pointer transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-eb-garamond)" }}>
            Klicken oder ziehen zum Hochladen
          </span>
        </div>
        <input type="text" name="thumbnailUrl" className="cms-input" placeholder="Oder URL einfügen..." />
      </div>

      {/* Analytics (manual) */}
      <div className="cms-card flex flex-col gap-4">
        <h2 className="cms-card-title">Analytics (manuell)</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          YouTube + Instagram werden automatisch gezogen. Andere Plattformen hier eintragen.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Rumble Views", "Spotify Plays", "TikTok Views", "X Impressions"].map(field => (
            <div key={field}>
              <label className="cms-label">{field}</label>
              <input type="number" min={0} className="cms-input" placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" size="sm">Verwerfen</Button>
        <Button type="submit" disabled={saving} size="sm">
          {saving ? "Speichern..." : episodeId ? "Aktualisieren" : "Episode erstellen"}
        </Button>
      </div>
    </form>
  );
}
