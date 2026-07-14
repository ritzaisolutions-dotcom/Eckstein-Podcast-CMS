"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import JSZip from "jszip";
import PageHeader from "@/components/ui/PageHeader";
import {
  type InfoboxType,
  type InfoboxFormat,
  type InfoboxBg,
  type InfoboxTypography,
  type InfoboxItem,
  type InfoboxPreset,
  TYPE_LABELS,
  DEFAULT_TYPOGRAPHY,
  themeTypographyColors,
  typographyCssVars,
  resolveTypography,
  captureForExport,
  captureInfoboxItem,
  downloadBlob,
} from "@/lib/infobox-export";
import { INFOBOX_PRESETS } from "@/lib/presets/index";
import "./infobox-generator.css";

type AnimClass = "ov-a-up" | "ov-a-lft" | null;

const TYPES: InfoboxType[] = ["DEFINITION", "STUDIE", "ZITAT", "INFO", "LINK", "FAKT"];

const TYPE_SHORT: Record<InfoboxType, string> = {
  DEFINITION: "Defin.",
  STUDIE: "Studie",
  ZITAT: "Zitat",
  INFO: "Info",
  LINK: "Link",
  FAKT: "Fakt",
};

function applyItemToForm(item: InfoboxItem, setters: {
  setType: (t: InfoboxType) => void;
  setFormat: (f: InfoboxFormat) => void;
  setBgTheme: (b: InfoboxBg) => void;
  setHeadline: (h: string) => void;
  setDescription: (d: string) => void;
  setSource: (s: string) => void;
  setCustomTypeLabel: (l: string | null) => void;
  setTypography: (t: InfoboxTypography) => void;
}) {
  setters.setType(item.type);
  setters.setFormat(item.format);
  setters.setBgTheme(item.bgTheme);
  setters.setHeadline(item.headline);
  setters.setDescription(item.description);
  setters.setSource(item.source);
  setters.setCustomTypeLabel(item.customTypeLabel ?? null);
  setters.setTypography(resolveTypography(item));
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

  const [activePreset, setActivePreset] = useState<InfoboxPreset | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const exportPreviewRef = useRef<string | null>(null);

  const displayTypeLabel = customTypeLabel ?? TYPE_LABELS[type];
  const themeClass = bgTheme === "navy" ? "ov-theme-navy" : "ov-theme-cream";
  const displayHeadline = headline.trim() || "Begriff eingeben";
  const hasDescription = description.trim().length > 0;
  const hasSource = source.trim().length > 0;
  const overlayStyle = typographyCssVars(typography);

  const formSetters = {
    setType,
    setFormat,
    setBgTheme,
    setHeadline,
    setDescription,
    setSource,
    setCustomTypeLabel,
    setTypography,
  };

  useEffect(() => {
    return () => {
      if (exportPreviewRef.current) URL.revokeObjectURL(exportPreviewRef.current);
    };
  }, []);

  const handleTypeChange = useCallback((t: InfoboxType) => {
    setType(t);
    setCustomTypeLabel(null);
    setActivePreset(null);
    setSelectedBatchId(null);
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

  const loadPreset = useCallback((preset: InfoboxPreset) => {
    setActivePreset(preset);
    const first = preset.items[0];
    if (first) {
      applyItemToForm(first, formSetters);
      setSelectedBatchId(first.id);
    }
  }, [formSetters]);

  const selectBatchItem = useCallback((item: InfoboxItem) => {
    applyItemToForm(item, formSetters);
    setSelectedBatchId(item.id);
  }, [formSetters]);

  const handleBatchExport = useCallback(async () => {
    if (!activePreset) return;

    setBatchExporting(true);
    setBatchProgress(null);
    setExportFeedback(null);

    try {
      const zip = new JSZip();
      const total = activePreset.items.length;

      for (let i = 0; i < total; i++) {
        const item = activePreset.items[i];
        setBatchProgress(`${i + 1} / ${total}`);
        const blob = await captureInfoboxItem(item);
        zip.file(item.exportFilename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, activePreset.zipFilename);
      setBatchProgress(`✓ ${total} exportiert`);
      setTimeout(() => setBatchProgress(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Batch-Export fehlgeschlagen";
      setExportFeedback(msg);
      setBatchProgress(null);
    } finally {
      setBatchExporting(false);
    }
  }, [activePreset]);

  const exportActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting || batchExporting}
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
              <label>Serie</label>
              {INFOBOX_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className={`ov-fb${activePreset?.id === preset.id ? " on" : ""}`}
                  style={{ width: "100%", marginBottom: 4 }}
                  onClick={() => loadPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
              {activePreset && (
                <>
                  <div className="ov-batch-list">
                    {activePreset.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`ov-batch-item${selectedBatchId === item.id ? " on" : ""}`}
                        onClick={() => selectBatchItem(item)}
                      >
                        <span className="ov-batch-item-ref">{item.headline}</span>
                        <span className="ov-batch-item-preview">{item.description}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    id="ov-batchB"
                    type="button"
                    onClick={handleBatchExport}
                    disabled={batchExporting || exporting}
                  >
                    {batchExporting ? "Exportiere Serie …" : "Alle exportieren (ZIP)"}
                  </button>
                  {batchProgress && <div className="ov-batch-progress">{batchProgress}</div>}
                </>
              )}
            </div>

            <div className="ov-sep" />

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
                onChange={e => {
                  setHeadline(e.target.value);
                  setActivePreset(null);
                  setSelectedBatchId(null);
                }}
                placeholder="z.B. Gerechtigkeit"
              />
            </div>

            <div className="ov-cg">
              <label>Beschreibung</label>
              <textarea
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setActivePreset(null);
                  setSelectedBatchId(null);
                }}
                placeholder="Definition, Kernaussage, Zitat…"
              />
            </div>

            <div className="ov-cg">
              <label>Quelle</label>
              <input
                type="text"
                value={source}
                onChange={e => {
                  setSource(e.target.value);
                  setActivePreset(null);
                  setSelectedBatchId(null);
                }}
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
              disabled={exporting || batchExporting}
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
