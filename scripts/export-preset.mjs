/**
 * Batch export via Playwright: loads /infobox, triggers ZIP download, saves to exports/.
 * Usage: node scripts/export-preset.mjs [preset-label] [output-dir]
 * Requires: pnpm dev running, playwright chromium installed.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRESET_LABEL = process.argv[2] ?? "Ep.9 — Bibelverse (20 Einblendungen)";
const OUT_DIR = process.argv[3]
  ? join(process.cwd(), process.argv[3])
  : join(__dirname, "..", "exports", "ep9-bibelverse");
const ZIP_NAME = process.argv[4] ?? "eckstein-ep9-bibelverse.zip";

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const PORT = process.env.PORT ?? "3001";
const BASE = `http://localhost:${PORT}`;

await page.goto(`${BASE}/infobox`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForFunction(() => document.fonts.ready);
await page.waitForTimeout(1500);

await page.getByRole("button", { name: PRESET_LABEL }).click();
await page.waitForTimeout(300);

const downloadPromise = page.waitForEvent("download", { timeout: 300_000 });
await page.click("#ov-batchB");
const download = await downloadPromise;
const zipPath = join(OUT_DIR, ZIP_NAME);
await download.saveAs(zipPath);

console.log(`Exported: ${zipPath}`);
await browser.close();
