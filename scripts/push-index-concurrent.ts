/** Create the latest-snapshot index without blocking writes. Run: pnpm db:push-indexes-concurrent */
import postgres from "postgres";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function main() {
  let url = process.env.DATABASE_URL?.trim() ?? "";
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1);
  }
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 30 });
  try {
    console.log("Creating analytics_snapshots_latest_idx CONCURRENTLY (may take a few minutes)…");
    await sql.unsafe(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_snapshots_latest_idx
      ON analytics_snapshots (content_id, platform_id, captured_at DESC)
    `);
    console.log("Done.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
