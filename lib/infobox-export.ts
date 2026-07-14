import type { CSSProperties } from "react";
import { toBlob, toPng } from "html-to-image";

export type InfoboxType = "DEFINITION" | "STUDIE" | "ZITAT" | "INFO" | "LINK" | "FAKT";
export type InfoboxFormat = "card" | "strip";
export type InfoboxBg = "navy" | "cream";

export interface InfoboxTypography {
  badgeSize: number;
  headlineSize: number;
  bodySize: number;
  sourceSize: number;
  badgeColor: string;
  headlineColor: string;
  bodyColor: string;
  sourceColor: string;
}

export interface InfoboxItem {
  id: string;
  exportFilename: string;
  type: InfoboxType;
  format: InfoboxFormat;
  bgTheme: InfoboxBg;
  headline: string;
  description: string;
  source: string;
  customTypeLabel?: string | null;
  typography?: Partial<InfoboxTypography>;
}

export interface InfoboxPreset {
  id: string;
  label: string;
  zipFilename: string;
  items: InfoboxItem[];
}

export const TYPE_LABELS: Record<InfoboxType, string> = {
  DEFINITION: "Definition",
  STUDIE: "Studie",
  ZITAT: "Zitat",
  INFO: "Info",
  LINK: "Link",
  FAKT: "Fakt",
};

export const DEFAULT_TYPOGRAPHY: InfoboxTypography = {
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

export function themeTypographyColors(bg: InfoboxBg): Pick<
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

export function resolveTypography(item: InfoboxItem): InfoboxTypography {
  const base = { ...DEFAULT_TYPOGRAPHY, ...themeTypographyColors(item.bgTheme) };
  return { ...base, ...item.typography };
}

export function typographyCssVars(t: InfoboxTypography): CSSProperties {
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

export function typeLabelForItem(item: InfoboxItem): string {
  return item.customTypeLabel ?? TYPE_LABELS[item.type];
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

function flattenAlphaOntoBackground(ctx: CanvasRenderingContext2D, fillColor: string) {
  const [bgR, bgG, bgB] = parseHexColor(fillColor);
  const { width, height } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] = Math.round(d[i] * a + bgR * (1 - a));
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

export async function captureForExport(
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

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

function appendText(parent: HTMLElement, tag: string, className: string, text: string, attrs?: Record<string, string>) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  }
  parent.appendChild(el);
  return el;
}

/** Build a preview-width strip/card element for batch export (mounted off-screen). */
export function createOverlayElement(item: InfoboxItem, typography: InfoboxTypography): HTMLElement {
  const themeClass = item.bgTheme === "navy" ? "ov-theme-navy" : "ov-theme-cream";
  const typeLabel = typeLabelForItem(item);
  const headline = item.headline.trim() || "Begriff eingeben";
  const description = item.description.trim();
  const source = item.source.trim();
  const cssVars = typographyCssVars(typography);

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;left:0;top:0;transform:translateX(-20000px);z-index:-1;pointer-events:none;width:400px;";

  if (item.format === "card") {
    const card = document.createElement("div");
    card.className = `ov-batch-card ${themeClass}`;
    card.style.width = "120px";
    Object.assign(card.style, cssVars as Record<string, string>);

    const oct = document.createElement("div");
    oct.className = "ov-oct";
    const gem = document.createElement("span");
    gem.className = "ov-gem";
    gem.style.width = "4px";
    gem.style.height = "4px";
    oct.appendChild(gem);
    appendText(oct, "span", "ov-octl", typeLabel);
    card.appendChild(oct);

    appendText(card, "div", "ov-och", headline, { "data-ov-font": "label" });
    if (description) appendText(card, "div", "ov-ocd", description, { "data-ov-font": "body" });
    if (source) {
      const ocs = document.createElement("div");
      ocs.className = "ov-ocs";
      const line = document.createElement("div");
      line.className = "ov-ocsl";
      ocs.appendChild(line);
      appendText(ocs, "span", "", source);
      card.appendChild(ocs);
    }
    const bl = document.createElement("div");
    bl.className = "ov-ocbl";
    card.appendChild(bl);

    wrapper.appendChild(card);
    return card;
  }

  const strip = document.createElement("div");
  strip.className = `ov-batch-strip ${themeClass}`;
  Object.assign(strip.style, cssVars as Record<string, string>);
  strip.style.width = "400px";

  const osb = document.createElement("div");
  osb.className = "ov-osb";
  const gem = document.createElement("span");
  gem.className = "ov-gem";
  gem.style.width = "6px";
  gem.style.height = "6px";
  osb.appendChild(gem);
  appendText(osb, "div", "ov-osbl", typeLabel);
  strip.appendChild(osb);

  const div = document.createElement("div");
  div.className = "ov-osdv";
  strip.appendChild(div);

  const osc = document.createElement("div");
  osc.className = "ov-osc";
  appendText(osc, "div", "ov-osh", headline, { "data-ov-font": "label" });
  if (description) appendText(osc, "div", "ov-osd", description, { "data-ov-font": "body" });
  if (source) {
    const oss = document.createElement("div");
    oss.className = "ov-oss";
    const dot = document.createElement("div");
    dot.className = "ov-ossd";
    oss.appendChild(dot);
    appendText(oss, "span", "", source);
    osc.appendChild(oss);
  }
  strip.appendChild(osc);

  wrapper.appendChild(strip);
  document.body.appendChild(wrapper);
  strip.dataset.batchWrapper = wrapper.dataset.batchId = "batch-export";
  return strip;
}

export function removeBatchOverlayElement(el: HTMLElement) {
  const wrapper = el.parentElement;
  if (wrapper?.parentElement === document.body) {
    document.body.removeChild(wrapper);
  }
}

export async function captureInfoboxItem(item: InfoboxItem): Promise<Blob> {
  const typography = resolveTypography(item);
  const el = createOverlayElement(item, typography);
  try {
    return await captureForExport(el, item.format, item.bgTheme, typography);
  } finally {
    removeBatchOverlayElement(el);
  }
}
