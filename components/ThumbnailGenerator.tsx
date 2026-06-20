"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import PageHeader from "@/components/ui/PageHeader";

/* ── Types ──────────────────────────────────────────────────── */
interface ThumbnailState {
  episode:      string;
  headline:     string;
  keyword:      string;
  subline:      string;
  photoUrl:     string | null;
  brightness:   number;   // 20–110
  saturation:   number;   // 0–150
  gradientDepth: number;  // 20–80  (% from top where dark starts)
}

const PRESETS: Array<{ label: string; values: Partial<ThumbnailState> }> = [
  { label: "Disziplin",  values: { headline: "Disziplin wird",        keyword: "Einfach.",   subline: "Wenn du Gottes Wort gehorchst." } },
  { label: "Gehorsam",   values: { headline: "Gehorsam ist",          keyword: "Stärke.",    subline: "Warum der Kampf gegen dich selbst aufhört." } },
  { label: "Scheiterst", values: { headline: "Warum du immer wieder", keyword: "scheiterst.", subline: "Ungehorsam · Hürden · Wachstum" } },
  { label: "Versagt",    values: { headline: "Wir haben",             keyword: "versagt.",   subline: "Ehrlich. Direkt. Keine Ausreden." } },
];

const DEFAULT: ThumbnailState = {
  episode: "4",
  headline: "Disziplin wird",
  keyword:  "Einfach.",
  subline:  "Wenn du Gottes Wort gehorchst.",
  photoUrl: null,
  brightness:    95,
  saturation:    85,
  gradientDepth: 52,
};

const LOGO_SRC = "/brand/logo.png";
const FONT_CINZEL = "Cinzel, serif";
const FONT_CORMORANT = "Cormorant Garamond, serif";
const FONT_EB = "EB Garamond, serif";

async function preloadImage(src: string): Promise<void> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  }
}

async function dataUrlTo1280x720Blob(dataUrl: string): Promise<Blob> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, 1280, 720);
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png");
  });
}

async function captureThumbnail(el: HTMLElement, photoUrl: string | null): Promise<Blob> {
  await document.fonts.ready;
  const loads = [preloadImage(LOGO_SRC)];
  if (photoUrl) loads.push(preloadImage(photoUrl));
  await Promise.all(loads);

  const prevTransform = el.style.transform;
  el.style.transform = "none";
  try {
    const dataUrl = await toPng(el, {
      width: 1280,
      height: 720,
      pixelRatio: 2,
      cacheBust: true,
    });
    return dataUrlTo1280x720Blob(dataUrl);
  } finally {
    el.style.transform = prevTransform;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ──────────────────────────────────────────────── */
export default function ThumbnailGenerator() {
  const [s, setS]           = useState<ThumbnailState>(DEFAULT);
  const [exporting, setExp] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [scale, setScale]   = useState(0.5);

  const wrapRef     = useRef<HTMLDivElement>(null);   // outer 16:9 container
  const thumbRef    = useRef<HTMLDivElement>(null);   // actual 1280×720 element
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Responsive scale */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1280));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const patch = useCallback((p: Partial<ThumbnailState>) => setS(prev => ({ ...prev, ...p })), []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    patch({ photoUrl: URL.createObjectURL(file) });
  }

  /* Export: fonts + images preloaded, 2× raster then downscale to 1280×720 */
  async function handleDownload() {
    const el = thumbRef.current;
    if (!el) return;
    setExp(true);
    setExportFeedback(null);
    try {
      const blob = await captureThumbnail(el, s.photoUrl);
      downloadBlob(blob, `Eckstein_Ep${s.episode}_Thumbnail.png`);
    } catch {
      setExportFeedback("Export fehlgeschlagen");
    } finally {
      setExp(false);
    }
  }

  async function handleCopy() {
    const el = thumbRef.current;
    if (!el) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setExportFeedback("Clipboard nicht verfügbar");
      return;
    }
    setExp(true);
    setExportFeedback(null);
    try {
      const blob = await captureThumbnail(el, s.photoUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setExportFeedback("Kopiert ✓");
      setTimeout(() => setExportFeedback(null), 2500);
    } catch {
      setExportFeedback("Kopieren fehlgeschlagen");
    } finally {
      setExp(false);
    }
  }

  const exportActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <CmsBtn onClick={handleDownload} disabled={exporting}>
        {exporting ? "Exportiere …" : "Download PNG"}
      </CmsBtn>
      <CmsBtn onClick={handleCopy} disabled={exporting} variant="secondary">
        {exporting ? "…" : "In Zwischenablage"}
      </CmsBtn>
      {exportFeedback && (
        <span className="text-xs" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
          {exportFeedback}
        </span>
      )}
    </div>
  );

  /* Overlay gradient */
  const overlay = [
    `rgba(5,16,31,0) 0%`,
    `rgba(5,16,31,0) ${s.gradientDepth}%`,
    `rgba(5,16,31,0.75) ${Math.min(s.gradientDepth + 20, 90)}%`,
    `rgba(5,16,31,0.96) ${Math.min(s.gradientDepth + 36, 96)}%`,
    `rgba(5,16,31,1) 100%`,
  ].join(", ");

  return (
    <div className="px-4 md:px-6 py-6" style={{ maxWidth: 1400, margin: "0 auto" }}>

      <PageHeader
        title="Thumbnail Generator"
        subtitle={`Ep. ${s.episode} · 1280 × 720 px`}
        actions={exportActions}
      />

      <div className="flex gap-5" style={{ alignItems: "flex-start" }}>

        {/* ── FORM ─────────────────────────────────────────── */}
        <div className="cms-card flex flex-col gap-4 shrink-0" style={{ width: 290 }}>

          {/* Presets */}
          <div>
            <div className="cms-label">Schnell-Presets</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <PresetBtn key={p.label} onClick={() => patch(p.values)}>{p.label}</PresetBtn>
              ))}
            </div>
          </div>

          {/* Episode */}
          <Field label="Episode Nr.">
            <input className="cms-input" value={s.episode} onChange={e => patch({ episode: e.target.value })} placeholder="4" />
          </Field>

          {/* Headline */}
          <Field label="Headline">
            <textarea className="cms-input" rows={2} value={s.headline} onChange={e => patch({ headline: e.target.value })} style={{ resize: "vertical" }} />
          </Field>

          {/* Keyword */}
          <Field label={<>Keyword <span style={{ color: "var(--gold)", fontStyle: "italic", textTransform: "none" }}>· gold</span></>}>
            <input className="cms-input" value={s.keyword} onChange={e => patch({ keyword: e.target.value })} />
          </Field>

          {/* Subline */}
          <Field label={<>Subline <span style={{ fontStyle: "italic", textTransform: "none", color: "var(--text-muted)" }}>· kursiv</span></>}>
            <input className="cms-input" value={s.subline} onChange={e => patch({ subline: e.target.value })} />
          </Field>

          {/* Photo */}
          <div>
            <div className="cms-label">Foto</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "0.5rem 0.75rem",
                background: "var(--bg-surface-2)",
                border: "1px dashed var(--border)",
                borderRadius: 3, cursor: "pointer",
                fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.9rem",
                color: s.photoUrl ? "var(--text-primary)" : "var(--text-muted)",
                textAlign: "left",
              }}
            >
              {s.photoUrl ? "✓ Geladen — klicken zum Ändern" : "Klicken zum Hochladen · JPG / PNG"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>

          {/* Sliders */}
          <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="cms-label" style={{ marginBottom: 0 }}>Fotokorrektur</div>
            <Slider label="Helligkeit" value={s.brightness}    min={20}  max={110} onChange={v => patch({ brightness: v })} />
            <Slider label="Sättigung"  value={s.saturation}    min={0}   max={150} onChange={v => patch({ saturation: v })} />
            <Slider label="Gradient"   value={s.gradientDepth} min={20}  max={80}  onChange={v => patch({ gradientDepth: v })} unit="%" />
          </div>

          {/* Bottom export */}
          <div className="flex flex-col gap-2">
            <CmsBtn onClick={handleDownload} disabled={exporting} full>
              {exporting ? "Exportiere …" : "↓  Download PNG · 1280 × 720"}
            </CmsBtn>
            <CmsBtn onClick={handleCopy} disabled={exporting} full variant="secondary">
              In Zwischenablage kopieren
            </CmsBtn>
            {exportFeedback && (
              <p className="text-xs text-center" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
                {exportFeedback}
              </p>
            )}
          </div>
        </div>

        {/* ── PREVIEW ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="rounded-sm overflow-hidden" style={{ border: "1px solid var(--border)", background: "#05101f" }}>

            {/* Scale container — sets visible size */}
            <div ref={wrapRef} style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>

              {/* The actual 1280×720 thumbnail */}
              <div
                ref={thumbRef}
                style={{
                  width: 1280, height: 720,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute", top: 0, left: 0,
                  background: "#05101f",
                  overflow: "hidden",
                }}
              >
                {/* Photo */}
                {s.photoUrl && (
                  <img
                    src={s.photoUrl}
                    alt=""
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover", objectPosition: "center 15%",
                      filter: `brightness(${s.brightness / 100}) saturate(${s.saturation / 100})`,
                    }}
                  />
                )}

                {/* Gradient overlay — bottom dark */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${overlay})` }} />

                {/* Gold ray SVG */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09, pointerEvents: "none" }}
                  viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
                  <g stroke="#c9a84c" strokeWidth="1.2">
                    {([[0,0],[0,200],[0,400],[0,600],[0,720],[130,0],[130,720],[210,0],[210,720],[340,0],[340,720],[500,0],[500,720]] as [number,number][])
                      .map(([x2,y2],i) => <line key={i} x1={210} y1={360} x2={x2} y2={y2} />)}
                  </g>
                </svg>

                {/* Gold bars */}
                <div style={{ position: "absolute", top: 0,    left: 0, right: 0, height: 3, background: "linear-gradient(to right,#c9a84c,#e2c06a 50%,#c9a84c)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(to right,#c9a84c,#e2c06a 50%,#c9a84c)" }} />

                {/* EP badge */}
                <div style={{
                  position: "absolute", top: 46, left: 52,
                  fontFamily: FONT_CINZEL, fontWeight: 700, fontSize: 14,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "#05101f", background: "#c9a84c",
                  padding: "4px 14px 3px", lineHeight: 1.8,
                }}>
                  EP. {s.episode}
                </div>

                {/* Logo — top right */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.png" alt="" style={{ position: "absolute", top: 36, right: 36, width: 90, opacity: 0.82, objectFit: "contain" }} />

                {/* Text block — bottom center */}
                <div style={{
                  position: "absolute", left: "50%", transform: "translateX(-50%)",
                  bottom: 48, width: 540,
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                }}>
                  {/* Rule */}
                  <div style={{ width: 32, height: 1, background: "#c9a84c", opacity: 0.8, marginBottom: 10 }} />

                  {/* Headline + keyword */}
                  <div style={{
                    fontFamily: FONT_CINZEL, fontWeight: 700, fontSize: 52,
                    lineHeight: 1.0, letterSpacing: "0.04em",
                    color: "#f5eed8", whiteSpace: "nowrap",
                    textShadow: "0 2px 24px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,.95)",
                  }}>
                    {s.headline}{" "}
                    <span style={{ color: "#e2c06a" }}>{s.keyword}</span>
                  </div>

                  {/* Diamond divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 10px", width: 200 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.4)" }} />
                    <div style={{ width: 4, height: 4, background: "#c9a84c", transform: "rotate(45deg)", opacity: 0.75 }} />
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.4)" }} />
                  </div>

                  {/* Subline */}
                  <div style={{
                    fontFamily: FONT_CORMORANT, fontStyle: "italic", fontWeight: 400, fontSize: 20,
                    color: "rgba(245,238,216,0.65)", letterSpacing: "0.05em", lineHeight: 1.4,
                    textShadow: "0 1px 14px rgba(0,0,0,.95)", marginBottom: 8,
                  }}>
                    {s.subline}
                  </div>

                  {/* Branding */}
                  <div style={{
                    fontFamily: FONT_EB, fontSize: 12,
                    letterSpacing: "0.22em", textTransform: "uppercase",
                    color: "rgba(201,168,76,0.55)",
                  }}>
                    Eckstein Podcast &nbsp;·&nbsp; Ep. {s.episode}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <p style={{ marginTop: 6, textAlign: "right", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Vorschau skaliert · Export immer 1280 × 720 px
          </p>
        </div>

      </div>
    </div>
  );
}

/* ── Small helpers ──────────────────────────────────────────── */

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="cms-label">{label}</label>
      {children}
    </div>
  );
}

function PresetBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", padding: "0.4rem 0.6rem",
        background: "var(--bg-surface-2)", border: "1px solid var(--border)",
        borderRadius: 3, cursor: "pointer",
        fontFamily: "var(--font-eb-garamond)", fontSize: "0.85rem",
        color: "var(--text-secondary)",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      {children}
    </button>
  );
}

function CmsBtn({ children, onClick, disabled, full, variant = "primary" }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
  variant?: "primary" | "secondary";
}) {
  const isSecondary = variant === "secondary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : undefined,
        padding: "0.45rem 1rem",
        background: disabled ? "var(--bg-surface-2)" : isSecondary ? "transparent" : "var(--navy)",
        color: disabled ? "var(--text-muted)" : isSecondary ? "var(--text-secondary)" : "var(--gold)",
        border: `1px solid ${disabled ? "var(--border)" : isSecondary ? "var(--border)" : "rgba(201,168,76,0.5)"}`,
        borderRadius: 3, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-cinzel)", fontWeight: 600,
        fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Slider({ label, value, min, max, onChange, unit = "%" }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="cms-label" style={{ marginBottom: 0 }}>{label}</span>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", color: "var(--gold)" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--gold)" }}
      />
    </div>
  );
}
