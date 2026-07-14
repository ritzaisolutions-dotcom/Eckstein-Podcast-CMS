/**
 * One-off batch export: loads /infobox, triggers ZIP download, saves to exports/.
 * Requires: pnpm dev running on :3000, playwright chromium installed.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "exports", "1-korinther-13");
const ZIP_NAME = "eckstein-1kor13-strips.zip";

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const PORT = process.env.PORT ?? "3001";
const BASE = `http://localhost:${PORT}`;

await page.goto(`${BASE}/infobox`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForFunction(() => document.fonts.ready);
await page.waitForTimeout(1500);

await page.getByRole("button", { name: "1. Korinther 13 (9 Einblendungen)" }).click();
await page.waitForTimeout(300);

const downloadPromise = page.waitForEvent("download", { timeout: 180_000 });
await page.click("#ov-batchB");
const download = await downloadPromise;
const zipPath = join(OUT_DIR, ZIP_NAME);
await download.saveAs(zipPath);

console.log(`Exported: ${zipPath}`);
await browser.close();
