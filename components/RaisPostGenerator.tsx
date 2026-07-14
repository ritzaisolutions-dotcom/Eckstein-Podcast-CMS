"use client";

import { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from "react";
import { toBlob, toPng } from "html-to-image";
import PageHeader from "@/components/ui/PageHeader";

/* ── Types ──────────────────────────────────────────────────── */
interface Pos {
  x: number;
  y: number;
}

interface RaisPostState {
  kicker: string;
  text: string;
  imageUrl: string | null;
  kickerPos: Pos;
  textPos: Pos;
  imagePos: Pos;
}

type DragTarget = "kicker" | "text" | "image";

interface DragSession {
  target: DragTarget;
  startX: number;
  startY: number;
  startPos: Pos;
}

const DEFAULT: RaisPostState = {
  kicker: "KEVIN RITZ · RAIS",
  text: "KI ist kein Buzzword — es ist der Hebel, der Ihr Maklerbüro skaliert.",
  imageUrl: null,
  kickerPos: { x: 80, y: 80 },
  textPos: { x: 80, y: 200 },
  imagePos: { x: 700, y: 80 },
};

const LOGO_SRC = "/brand/RAIS_pictogram.svg";
const FOOTER_TEXT = "KI als Hebel für Ihr Maklerbüro | ritz-ai.solutions";
const EXPORT_TIMEOUT_MS = 30_000;
const MAX_IMAGE_PX = 2560;
const POST_SIZE = 1080;
const PADDING = 80;
const BORDER_INSET = 24;
const IMAGE_W = 300;
const IMAGE_H = 380;
const LOGO_W = 72;
const LOGO_H = 72;
const FOOTER_ZONE_H = 140;
const TEXT_FONT_STEPS = [54, 44, 36, 30] as const;
const TEXT_LINE_HEIGHT = 1.25;
const KICKER_LINE_H = 28;
const KICKER_BLOCK_H = KICKER_LINE_H + 16 + 4;

const FONT_JETBRAINS = "var(--font-jetbrains), 'JetBrains Mono', monospace";
const FONT_SERIF = "Baskerville, 'Palatino Linotype', Palatino, serif";
const FONT_INTER = "var(--font-inter), Inter, sans-serif";

const COLORS = {
  cloud: "#F5F2EC",
  linen: "#FBF8F3",
  orange: "#EC6A37",
  sage: "#789464",
  pistachio: "#3C5A2A",
  charcoal: "#2F2A24",
  stone: "#7B746B",
  border: "#D9D1C7",
} as const;

const EXPORT_OPTS = {
  width: POST_SIZE,
  height: POST_SIZE,
  canvasWidth: POST_SIZE,
  canvasHeight: POST_SIZE,
  pixelRatio: 1,
  backgroundColor: COLORS.linen,
  cacheBust: false,
} as const;

function exportErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return "Export fehlgeschlagen";
}

function exportFilename(kicker: string): string {
  const slug = kicker
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug ? `RAIS_Post_${slug}.png` : "RAIS_Post.png";
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
  const probes: Array<{ sel: string; weight: string; size: string }> = [
    { sel: "[data-rais-font='kicker']", weight: "400", size: "20px" },
    { sel: "[data-rais-font='text']", weight: "400", size: "54px" },
    { sel: "[data-rais-font='footer']", weight: "400", size: "18px" },
  ];

  await Promise.allSettled(
    probes.map(async ({ sel, weight, size }) => {
      const node = root.querySelector(sel);
      if (!node) return;
      const family = getComputedStyle(node).fontFamily;
      await document.fonts.load(`${weight} ${size} ${family}`);
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
  if (maxSide > MAX_IMAGE_PX) {
    const s = MAX_IMAGE_PX / maxSide;
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

function computeTextMaxWidth(textPos: Pos, imageUrl: string | null, imagePos: Pos): number {
  const rightEdge = POST_SIZE - PADDING;
  let maxWidth = rightEdge - textPos.x;

  if (imageUrl) {
    const imgLeft = imagePos.x;
    const imgBottom = imagePos.y + IMAGE_H;
    if (textPos.y < imgBottom && textPos.x < imgLeft + IMAGE_W) {
      maxWidth = Math.min(maxWidth, imgLeft - textPos.x - 16);
    }
  }

  return Math.max(120, maxWidth);
}

function computeTextMaxHeight(textPos: Pos): number {
  return POST_SIZE - FOOTER_ZONE_H - textPos.y;
}

function clampPos(
  target: DragTarget,
  pos: Pos,
  elementSize: { w: number; h: number },
): Pos {
  const min = BORDER_INSET + 2;
  const maxX = POST_SIZE - BORDER_INSET - elementSize.w;
  let maxY = POST_SIZE - BORDER_INSET - elementSize.h;

  if (target === "text") {
    maxY = Math.min(maxY, POST_SIZE - FOOTER_ZONE_H - elementSize.h);
  }

  return {
    x: Math.round(Math.max(min, Math.min(pos.x, maxX))),
    y: Math.round(Math.max(min, Math.min(pos.y, maxY))),
  };
}

const FOOTER_CONTAINER_W = POST_SIZE - PADDING - LOGO_W - PADDING - 24;

function measureFooterLayout(): { fontSize: number; split: boolean } {
  if (typeof document === "undefined") return { fontSize: 18, split: false };

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { fontSize: 18, split: false };

  for (const size of [18, 16, 14]) {
    ctx.font = `400 ${size}px ${FONT_INTER}`;
    if (ctx.measureText(FOOTER_TEXT).width <= FOOTER_CONTAINER_W) {
      return { fontSize: size, split: false };
    }
  }

  return { fontSize: 14, split: true };
}

async function capturePost(el: HTMLElement, wrapEl: HTMLElement | null): Promise<Blob> {
  await waitForFonts(el);
  await Promise.allSettled([preloadImage(LOGO_SRC)]);
  await nextFrame();

  const prev = {
    elTransform: el.style.transform,
    wrapOverflow: wrapEl?.style.overflow ?? "",
  };
  el.style.transform = "none";
  if (wrapEl) wrapEl.style.overflow = "visible";
  await nextFrame();

  try {
    const attempts = [
      () => toBlob(el, { ...EXPORT_OPTS, skipFonts: false, type: "image/png" }),
      async () => blobFromDataUrl(await toPng(el, { ...EXPORT_OPTS, skipFonts: false })),
      () => toBlob(el, { ...EXPORT_OPTS, skipFonts: true, type: "image/png" }),
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

function renderKickerText(kicker: string) {
  const parts = kicker.split("·");
  if (parts.length < 2) {
    return kicker;
  }
  const before = parts.slice(0, -1).join("·").trimEnd();
  const after = parts[parts.length - 1].trim();
  return (
    <>
      {before}
      <span style={{ color: COLORS.stone }}> · </span>
      <span style={{ color: COLORS.orange }}>{after}</span>
    </>
  );
}

function RaisLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{
          width: LOGO_W,
          height: LOGO_H,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.linen,
          fontFamily: FONT_INTER,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.orange,
          letterSpacing: "0.08em",
        }}
      >
        RAIS
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt=""
      width={LOGO_W}
      height={LOGO_H}
      onError={() => setFailed(true)}
      style={{ width: LOGO_W, height: LOGO_H, objectFit: "contain" }}
    />
  );
}

/* ── Component ──────────────────────────────────────────────── */
export default function RaisPostGenerator() {
  const [s, setS] = useState<RaisPostState>(DEFAULT);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);
  const [textFontSize, setTextFontSize] = useState<number>(TEXT_FONT_STEPS[0]);
  const [activeDrag, setActiveDrag] = useState<DragTarget | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget | null>(null);

  const footerLayout = useMemo(() => measureFooterLayout(), []);

  const wrapRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);

  const patch = useCallback((p: Partial<RaisPostState>) => setS(prev => ({ ...prev, ...p })), []);

  const textMaxWidth = computeTextMaxWidth(s.textPos, s.imageUrl, s.imagePos);
  const textMaxHeight = computeTextMaxHeight(s.textPos);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / POST_SIZE));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let chosen = TEXT_FONT_STEPS[TEXT_FONT_STEPS.length - 1];
    for (const size of TEXT_FONT_STEPS) {
      el.style.fontSize = `${size}px`;
      el.style.lineHeight = String(TEXT_LINE_HEIGHT);
      el.style.maxWidth = `${textMaxWidth}px`;
      if (el.scrollHeight <= textMaxHeight) {
        chosen = size;
        break;
      }
    }
    setTextFontSize(chosen);
  }, [s.text, s.textPos, s.imageUrl, s.imagePos, textMaxWidth, textMaxHeight]);

  function posKey(target: DragTarget): keyof Pick<RaisPostState, "kickerPos" | "textPos" | "imagePos"> {
    switch (target) {
      case "kicker": return "kickerPos";
      case "text": return "textPos";
      case "image": return "imagePos";
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  function elementSize(target: DragTarget): { w: number; h: number } {
    switch (target) {
      case "kicker":
        return { w: 400, h: KICKER_BLOCK_H };
      case "text":
        return {
          w: textMaxWidth,
          h: textRef.current?.offsetHeight ?? 200,
        };
      case "image":
        return { w: IMAGE_W, h: IMAGE_H };
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  function startDrag(e: React.PointerEvent, target: DragTarget) {
    if (exporting) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const key = posKey(target);
    dragRef.current = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      startPos: s[key],
    };
    setActiveDrag(target);
  }

  function onDragMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = (e.clientX - drag.startX) / scale;
    const dy = (e.clientY - drag.startY) / scale;
    const size = elementSize(drag.target);
    const next = clampPos(drag.target, {
      x: drag.startPos.x + dx,
      y: drag.startPos.y + dy,
    }, size);

    patch({ [posKey(drag.target)]: next });
  }

  function endDrag(e: React.PointerEvent) {
    if (!dragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setActiveDrag(null);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExportFeedback(null);
    try {
      const dataUrl = await imageToDataUrl(file);
      patch({ imageUrl: dataUrl });
    } catch {
      setExportFeedback("Bild konnte nicht geladen werden");
    }
  }

  function resetLayout() {
    patch({
      kickerPos: DEFAULT.kickerPos,
      textPos: DEFAULT.textPos,
      imagePos: DEFAULT.imagePos,
    });
  }

  async function handleDownload() {
    const el = postRef.current;
    if (!el) return;
    setExporting(true);
    setExportFeedback(null);
    try {
      if (s.imageUrl) await preloadImage(s.imageUrl);
      const blob = await capturePost(el, wrapRef.current);
      downloadBlob(blob, exportFilename(s.kicker));
    } catch (err) {
      setExportFeedback(exportErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const dragStyle = (target: DragTarget): React.CSSProperties => ({
    cursor: exporting ? "default" : activeDrag === target ? "grabbing" : "grab",
    outline: hoverTarget === target || activeDrag === target
      ? `1px dashed ${COLORS.orange}`
      : "1px dashed transparent",
    outlineOffset: 4,
    touchAction: "none",
    pointerEvents: exporting ? "none" : "auto",
  });

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

  const footerLines = footerLayout.split
    ? FOOTER_TEXT.split("|").map(part => part.trim())
    : [FOOTER_TEXT];

  return (
    <div className="px-4 md:px-6 py-6" style={{ maxWidth: 1400, margin: "0 auto" }}>

      <PageHeader
        title="RAIS Post"
        subtitle="1080 × 1080 px"
        actions={exportActions}
      />

      <div className="flex gap-5" style={{ alignItems: "flex-start" }}>

        {/* ── FORM ─────────────────────────────────────────── */}
        <div className="cms-card flex flex-col gap-4 shrink-0" style={{ width: 290 }}>

          <Field label="Kicker">
            <input
              className="cms-input"
              value={s.kicker}
              onChange={e => patch({ kicker: e.target.value })}
              placeholder="KEVIN RITZ · RAIS"
            />
          </Field>

          <Field label="Haupttext">
            <textarea
              className="cms-input"
              rows={5}
              value={s.text}
              onChange={e => patch({ text: e.target.value })}
              style={{ resize: "vertical" }}
            />
          </Field>

          <div>
            <div className="cms-label">Bild (optional)</div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "0.5rem 0.75rem",
                background: "var(--bg-surface-2)",
                border: "1px dashed var(--border)",
                borderRadius: 3, cursor: "pointer",
                fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.9rem",
                color: s.imageUrl ? "var(--text-primary)" : "var(--text-muted)",
                textAlign: "left",
              }}
            >
              {s.imageUrl ? "✓ Geladen — klicken zum Ändern" : "Klicken zum Hochladen · JPG / PNG"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            {s.imageUrl && (
              <button
                type="button"
                onClick={() => patch({ imageUrl: null })}
                className="text-xs mt-1"
                style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Bild entfernen
              </button>
            )}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <CmsBtn onClick={resetLayout} variant="secondary" full>
              Layout zurücksetzen
            </CmsBtn>
            <p className="text-xs mt-2" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)", fontStyle: "italic" }}>
              Kicker, Text und Bild auf der Vorschau per Drag verschieben
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <CmsBtn onClick={handleDownload} disabled={exporting} full>
              {exporting ? "Exportiere …" : "↓  Download PNG · 1080 × 1080"}
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
          <div className="rounded-sm overflow-hidden" style={{ border: "1px solid var(--border)", background: COLORS.linen }}>

            <div ref={wrapRef} style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", position: "relative" }}>

              <div
                ref={postRef}
                style={{
                  width: POST_SIZE,
                  height: POST_SIZE,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  background: COLORS.linen,
                  overflow: "hidden",
                }}
              >
                {/* Outer frame */}
                <div
                  style={{
                    position: "absolute",
                    inset: BORDER_INSET,
                    border: `2px solid ${COLORS.border}`,
                    pointerEvents: "none",
                  }}
                />

                {/* Draggable kicker */}
                <div
                  style={{
                    position: "absolute",
                    left: s.kickerPos.x,
                    top: s.kickerPos.y,
                    zIndex: 3,
                    ...dragStyle("kicker"),
                  }}
                  onPointerDown={e => startDrag(e, "kicker")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onMouseEnter={() => setHoverTarget("kicker")}
                  onMouseLeave={() => setHoverTarget(h => h === "kicker" ? null : h)}
                >
                  <div
                    data-rais-font="kicker"
                    style={{
                      fontFamily: FONT_JETBRAINS,
                      fontSize: 20,
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      color: COLORS.stone,
                      lineHeight: `${KICKER_LINE_H}px`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderKickerText(s.kicker)}
                  </div>
                  <div
                    style={{
                      width: 64,
                      height: 4,
                      background: COLORS.orange,
                      marginTop: 16,
                    }}
                  />
                </div>

                {/* Draggable optional image */}
                {s.imageUrl && (
                  <div
                    style={{
                      position: "absolute",
                      left: s.imagePos.x,
                      top: s.imagePos.y,
                      width: IMAGE_W,
                      height: IMAGE_H,
                      zIndex: 3,
                      ...dragStyle("image"),
                    }}
                    onPointerDown={e => startDrag(e, "image")}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onMouseEnter={() => setHoverTarget("image")}
                    onMouseLeave={() => setHoverTarget(h => h === "image" ? null : h)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 14,
                        border: `2px solid ${COLORS.border}`,
                      }}
                    />
                  </div>
                )}

                {/* Draggable main text */}
                <div
                  style={{
                    position: "absolute",
                    left: s.textPos.x,
                    top: s.textPos.y,
                    maxWidth: textMaxWidth,
                    zIndex: 2,
                    ...dragStyle("text"),
                  }}
                  onPointerDown={e => startDrag(e, "text")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onMouseEnter={() => setHoverTarget("text")}
                  onMouseLeave={() => setHoverTarget(h => h === "text" ? null : h)}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: -4,
                      top: -72,
                      display: "block",
                      fontFamily: FONT_SERIF,
                      fontSize: 120,
                      lineHeight: 0.8,
                      color: COLORS.sage,
                      opacity: 0.45,
                      zIndex: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    „
                  </span>
                  <div
                    ref={textRef}
                    data-rais-font="text"
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontFamily: FONT_SERIF,
                      fontSize: textFontSize,
                      lineHeight: TEXT_LINE_HEIGHT,
                      color: COLORS.charcoal,
                      maxWidth: textMaxWidth,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {s.text}
                  </div>
                </div>

                {/* Fixed footer */}
                <div
                  style={{
                    position: "absolute",
                    left: PADDING,
                    bottom: PADDING + LOGO_H + 16,
                    width: FOOTER_CONTAINER_W,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      background: COLORS.border,
                      marginBottom: 12,
                    }}
                  />
                  <div
                    data-rais-font="footer"
                    style={{
                      fontFamily: FONT_INTER,
                      fontSize: footerLayout.fontSize,
                      lineHeight: 1.4,
                      color: COLORS.stone,
                      whiteSpace: footerLayout.split ? "normal" : "nowrap",
                    }}
                  >
                    {footerLayout.split
                      ? footerLines.map((line, i) => (
                          <span key={i}>
                            {i > 0 && <br />}
                            {line}
                          </span>
                        ))
                      : FOOTER_TEXT}
                  </div>
                </div>

                {/* Fixed logo */}
                <div
                  style={{
                    position: "absolute",
                    right: PADDING,
                    bottom: PADDING,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                >
                  <RaisLogo />
                </div>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 6, textAlign: "right", fontFamily: "var(--font-eb-garamond)", fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Vorschau skaliert · Export immer 1080 × 1080 px
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
