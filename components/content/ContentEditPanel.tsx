"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LifecycleStepper from "./LifecycleStepper";
import PlatformDotRow, { type PlatformLinkState } from "./PlatformDotRow";
import Badge from "@/components/ui/Badge";
import { TYPE_LABELS } from "@/lib/content-hub";
import { toDatetimeLocalValue } from "@/lib/datetime-local";

export interface ContentEditData {
  id: string;
  type: string;
  title: string;
  bio: string | null;
  bodyMd: string | null;
  episodeNumber: number | null;
  lifecycleStage: string;
  status: string;
  filmingDate: string | null;
  uploadDate: string | null;
  platformLinks: PlatformLinkState[];
}

type Tab = "status" | "details" | "content";

export default function ContentEditPanel({
  data,
  hubBackHref = "/content",
}: {
  data: ContentEditData;
  hubBackHref?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("status");
  const [lifecycleStage, setLifecycleStage] = useState(data.lifecycleStage);
  const [episodeNumber, setEpisodeNumber] = useState(data.episodeNumber != null ? String(data.episodeNumber) : "");
  const [filmingDate, setFilmingDate] = useState(toDatetimeLocalValue(data.filmingDate));
  const [uploadDate, setUploadDate] = useState(toDatetimeLocalValue(data.uploadDate));
  const [title, setTitle] = useState(data.title);
  const [bio, setBio] = useState(data.bio ?? "");
  const [bodyMd, setBodyMd] = useState(data.bodyMd ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tabs: { id: Tab; label: string }[] = [
    { id: "status", label: "Status" },
    { id: "details", label: "Details" },
    { id: "content", label: "Inhalt" },
  ];

  async function saveDetails() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/content/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeNumber: episodeNumber || null,
          filmingDate: filmingDate || null,
          uploadDate: uploadDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Speichern fehlgeschlagen");
      }
      setSuccess("Gespeichert");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/content/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          bio: bio || null,
          bodyMd: bodyMd || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Speichern fehlgeschlagen");
      }
      setSuccess("Gespeichert");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" key={data.id}>
      <div className="cms-glass-strong p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(201,168,76,0.12)", color: "var(--gold-pale)", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem" }}>
                {TYPE_LABELS[data.type] ?? data.type}
              </span>
              <Badge status={data.status as "draft" | "scheduled" | "published"} />
            </div>
            <h2 className="text-lg" style={{ fontFamily: "var(--font-cinzel)", color: "var(--cream)" }}>
              {data.title}
            </h2>
          </div>
          <Link href={hubBackHref} className="text-xs" style={{ color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)" }}>
            ← Hub
          </Link>
        </div>

        <div className="flex gap-1 border-b mb-4" style={{ borderColor: "var(--glass-border-subtle)" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="text-xs px-4 py-2 -mb-px border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.id ? "var(--gold)" : "transparent",
                color: tab === t.id ? "var(--cream)" : "var(--text-on-glass-muted)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.06em",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "status" && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="cms-label mb-2">Lifecycle</p>
              <LifecycleStepper
                contentId={data.id}
                initialStage={lifecycleStage}
                onStageChange={setLifecycleStage}
              />
            </div>
            <div>
              <p className="cms-label mb-2">Plattformen</p>
              <PlatformDotRow contentId={data.id} contentType={data.type} links={data.platformLinks} />
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="flex flex-col gap-4 max-w-md">
            {(data.type === "lfc" || data.type === "sfc") && (
              <div>
                <label className="cms-label">Episode #</label>
                <input
                  type="number"
                  min={1}
                  className="cms-input"
                  value={episodeNumber}
                  onChange={e => setEpisodeNumber(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="cms-label">Drehtermin</label>
              <input
                type="datetime-local"
                step={60}
                className="cms-input"
                value={filmingDate}
                onChange={e => setFilmingDate(e.target.value)}
              />
            </div>
            <div>
              <label className="cms-label">Veröffentlichung</label>
              <input
                type="datetime-local"
                step={60}
                className="cms-input"
                value={uploadDate}
                onChange={e => setUploadDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={saveDetails}
              className="text-xs px-4 py-2 rounded self-start"
              style={{ background: "rgba(201,168,76,0.2)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}
            >
              {saving ? "Speichern…" : "Details speichern"}
            </button>
          </div>
        )}

        {tab === "content" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="cms-label">Titel</label>
              <input type="text" className="cms-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="cms-label">Kurzbeschreibung</label>
              <textarea rows={2} className="cms-input" value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div>
              <label className="cms-label">Body (Markdown)</label>
              <textarea rows={8} className="cms-input font-mono text-sm" value={bodyMd} onChange={e => setBodyMd(e.target.value)} />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                disabled={saving}
                onClick={saveContent}
                className="text-xs px-4 py-2 rounded"
                style={{ background: "rgba(201,168,76,0.2)", color: "var(--cream)", fontFamily: "var(--font-cinzel)" }}
              >
                {saving ? "Speichern…" : "Inhalt speichern"}
              </button>
              <Link
                href={`/content/${data.id}/advanced${hubBackHref !== "/content" ? `?returnTo=${encodeURIComponent(hubBackHref)}` : ""}`}
                className="text-xs px-4 py-2 rounded border self-center"
                style={{ borderColor: "var(--glass-border-subtle)", color: "var(--text-on-glass-muted)", fontFamily: "var(--font-cinzel)" }}
                title="SFC-LFC-Verknüpfung, Analytics-IDs, alle Plattformen"
              >
                Erweiterter Editor
              </Link>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs mt-3" style={{ color: "#e57373", fontFamily: "var(--font-eb-garamond)" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs mt-3" style={{ color: "#4caf7d", fontFamily: "var(--font-eb-garamond)" }}>
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
