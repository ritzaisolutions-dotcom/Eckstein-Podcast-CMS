"use client";

import { useRef, useState, useCallback } from "react";
import { toBlob, toPng } from "html-to-image";
import PageHeader from "@/components/ui/PageHeader";
import "./infobox-generator.css";

type InfoboxType = "DEFINITION" | "STUDIE" | "ZITAT" | "INFO" | "LINK" | "FAKT";
type InfoboxFormat = "card" | "strip";
type InfoboxBg = "navy" | "cream";
type AnimClass = "ov-a-up" | "ov-a-lft" | null;

const TYPES: InfoboxType[] = ["DEFINITION", "STUDIE", "ZITAT", "INFO", "LINK", "FAKT"];

const TYPE_LABELS: Record<InfoboxType, string> = {
  DEFINITION: "Definition",
  STUDIE: "Studie",
  ZITAT: "Zitat",
  INFO: "Info",
  LINK: "Link",
  FAKT: "Fakt",
};

const TYPE_SHORT: Record<InfoboxType, string> = {
  DEFINITION: "Defin.",
  STUDIE: "Studie",
  ZITAT: "Zitat",
  INFO: "Info",
  LINK: "Link",
  FAKT: "Fakt",
};

const EXPORT_TIMEOUT_MS = 30_000;

const BG_SOLID: Record<InfoboxBg, string> = {
  navy: "#05101f",
  cream: "#f5eed8",
};

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
    { sel: "[data-ov-font='label']", weight: "600", size: "12.5px" },
    { sel: "[data-ov-font='body']", weight: "400", size: "10px", style: "italic" },
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

async function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

const EXPORT_PIXEL_RATIO = 3;
const ANIM_CLASSES = ["ov-a-up", "ov-a-lft"] as const;

interface ExportSnapshot {
  background: string;
  backgroundColor: string;
  backgroundImage: string;
  opacity: string;
  transform: string;
  className: string;
}

function prepareExportNode(el: HTMLElement, bgTheme: InfoboxBg): ExportSnapshot {
  const prev: ExportSnapshot = {
    background: el.style.background,
    backgroundColor: el.style.backgroundColor,
    backgroundImage: el.style.backgroundImage,
    opacity: el.style.opacity,
    transform: el.style.transform,
    className: el.className,
  };

  el.classList.remove(...ANIM_CLASSES);
  el.style.backgroundColor = BG_SOLID[bgTheme];
  el.style.backgroundImage = "none";
  el.style.background = BG_SOLID[bgTheme];
  el.style.opacity = "1";
  el.style.transform = "none";

  return prev;
}

function restoreExportNode(el: HTMLElement, prev: ExportSnapshot) {
  el.style.background = prev.background;
  el.style.backgroundColor = prev.backgroundColor;
  el.style.backgroundImage = prev.backgroundImage;
  el.style.opacity = prev.opacity;
  el.style.transform = prev.transform;
  el.className = prev.className;
}

function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Blend every pixel onto fillColor and force alpha=255 — CapCut reads PNG alpha and shows video through. */
function flattenAlphaOntoBackground(ctx: CanvasRenderingContext2D, fillColor: string) {
  const [bgR, bgG, bgB] = parseHexColor(fillColor);
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i]     = Math.round(d[i] * a + bgR * (1 - a));
    d[i + 1] = Math.round(d[i + 1] * a + bgG * (1 - a));
    d[i + 2] = Math.round(d[i + 2] * a + bgB * (1 - a));
    d[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

async function flattenWithBackground(source: Blob, fillColor: string): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar");
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    flattenAlphaOntoBackground(ctx, fillColor);
    // JPEG has no alpha channel — CapCut cannot show video through the overlay background
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error("Export fehlgeschlagen"))),
        "image/jpeg",
        0.95,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function captureOverlay(el: HTMLElement, bgTheme: InfoboxBg): Promise<Blob> {
  await waitForFonts(el);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  const prev = prepareExportNode(el, bgTheme);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  const fillColor = BG_SOLID[bgTheme];
  const opts = {
    backgroundColor: fillColor,
    pixelRatio: EXPORT_PIXEL_RATIO,
    skipFonts: false,
    type: "image/png" as const,
  };

  try {
    const attempts = [
      () => toBlob(el, opts),
      async () => blobFromDataUrl(await toPng(el, opts)),
      () => toBlob(el, { ...opts, skipFonts: true }),
    ];

    let lastErr: unknown;
    for (const attempt of attempts) {
      try {
        const rawBlob = await withTimeout(
          attempt(),
          EXPORT_TIMEOUT_MS,
          "Export-Timeout — bitte erneut versuchen",
        );
        if (rawBlob && rawBlob.size > 0) {
          return await flattenWithBackground(rawBlob, fillColor);
        }
        lastErr = new Error("Export lieferte kein Bild");
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  } finally {
    restoreExportNode(el, prev);
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

export default function InfoboxGenerator() {
  const [type, setType] = useState<InfoboxType>("DEFINITION");
  const [format, setFormat] = useState<InfoboxFormat>("card");
  const [bgTheme, setBgTheme] = useState<InfoboxBg>("navy");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportOk, setExportOk] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [animClass, setAnimClass] = useState<AnimClass>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const typeLabel = TYPE_LABELS[type];
  const themeClass = bgTheme === "navy" ? "ov-theme-navy" : "ov-theme-cream";
  const displayHeadline = headline.trim() || "Begriff eingeben";
  const hasDescription = description.trim().length > 0;
  const hasSource = source.trim().length > 0;

  const handleAnimate = useCallback(() => {
    const cls: AnimClass = format === "card" ? "ov-a-up" : "ov-a-lft";
    setAnimClass(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimClass(cls));
    });
  }, [format]);

  const handleExport = useCallback(async () => {
    const el = format === "card" ? cardRef.current : stripRef.current;
    if (!el) return;

    setExporting(true);
    setExportOk(false);
    setExportFeedback(null);

    try {
      const blob = await captureOverlay(el, bgTheme);
      const filename = `eckstein-${format}-${bgTheme}-${typeLabel.toLowerCase()}.jpg`;
      downloadBlob(blob, filename);
      setExportOk(true);
      setTimeout(() => setExportOk(false), 2200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export fehlgeschlagen";
      setExportFeedback(msg);
    } finally {
      setExporting(false);
    }
  }, [format, bgTheme, typeLabel]);

  const exportActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="px-4 py-2 rounded-sm text-xs uppercase tracking-widest font-semibold transition-opacity disabled:opacity-40"
        style={{
          fontFamily: "var(--font-cinzel)",
          background: "var(--gold)",
          color: "var(--navy)",
          border: "none",
          cursor: exporting ? "not-allowed" : "pointer",
        }}
      >
        {exporting ? "Exportiere …" : "Download JPG"}
      </button>
      {exportFeedback && (
        <span className="text-xs italic" style={{ fontFamily: "var(--font-eb-garamond)", color: "var(--text-muted)" }}>
          {exportFeedback}
        </span>
      )}
    </div>
  );

  return (
    <div className="px-4 md:px-6 py-6" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Infobox Generator"
        subtitle="CapCut-Overlays · JPG ohne Transparenz"
        actions={exportActions}
      />

      <div id="ov-app">
        {/* Sidebar */}
        <div id="ov-sb">
          <div id="ov-sb-hd">
            <span className="ov-gem" aria-hidden="true" />
            <span id="ov-sb-title">Infobox Generator</span>
          </div>

          <div id="ov-sb-bd">
            <div className="ov-cg">
              <label>Typ</label>
              <div className="ov-g3">
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`ov-xb${type === t ? " on" : ""}`}
                    onClick={() => setType(t)}
                  >
                    {TYPE_SHORT[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ov-cg">
              <label>Format</label>
              <div className="ov-g2">
                <button
                  type="button"
                  className={`ov-fb${format === "card" ? " on" : ""}`}
                  onClick={() => setFormat("card")}
                >
                  Karte
                </button>
                <button
                  type="button"
                  className={`ov-fb${format === "strip" ? " on" : ""}`}
                  onClick={() => setFormat("strip")}
                >
                  Einblendung
                </button>
              </div>
            </div>

            <div className="ov-cg">
              <label>Hintergrund</label>
              <div className="ov-g2">
                <button
                  type="button"
                  className={`ov-fb${bgTheme === "navy" ? " on" : ""}`}
                  onClick={() => setBgTheme("navy")}
                >
                  Dunkelblau
                </button>
                <button
                  type="button"
                  className={`ov-fb${bgTheme === "cream" ? " on" : ""}`}
                  onClick={() => setBgTheme("cream")}
                >
                  Creme
                </button>
              </div>
            </div>

            <div className="ov-sep" />

            <div className="ov-cg">
              <label>Begriff / Titel</label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="z.B. Gerechtigkeit"
              />
            </div>

            <div className="ov-cg">
              <label>Beschreibung</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Definition, Kernaussage, Zitat…"
              />
            </div>

            <div className="ov-cg">
              <label>Quelle</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Stanford Enc., 2023"
              />
            </div>
          </div>

          <div id="ov-sb-ft">
            <button
              id="ov-eB"
              type="button"
              className={exportOk ? "ok" : undefined}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exportiere…" : exportOk ? "✓ Exportiert!" : "↓ JPG Exportieren"}
            </button>
            <button id="ov-aniB" type="button" onClick={handleAnimate}>
              ▶ Animation
            </button>
          </div>
        </div>

        {/* Preview */}
        <div id="ov-pv">
          <div className="ov-pvl">Vorschau — 16 : 9</div>

          <div id="ov-fr">
            <div id="ov-fr-wm">ECKSTEIN PODCAST</div>

            {/* Card */}
            <div id="ov-cw" style={{ display: format === "card" ? undefined : "none" }}>
              <div id="ov-card" ref={cardRef} className={[animClass, themeClass].filter(Boolean).join(" ") || undefined}>
                <div className="ov-oct">
                  <span className="ov-gem" style={{ width: 4, height: 4 }} aria-hidden="true" />
                  <span className="ov-octl">{typeLabel}</span>
                </div>
                <div className="ov-och" data-ov-font="label">{displayHeadline}</div>
                {hasDescription && (
                  <div className="ov-ocd" data-ov-font="body">{description.trim()}</div>
                )}
                {hasSource && (
                  <div className="ov-ocs">
                    <div className="ov-ocsl" />
                    <span>{source.trim()}</span>
                  </div>
                )}
                <div className="ov-ocbl" />
              </div>
            </div>

            {/* Strip */}
            <div id="ov-sw" style={{ display: format === "strip" ? undefined : "none" }}>
              <div id="ov-strip" ref={stripRef} className={[animClass, themeClass].filter(Boolean).join(" ") || undefined}>
                <div className="ov-osb">
                  <span className="ov-gem" style={{ width: 6, height: 6 }} aria-hidden="true" />
                  <div className="ov-osbl">{typeLabel}</div>
                </div>
                <div className="ov-osdv" />
                <div className="ov-osc">
                  <div className="ov-osh" data-ov-font="label">{displayHeadline}</div>
                  {hasDescription && (
                    <div className="ov-osd" data-ov-font="body">{description.trim()}</div>
                  )}
                  {hasSource && (
                    <div className="ov-oss">
                      <div className="ov-ossd" />
                      <span>{source.trim()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="ov-pvh">
            JPG exportieren · In CapCut importieren · Größe &amp; Position frei wählen
          </div>
        </div>
      </div>
    </div>
  );
}
