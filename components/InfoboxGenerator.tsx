"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toBlob, toPng } from "html-to-image";
import PageHeader from "@/components/ui/PageHeader";
import "./infobox-generator.css";

type InfoboxType = "DEFINITION" | "STUDIE" | "ZITAT" | "INFO" | "LINK" | "FAKT";
type InfoboxFormat = "card" | "strip";
type InfoboxBg = "navy" | "cream";
type AnimClass = "ov-a-up" | "ov-a-lft" | null;

interface InfoboxTypography {
  badgeSize: number;
  headlineSize: number;
  bodySize: number;
  sourceSize: number;
  badgeColor: string;
  headlineColor: string;
  bodyColor: string;
  sourceColor: string;
}

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

const DEFAULT_TYPOGRAPHY: InfoboxTypography = {
  badgeSize: 5.5,
  headlineSize: 12.5,
  bodySize: 10,
  sourceSize: 8.5,
  badgeColor: "#c9a84c",
  headlineColor: "#f5eed8",
  bodyColor: "#c8c0a8",
  sourceColor: "#b89950",
};

const EXPORT_TIMEOUT_MS = 30_000;
const EXPORT_CARD_WIDTH = 720;
const EXPORT_STRIP_WIDTH = 1920;
const FONT_CINZEL = "Cinzel, serif";
const FONT_CORMORANT = "Cormorant Garamond, serif";

const BG_SOLID: Record<InfoboxBg, string> = {
  navy: "#05101f",
  cream: "#f5eed8",
};

function themeTypographyColors(bg: InfoboxBg): Pick<
  InfoboxTypography,
  "badgeColor" | "headlineColor" | "bodyColor" | "sourceColor"
> {
  return bg === "navy"
    ? {
        badgeColor: "#c9a84c",
        headlineColor: "#f5eed8",
        bodyColor: "#c8c0a8",
        sourceColor: "#b89950",
      }
    : {
        badgeColor: "#c9a84c",
        headlineColor: "#05101f",
        bodyColor: "#4a5568",
        sourceColor: "#3d4f63",
      };
}

function typographyCssVars(t: InfoboxTypography): React.CSSProperties {
  return {
    ["--ov-badge-size" as string]: `${t.badgeSize}px`,
    ["--ov-headline-size" as string]: `${t.headlineSize}px`,
    ["--ov-body-size" as string]: `${t.bodySize}px`,
    ["--ov-source-size" as string]: `${t.sourceSize}px`,
    ["--ov-badge-color" as string]: t.badgeColor,
    ["--ov-headline-color" as string]: t.headlineColor,
    ["--ov-body-color" as string]: t.bodyColor,
    ["--ov-source-color" as string]: t.sourceColor,
    ["--ov-headline" as string]: t.headlineColor,
    ["--ov-body" as string]: t.bodyColor,
    ["--ov-source" as string]: t.sourceColor,
  };
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
  const probes: Array<{ weight: string; size: string; family: string; style?: string }> = [];

  for (const sel of [".ov-octl", ".ov-osbl", "[data-ov-font='label']", "[data-ov-font='body']"]) {
    const node = root.querySelector(sel) as HTMLElement | null;
    if (!node) continue;
    const cs = getComputedStyle(node);
    const isBody = sel.includes("body") || node.classList.contains("ov-ocd") || node.classList.contains("ov-osd");
    probes.push({
      weight: isBody ? "400" : "600",
      size: cs.fontSize,
      family: cs.fontFamily,
      style: isBody ? "italic" : undefined,
    });
  }

  await Promise.allSettled(
    probes.map(async ({ weight, size, family, style }) => {
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

const ANIM_CLASSES = ["ov-a-up", "ov-a-lft"] as const;

interface ExportSnapshot {
  background: string;
  backgroundColor: string;
  backgroundImage: string;
  opacity: string;
  transform: string;
  hadAnimUp: boolean;
  hadAnimLft: boolean;
}

function prepareExportNode(el: HTMLElement, bgTheme: InfoboxBg): ExportSnapshot {
  const prev: ExportSnapshot = {
    background: el.style.background,
    backgroundColor: el.style.backgroundColor,
    backgroundImage: el.style.backgroundImage,
    opacity: el.style.opacity,
    transform: el.style.transform,
    hadAnimUp: el.classList.contains("ov-a-up"),
    hadAnimLft: el.classList.contains("ov-a-lft"),
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
  el.classList.remove(...ANIM_CLASSES);
  if (prev.hadAnimUp) el.classList.add("ov-a-up");
  if (prev.hadAnimLft) el.classList.add("ov-a-lft");
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

function inlineExportTypography(clone: HTMLElement, typography: InfoboxTypography, scale: number) {
  const s = (px: number) => `${px * scale}px`;

  clone.style.setProperty("--ov-badge-size", s(typography.badgeSize));
  clone.style.setProperty("--ov-headline-size", s(typography.headlineSize));
  clone.style.setProperty("--ov-body-size", s(typography.bodySize));
  clone.style.setProperty("--ov-source-size", s(typography.sourceSize));
  clone.style.setProperty("--ov-badge-color", typography.badgeColor);
  clone.style.setProperty("--ov-headline-color", typography.headlineColor);
  clone.style.setProperty("--ov-body-color", typography.bodyColor);
  clone.style.setProperty("--ov-source-color", typography.sourceColor);
  clone.style.setProperty("--ov-headline", typography.headlineColor);
  clone.style.setProperty("--ov-body", typography.bodyColor);
  clone.style.setProperty("--ov-source", typography.sourceColor);

  clone.querySelectorAll(".ov-octl, .ov-osbl").forEach(node => {
    const el = node as HTMLElement;
    el.style.fontFamily = FONT_CINZEL;
    el.style.fontSize = s(typography.badgeSize);
    el.style.color = typography.badgeColor;
    el.style.letterSpacing = `${3 * scale}px`;
  });

  clone.querySelectorAll(".ov-och, .ov-osh, [data-ov-font='label']").forEach(node => {
    const el = node as HTMLElement;
    el.style.fontFamily = FONT_CINZEL;
    el.style.fontSize = s(typography.headlineSize);
    el.style.color = typography.headlineColor;
    el.style.fontWeight = "600";
  });

  clone.querySelectorAll(".ov-ocd, .ov-osd, [data-ov-font='body']").forEach(node => {
    const el = node as HTMLElement;
    el.style.fontFamily = FONT_CORMORANT;
    el.style.fontSize = s(typography.bodySize);
    el.style.color = typography.bodyColor;
    el.style.fontStyle = "italic";
  });

  clone.querySelectorAll(".ov-ocs, .ov-oss").forEach(node => {
    const el = node as HTMLElement;
    el.style.fontFamily = FONT_CORMORANT;
    el.style.fontSize = s(typography.sourceSize);
    el.style.color = typography.sourceColor;
  });
}

function buildExportNode(
  source: HTMLElement,
  format: InfoboxFormat,
  typography: InfoboxTypography,
): { container: HTMLDivElement; clone: HTMLElement } {
  const exportWidth = format === "card" ? EXPORT_CARD_WIDTH : EXPORT_STRIP_WIDTH;
  const previewWidth = source.getBoundingClientRect().width || source.offsetWidth || (format === "card" ? 120 : 400);
  const scale = exportWidth / previewWidth;

  const container = document.createElement("div");
  // Must stay visible — html-to-image skips content inside visibility:hidden nodes
  container.style.cssText =
    "position:fixed;left:0;top:0;transform:translateX(-20000px);z-index:-1;pointer-events:none;overflow:visible;";

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.classList.remove(...ANIM_CLASSES);
  clone.style.width = `${exportWidth}px`;
  clone.style.maxWidth = `${exportWidth}px`;
  clone.style.boxSizing = "border-box";
  clone.style.margin = "0";
  clone.style.opacity = "1";
  clone.style.transform = "none";

  if (format === "card") {
    clone.style.display = "block";
    clone.style.padding = `${9 * scale}px ${11 * scale}px ${10 * scale}px ${10 * scale}px`;
    clone.style.borderLeftWidth = `${3 * scale}px`;
  } else {
    clone.style.display = "flex";
    clone.style.alignItems = "center";
    clone.style.padding = `${9 * scale}px ${16 * scale}px ${10 * scale}px ${12 * scale}px`;
    clone.style.borderLeftWidth = `${3 * scale}px`;
    clone.style.gap = `${10 * scale}px`;
  }

  inlineExportTypography(clone, typography, scale);

  container.appendChild(clone);
  document.body.appendChild(container);
  return { container, clone };
}

async function captureOverlay(el: HTMLElement, bgTheme: InfoboxBg): Promise<Blob> {
  await waitForFonts(el);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  const prev = prepareExportNode(el, bgTheme);
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  const fillColor = BG_SOLID[bgTheme];
  const rect = el.getBoundingClientRect();
  const opts = {
    backgroundColor: fillColor,
    pixelRatio: 2,
    skipFonts: false,
    cacheBust: true,
    type: "image/png" as const,
    ...(rect.width > 0 && rect.height > 0
      ? { width: Math.round(rect.width), height: Math.round(rect.height) }
      : {}),
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

async function captureForExport(
  source: HTMLElement,
  format: InfoboxFormat,
  bgTheme: InfoboxBg,
  typography: InfoboxTypography,
): Promise<Blob> {
  const { container, clone } = buildExportNode(source, format, typography);
  try {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return await captureOverlay(clone, bgTheme);
  } catch {
    return await captureOverlay(source, bgTheme);
  } finally {
    document.body.removeChild(container);
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
  const [customTypeLabel, setCustomTypeLabel] = useState<string | null>(null);
  const [typography, setTypography] = useState<InfoboxTypography>(DEFAULT_TYPOGRAPHY);
  const [exporting, setExporting] = useState(false);
  const [exportOk, setExportOk] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [animClass, setAnimClass] = useState<AnimClass>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const exportPreviewRef = useRef<string | null>(null);

  const displayTypeLabel = customTypeLabel ?? TYPE_LABELS[type];
  const themeClass = bgTheme === "navy" ? "ov-theme-navy" : "ov-theme-cream";
  const displayHeadline = headline.trim() || "Begriff eingeben";
  const hasDescription = description.trim().length > 0;
  const hasSource = source.trim().length > 0;
  const overlayStyle = typographyCssVars(typography);

  useEffect(() => {
    return () => {
      if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
    };
  }, []);

  const handleTypeChange = useCallback((t: InfoboxType) => {
    setType(t);
    setCustomTypeLabel(null);
  }, []);

  const handleBgThemeChange = useCallback((bg: InfoboxBg) => {
    setBgTheme(bg);
    setTypography(prev => ({ ...prev, ...themeTypographyColors(bg) }));
  }, []);

  const resetThemeTypography = useCallback(() => {
    setTypography(prev => ({
      ...prev,
      ...themeTypographyColors(bgTheme),
    }));
  }, [bgTheme]);

  const updateTypography = useCallback(
    (patch: Partial<InfoboxTypography>) => setTypography(prev => ({ ...prev, ...patch })),
    [],
  );

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
      const blob = await captureForExport(el, format, bgTheme, typography);
      const slug = displayTypeLabel.toLowerCase().replace(/\s+/g, "-");
      const ts = Date.now();
      const filename = `eckstein-${format}-${bgTheme}-${slug}-${ts}.jpg`;
      downloadBlob(blob, filename);

      if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
      const previewUrl = URL.createObjectURL(blob);
      exportPreviewRef.current = previewUrl;
      setExportPreviewUrl(previewUrl);

      setExportOk(true);
      setTimeout(() => setExportOk(false), 2200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export fehlgeschlagen";
      setExportFeedback(msg);
    } finally {
      setExporting(false);
    }
  }, [format, bgTheme, typography, displayTypeLabel]);

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
      {exportPreviewUrl && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: "var(--font-cinzel)", color: "var(--text-muted)", fontSize: 9 }}
          >
            Export
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exportPreviewUrl}
            alt="Export-Vorschau"
            style={{
              height: 48,
              borderRadius: 2,
              border: "1px solid rgba(201,168,76,0.25)",
              objectFit: "contain",
              background: "#020407",
            }}
          />
        </div>
      )}
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
                    onClick={() => handleTypeChange(t)}
                  >
                    {TYPE_SHORT[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ov-cg">
              <label>Typ-Label</label>
              <input
                type="text"
                value={customTypeLabel ?? TYPE_LABELS[type]}
                onChange={e => setCustomTypeLabel(e.target.value)}
                placeholder={TYPE_LABELS[type]}
              />
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
                  onClick={() => handleBgThemeChange("navy")}
                >
                  Dunkelblau
                </button>
                <button
                  type="button"
                  className={`ov-fb${bgTheme === "cream" ? " on" : ""}`}
                  onClick={() => handleBgThemeChange("cream")}
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

            <div className="ov-sep" />

            <div className="ov-cg">
              <label>Typografie</label>
              <div className="ov-typo-grid">
                <div className="ov-typo-row">
                  <span className="ov-typo-lbl">Badge</span>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={0.5}
                    value={typography.badgeSize}
                    onChange={e => updateTypography({ badgeSize: Number(e.target.value) })}
                    className="ov-range"
                  />
                  <span className="ov-typo-val">{typography.badgeSize}px</span>
                  <input
                    type="color"
                    value={typography.badgeColor}
                    onChange={e => updateTypography({ badgeColor: e.target.value })}
                    className="ov-color"
                    title="Badge-Farbe"
                  />
                </div>
                <div className="ov-typo-row">
                  <span className="ov-typo-lbl">Titel</span>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={0.5}
                    value={typography.headlineSize}
                    onChange={e => updateTypography({ headlineSize: Number(e.target.value) })}
                    className="ov-range"
                  />
                  <span className="ov-typo-val">{typography.headlineSize}px</span>
                  <input
                    type="color"
                    value={typography.headlineColor}
                    onChange={e => updateTypography({ headlineColor: e.target.value })}
                    className="ov-color"
                    title="Titel-Farbe"
                  />
                </div>
                <div className="ov-typo-row">
                  <span className="ov-typo-lbl">Text</span>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={0.5}
                    value={typography.bodySize}
                    onChange={e => updateTypography({ bodySize: Number(e.target.value) })}
                    className="ov-range"
                  />
                  <span className="ov-typo-val">{typography.bodySize}px</span>
                  <input
                    type="color"
                    value={typography.bodyColor}
                    onChange={e => updateTypography({ bodyColor: e.target.value })}
                    className="ov-color"
                    title="Text-Farbe"
                  />
                </div>
                <div className="ov-typo-row">
                  <span className="ov-typo-lbl">Quelle</span>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={0.5}
                    value={typography.sourceSize}
                    onChange={e => updateTypography({ sourceSize: Number(e.target.value) })}
                    className="ov-range"
                  />
                  <span className="ov-typo-val">{typography.sourceSize}px</span>
                  <input
                    type="color"
                    value={typography.sourceColor}
                    onChange={e => updateTypography({ sourceColor: e.target.value })}
                    className="ov-color"
                    title="Quellen-Farbe"
                  />
                </div>
              </div>
              <button type="button" className="ov-theme-reset" onClick={resetThemeTypography}>
                Theme-Defaults
              </button>
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

        <div id="ov-pv">
          <div className="ov-pvl">Vorschau — 16 : 9</div>

          <div id="ov-fr">
            <div id="ov-fr-wm">ECKSTEIN PODCAST</div>

            <div id="ov-cw" style={{ display: format === "card" ? undefined : "none" }}>
              <div
                id="ov-card"
                ref={cardRef}
                className={[animClass, themeClass].filter(Boolean).join(" ") || undefined}
                style={overlayStyle}
              >
                <div className="ov-oct">
                  <span className="ov-gem" style={{ width: 4, height: 4 }} aria-hidden="true" />
                  <span className="ov-octl">{displayTypeLabel}</span>
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

            <div id="ov-sw" style={{ display: format === "strip" ? undefined : "none" }}>
              <div
                id="ov-strip"
                ref={stripRef}
                className={[animClass, themeClass].filter(Boolean).join(" ") || undefined}
                style={overlayStyle}
              >
                <div className="ov-osb">
                  <span className="ov-gem" style={{ width: 6, height: 6 }} aria-hidden="true" />
                  <div className="ov-osbl">{displayTypeLabel}</div>
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
