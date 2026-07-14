"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { toBlob, toPng } from "html-to-image";
import PageHeader from "@/components/ui/PageHeader";

/* ── Types ──────────────────────────────────────────────────── */
type ThumbLayout = "split" | "zahl" | "face-keyword" | "vorher-nachher" | "statement";

interface KRThumbState {
  layout: ThumbLayout;
  headline: string;
  keyword: string;
  number: string;
  numberContext: string;
  photoUrl: string | null;
  photoUrl2: string | null;
}

const LAYOUT_LABELS: Record<ThumbLayout, string> = {
  split: "Split",
  zahl: "Zahl",
  "face-keyword": "Face+KW",
  "vorher-nachher": "Vorher/Nachher",
  statement: "Statement",
};

const PRESETS: Array<{ label: string; values: Partial<KRThumbState> }> = [
  { label: "Split · Prozesse", values: { layout: "split", headline: "MANUELLE PROZESSE KOSTEN ZEIT" } },
  { label: "Zahl · 10x", values: { layout: "zahl", number: "10x", numberContext: "in 90 Tagen" } },
  { label: "Face · Skalieren", values: { layout: "face-keyword", keyword: "SKALIEREN OHNE CHAOS" } },
  { label: "Vorher · 10h", values: { layout: "vorher-nachher", headline: "VORHER NACHHER", numberContext: "10h → 1h" } },
  { label: "Statement · KI", values: { layout: "statement", headline: "KI ERSETZT KEIN TEAM" } },
];

const DEFAULT: KRThumbState = {
  layout: "split",
  headline: "MANUELLE PROZESSE KOSTEN ZEIT",
  keyword: "SKALIEREN",
  number: "10x",
  numberContext: "in 90 Tagen",
  photoUrl: null,
  photoUrl2: null,
};

const WORDMARK_SRC = "/brand/kevin-ritz-wordmark.png";
const EXPORT_TIMEOUT_MS = 30_000;
const MAX_PHOTO_PX = 2560;
const THUMB_W = 1280;
const THUMB_H = 720;
const EDGE_MARGIN = 128;
const CONTENT_W = 853;
const SPLIT_HALF = THUMB_W / 2;
const PANEL_W = Math.round(THUMB_W * 0.4);
const PHOTO_OPTIONAL_W = Math.round(THUMB_W * 0.3);
const NUMBER_SIZE = Math.round(THUMB_H * 0.4);

const FONT_DISPLAY = "var(--font-kr-display), 'Archivo Black', sans-serif";
const FONT_INTER = "var(--font-inter), Inter, sans-serif";
const FONT_WORDMARK = "var(--font-cormorant), 'Cormorant Garamond', serif";

const C = {
  racingGreen: "#1B4A3D",
  silver: "#B8BCC0",
  nearBlack: "#0A0A0A",
  darkGrey: "#2E2E2E",
  offWhite: "#F2F1ED",
} as const;

function exportBg(layout: ThumbLayout): string {
  switch (layout) {
    case "split":
    case "face-keyword":
      return C.nearBlack;
    case "zahl":
    case "statement":
      return C.racingGreen;
    case "vorher-nachher":
      return C.offWhite;
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function exportErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return "Export fehlgeschlagen";
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function waitForFonts(root: HTMLElement) {
  const probes: Array<{ sel: string; weight: string; size: string; style?: string }> = [
    { sel: "[data-kr-font='headline']", weight: "400", size: "48px" },
    { sel: "[data-kr-font='number']", weight: "400", size: "288px" },
    { sel: "[data-kr-font='keyword']", weight: "400", size: "64px" },
    { sel: "[data-kr-font='context']", weight: "400", size: "18px" },
    { sel: "[data-kr-font='wordmark']", weight: "400", size: "14px", style: "italic" },
  ];

  await Promise.allSettled(
    probes.map(async ({ sel, weight, size, style }) => {
      const node = root.querySelector(sel);
      if (!node) return;
      const family = getComputedStyle(node).fontFamily;
      const stylePart = style ? `${style} ` : "";
      await document.fonts.load(`${stylePart}${weight} ${size} ${family}`);
    }),
  );

  await Promise.race([
    document.fonts.ready,
    new Promise<void>(resolve => setTimeout(resolve, 5000)),
  ]);
}

async function preloadImage(src: string): Promise<void> {
  const img = new Image();
  if (/^https?:\/\//.test(src)) img.crossOrigin = "anonymous";
  img.src = src;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    });
  }
}

async function nextFrame() {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function imageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const maxSide = Math.max(width, height);
  if (maxSide > MAX_PHOTO_PX) {
    const s = MAX_PHOTO_PX / maxSide;
    width = Math.round(width * s);
    height = Math.round(height * s);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function captureThumbnail(
  el: HTMLElement,
  wrapEl: HTMLElement | null,
  backgroundColor: string,
): Promise<Blob> {
  await waitForFonts(el);
  await Promise.allSettled([preloadImage(WORDMARK_SRC)]);
  await nextFrame();

  const prev = {
    elTransform: el.style.transform,
    wrapOverflow: wrapEl?.style.overflow ?? "",
  };
  el.style.transform = "none";
  if (wrapEl) wrapEl.style.overflow = "visible";
  await nextFrame();

  const exportOpts = {
    width: THUMB_W,
    height: THUMB_H,
    canvasWidth: THUMB_W,
    canvasHeight: THUMB_H,
    pixelRatio: 1,
    backgroundColor,
    cacheBust: false,
  } as const;

  try {
    const attempts = [
      () => toBlob(el, { ...exportOpts, skipFonts: false, type: "image/png" }),
      async () => blobFromDataUrl(await toPng(el, { ...exportOpts, skipFonts: false })),
      () => toBlob(el, { ...exportOpts, skipFonts: true, type: "image/png" }),
    ];

    let lastErr: unknown;
    for (const attempt of attempts) {
      try {
        const blob = await withTimeout(
          attempt(),
          EXPORT_TIMEOUT_MS,
          "Export-Timeout — bitte erneut versuchen",
        );
        if (blob && blob.size > 0) return blob;
        lastErr = new Error("Export lieferte kein Bild");
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  } finally {
    el.style.transform = prev.elTransform;
    if (wrapEl) wrapEl.style.overflow = prev.wrapOverflow;
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

function KevinRitzWordmark() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        data-kr-font="wordmark"
        style={{
          fontFamily: FONT_WORDMARK,
          fontStyle: "italic",
          fontSize: 14,
          color: C.silver,
          letterSpacing: "0.04em",
        }}
      >
        kevin_ritz
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={WORDMARK_SRC}
      alt=""
      height={20}
      onError={() => setFailed(true)}
      style={{ height: 20, width: "auto", objectFit: "contain" }}
    />
  );
}

function renderHeadlineWithUnderline(headline: string) {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return headline;
  const last = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");

  return (
    <>
      {rest && <>{rest}{" "}</>}
      <span style={{ position: "relative", display: "inline-block" }}>
        {last}
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -4,
            height: 2,
            background: C.silver,
          }}
        />
      </span>
    </>
  );
}

function SplitLayout({ s }: { s: KRThumbState }) {
  const overlay = [
    "rgba(10,10,10,0) 0%",
    "rgba(10,10,10,0) 45%",
    "rgba(10,10,10,0.5) 75%",
    "rgba(10,10,10,0.7) 100%",
  ].join(", ");

  return (
    <>
      {s.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photoUrl}
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SPLIT_HALF,
            height: THUMB_H,
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: SPLIT_HALF, height: THUMB_H, background: C.darkGrey }} />
      )}
      {s.photoUrl2 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photoUrl2}
          alt=""
          style={{
            position: "absolute",
            left: SPLIT_HALF,
            top: 0,
            width: SPLIT_HALF,
            height: THUMB_H,
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : (
        <div style={{ position: "absolute", left: SPLIT_HALF, top: 0, width: SPLIT_HALF, height: THUMB_H, background: C.darkGrey }} />
      )}
      <div
        style={{
          position: "absolute",
          left: SPLIT_HALF - 1,
          top: 0,
          width: 2,
          height: THUMB_H,
          background: C.silver,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${overlay})`,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        data-kr-font="headline"
        style={{
          position: "absolute",
          left: EDGE_MARGIN,
          bottom: EDGE_MARGIN + 28,
          maxWidth: CONTENT_W - EDGE_MARGIN,
          fontFamily: FONT_DISPLAY,
          fontSize: 48,
          lineHeight: 1.05,
          fontWeight: 400,
          textTransform: "uppercase",
          color: C.offWhite,
          zIndex: 3,
        }}
      >
        {s.headline || "HEADLINE HIER"}
      </div>
      <div style={{ position: "absolute", left: EDGE_MARGIN, bottom: EDGE_MARGIN - 8, zIndex: 3 }}>
        <KevinRitzWordmark />
      </div>
    </>
  );
}

function ZahlLayout({ s }: { s: KRThumbState }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: C.racingGreen }} />
      {s.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photoUrl}
          alt=""
          style={{
            position: "absolute",
            right: EDGE_MARGIN,
            bottom: EDGE_MARGIN,
            width: PHOTO_OPTIONAL_W,
            height: Math.round(PHOTO_OPTIONAL_W * 0.75),
            objectFit: "cover",
            borderRadius: 4,
            zIndex: 0,
            opacity: 0.85,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: EDGE_MARGIN,
          top: "50%",
          transform: "translateY(-55%)",
          zIndex: 2,
          maxWidth: CONTENT_W,
        }}
      >
        <div
          data-kr-font="number"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: NUMBER_SIZE,
            lineHeight: 0.9,
            fontWeight: 400,
            color: C.offWhite,
          }}
        >
          {s.number || "10x"}
        </div>
        {s.numberContext && (
          <div
            data-kr-font="context"
            style={{
              fontFamily: FONT_INTER,
              fontSize: 18,
              color: C.silver,
              marginTop: 12,
            }}
          >
            {s.numberContext}
          </div>
        )}
      </div>
    </>
  );
}

function FaceKeywordLayout({ s }: { s: KRThumbState }) {
  const keywordWords = s.keyword.trim().split(/\s+/).filter(Boolean);
  const line1 = keywordWords.slice(0, 2).join(" ");
  const line2 = keywordWords.slice(2).join(" ");

  return (
    <>
      {s.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.photoUrl}
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CONTENT_W,
            height: THUMB_H,
            objectFit: "cover",
            objectPosition: "center left",
          }}
        />
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: CONTENT_W, height: THUMB_H, background: C.darkGrey }} />
      )}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: THUMB_W - CONTENT_W,
          height: THUMB_H,
          background: C.nearBlack,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          zIndex: 2,
        }}
      >
        <div
          data-kr-font="keyword"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 52,
            lineHeight: 1.1,
            fontWeight: 400,
            textTransform: "uppercase",
            color: C.offWhite,
            textAlign: "center",
          }}
        >
          {line1 || "KEYWORD"}
          {line2 && (
            <>
              <br />
              <span style={{ color: C.silver }}>{line2}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function VorherNachherLayout({ s }: { s: KRThumbState }) {
  const centerX = THUMB_W / 2;
  const panelTop = 200;
  const panelHeight = 360;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: C.offWhite }} />
      <div
        data-kr-font="headline"
        style={{
          position: "absolute",
          left: EDGE_MARGIN,
          top: EDGE_MARGIN,
          maxWidth: CONTENT_W,
          fontFamily: FONT_DISPLAY,
          fontSize: 40,
          lineHeight: 1.1,
          textTransform: "uppercase",
          color: C.nearBlack,
        }}
      >
        {s.headline || "VORHER NACHHER"}
      </div>
      <div
        style={{
          position: "absolute",
          left: centerX - PANEL_W - 48,
          top: panelTop,
          width: PANEL_W,
          height: panelHeight,
          overflow: "hidden",
          borderRadius: 4,
          border: `2px solid ${C.silver}`,
        }}
      >
        {s.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.darkGrey }} />
        )}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            fontFamily: FONT_INTER,
            fontSize: 12,
            color: C.offWhite,
            background: "rgba(10,10,10,0.6)",
            padding: "2px 8px",
            borderRadius: 2,
          }}
        >
          Vorher
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: centerX - 20,
          top: panelTop + panelHeight / 2 - 24,
          fontFamily: FONT_DISPLAY,
          fontSize: 48,
          color: C.silver,
          zIndex: 2,
        }}
      >
        →
      </div>
      <div
        style={{
          position: "absolute",
          left: centerX + 48,
          top: panelTop,
          width: PANEL_W,
          height: panelHeight,
          overflow: "hidden",
          borderRadius: 4,
          border: `2px solid ${C.silver}`,
        }}
      >
        {s.photoUrl2 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.photoUrl2} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.darkGrey }} />
        )}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            fontFamily: FONT_INTER,
            fontSize: 12,
            color: C.offWhite,
            background: "rgba(10,10,10,0.6)",
            padding: "2px 8px",
            borderRadius: 2,
          }}
        >
          Nachher
        </div>
      </div>
      {s.numberContext && (
        <div
          data-kr-font="context"
          style={{
            position: "absolute",
            left: EDGE_MARGIN,
            top: panelTop + panelHeight + 24,
            fontFamily: FONT_INTER,
            fontSize: 20,
            color: C.nearBlack,
          }}
        >
          {s.numberContext}
        </div>
      )}
    </>
  );
}

function StatementLayout({ s }: { s: KRThumbState }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: C.racingGreen }} />
      <div
        data-kr-font="headline"
        style={{
          position: "absolute",
          left: EDGE_MARGIN,
          top: EDGE_MARGIN + 40,
          maxWidth: CONTENT_W - EDGE_MARGIN,
          fontFamily: FONT_DISPLAY,
          fontSize: 56,
          lineHeight: 1.08,
          fontWeight: 400,
          textTransform: "uppercase",
          color: C.offWhite,
        }}
      >
        {s.headline ? renderHeadlineWithUnderline(s.headline) : "STATEMENT HIER"}
      </div>
      <div style={{ position: "absolute", left: EDGE_MARGIN, bottom: EDGE_MARGIN, zIndex: 2 }}>
        <KevinRitzWordmark />
      </div>
    </>
  );
}

function LayoutCanvas({ s }: { s: KRThumbState }) {
  switch (s.layout) {
    case "split":
      return <SplitLayout s={s} />;
    case "zahl":
      return <ZahlLayout s={s} />;
    case "face-keyword":
      return <FaceKeywordLayout s={s} />;
    case "vorher-nachher":
      return <VorherNachherLayout s={s} />;
    case "statement":
      return <StatementLayout s={s} />;
    default: {
      const _exhaustive: never = s.layout;
      return _exhaustive;
    }
  }
}

function needsHeadline(layout: ThumbLayout): boolean {
  return layout === "split" || layout === "vorher-nachher" || layout === "statement";
}

function needsPhoto1(layout: ThumbLayout): boolean {
  return layout === "split" || layout === "face-keyword" || layout === "vorher-nachher" || layout === "zahl";
}

function needsPhoto2(layout: ThumbLayout): boolean {
  return layout === "split" || layout === "vorher-nachher";
}

/* ── Component ──────────────────────────────────────────────── */
export default function KevinRitzThumbnailGenerator() {
  const [s, setS] = useState<KRThumbState>(DEFAULT);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);

  const wrapRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const patch = useCallback((p: Partial<KRThumbState>) => setS(prev => ({ ...prev, ...p })), []);

  const headlineWords = wordCount(s.headline);
  const headlineWarn = headlineWords > 5;

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / THUMB_W));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExportFeedback(null);
    try {
      const dataUrl = await imageToDataUrl(file);
      patch(slot === 1 ? { photoUrl: dataUrl } : { photoUrl2: dataUrl });
    } catch {
      setExportFeedback("Bild konnte nicht geladen werden");
    }
  }

  async function handleDownload() {
    const el = thumbRef.current;
    if (!el) return;
    setExporting(true);
    setExportFeedback(null);
    try {
      const preloads = [preloadImage(WORDMARK_SRC)];
      if (s.photoUrl) preloads.push(preloadImage(s.photoUrl));
      if (s.photoUrl2) preloads.push(preloadImage(s.photoUrl2));
      await Promise.allSettled(preloads);
      const blob = await captureThumbnail(el, wrapRef.current, exportBg(s.layout));
      downloadBlob(blob, `KR_Thumbnail_${s.layout}.png`);
    } catch (err) {
      setExportFeedback(exportErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const exportActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <CmsBtn onClick={handleDownload} disabled={exporting}>
        {exporting ? "Exportiere …" : "Download PNG"}
      </CmsBtn>
      {exportFeedback && (
        <span className="text-xs" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
          {exportFeedback}
        </span>
      )}
    </div>
  );

  return (
    <div className="px-4 md:px-6 py-6" style={{ maxWidth: 1400, margin: "0 auto" }}>

      <PageHeader
        title="KR Thumbnail"
        subtitle={`${LAYOUT_LABELS[s.layout]} · 1280 × 720 px`}
        actions={exportActions}
      />

      <div className="flex gap-5" style={{ alignItems: "flex-start" }}>

        {/* ── FORM ─────────────────────────────────────────── */}
        <div className="cms-card flex flex-col gap-4 shrink-0" style={{ width: 290 }}>

          <div>
            <div className="cms-label">Layout</div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(LAYOUT_LABELS) as ThumbLayout[]).map(layout => (
                <LayoutTab
                  key={layout}
                  active={s.layout === layout}
                  onClick={() => patch({ layout })}
                >
                  {LAYOUT_LABELS[layout]}
                </LayoutTab>
              ))}
            </div>
          </div>

          <div>
            <div className="cms-label">Schnell-Presets</div>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESETS.map(p => (
                <PresetBtn key={p.label} onClick={() => patch(p.values)}>{p.label}</PresetBtn>
              ))}
            </div>
          </div>

          {needsHeadline(s.layout) && (
            <Field label={
              <>
                Headline
                <span style={{ marginLeft: 6, fontSize: "0.75rem", color: headlineWarn ? "#c9a84c" : "var(--text-muted)", textTransform: "none", fontStyle: "italic" }}>
                  {headlineWords}/5 Wörter{headlineWarn ? " · zu lang" : ""}
                </span>
              </>
            }>
              <textarea
                className="cms-input"
                rows={2}
                value={s.headline}
                onChange={e => patch({ headline: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </Field>
          )}

          {s.layout === "face-keyword" && (
            <Field label="Keyword (max 3 Wörter)">
              <input
                className="cms-input"
                value={s.keyword}
                onChange={e => patch({ keyword: e.target.value })}
                placeholder="SKALIEREN OHNE CHAOS"
              />
            </Field>
          )}

          {s.layout === "zahl" && (
            <>
              <Field label="Zahl">
                <input className="cms-input" value={s.number} onChange={e => patch({ number: e.target.value })} placeholder="10x" />
              </Field>
              <Field label="Kontext">
                <input className="cms-input" value={s.numberContext} onChange={e => patch({ numberContext: e.target.value })} placeholder="in 90 Tagen" />
              </Field>
            </>
          )}

          {s.layout === "vorher-nachher" && s.numberContext !== undefined && (
            <Field label="Transformation (optional)">
              <input className="cms-input" value={s.numberContext} onChange={e => patch({ numberContext: e.target.value })} placeholder="10h → 1h" />
            </Field>
          )}

          {needsPhoto1(s.layout) && (
            <PhotoField
              label={s.layout === "vorher-nachher" ? "Foto Vorher" : s.layout === "zahl" ? "Foto (optional)" : s.layout === "split" ? "Foto Links" : "Foto"}
              loaded={!!s.photoUrl}
              onClick={() => fileInputRef.current?.click()}
              onClear={s.photoUrl ? () => patch({ photoUrl: null }) : undefined}
            />
          )}

          {needsPhoto2(s.layout) && (
            <PhotoField
              label={s.layout === "split" ? "Foto Rechts" : "Foto Nachher"}
              loaded={!!s.photoUrl2}
              onClick={() => fileInput2Ref.current?.click()}
              onClear={s.photoUrl2 ? () => patch({ photoUrl2: null }) : undefined}
            />
          )}

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handlePhoto(e, 1)} />
          <input ref={fileInput2Ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handlePhoto(e, 2)} />

          <div className="flex flex-col gap-2">
            <CmsBtn onClick={handleDownload} disabled={exporting} full>
              {exporting ? "Exportiere …" : "↓  Download PNG · 1280 × 720"}
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
          <div className="rounded-sm overflow-hidden" style={{ border: "1px solid var(--border)", background: exportBg(s.layout) }}>

            <div ref={wrapRef} style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>

              <div
                ref={thumbRef}
                style={{
                  width: THUMB_W,
                  height: THUMB_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  background: exportBg(s.layout),
                  overflow: "hidden",
                }}
              >
                <LayoutCanvas s={s} />
              </div>
            </div>
          </div>

          <p style={{ marginTop: 6, textAlign: "right", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Vorschau skaliert · Export immer 1280 × 720 px · Safe Zone unten rechts frei
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

function PhotoField({ label, loaded, onClick, onClear }: {
  label: string;
  loaded: boolean;
  onClick: () => void;
  onClear?: () => void;
}) {
  return (
    <div>
      <div className="cms-label">{label}</div>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%", padding: "0.5rem 0.75rem",
          background: "var(--bg-surface-2)",
          border: "1px dashed var(--border)",
          borderRadius: 3, cursor: "pointer",
          fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.9rem",
          color: loaded ? "var(--text-primary)" : "var(--text-muted)",
          textAlign: "left",
        }}
      >
        {loaded ? "✓ Geladen — klicken zum Ändern" : "Klicken zum Hochladen · JPG / PNG"}
      </button>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs mt-1"
          style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Bild entfernen
        </button>
      )}
    </div>
  );
}

function LayoutTab({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.35rem 0.5rem",
        background: active ? C.racingGreen : "var(--bg-surface-2)",
        border: `1px solid ${active ? C.racingGreen : "var(--border)"}`,
        borderRadius: 3,
        cursor: "pointer",
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.55rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: active ? C.offWhite : "var(--text-secondary)",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function PresetBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left", padding: "0.4rem 0.6rem",
        background: "var(--bg-surface-2)", border: "1px solid var(--border)",
        borderRadius: 3, cursor: "pointer",
        fontFamily: "var(--font-eb-garamond)", fontSize: "0.85rem",
        color: "var(--text-secondary)",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.racingGreen; e.currentTarget.style.color = "var(--text-primary)"; }}
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : undefined,
        padding: "0.45rem 1rem",
        background: disabled ? "var(--bg-surface-2)" : isSecondary ? "transparent" : "var(--navy)",
        color: disabled ? "var(--text-muted)" : isSecondary ? "var(--text-secondary)" : "var(--gold)",
        border: `1px solid ${disabled ? "var(--border)" : isSecondary ? "var(--border)" : "rgba(201,168,76,0.5)"}`,
        borderRadius: 3,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-cinzel)",
        fontWeight: 600,
        fontSize: "0.62rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
