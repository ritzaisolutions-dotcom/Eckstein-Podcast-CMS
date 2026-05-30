/**
 * Apply performance indexes directly — use when drizzle-kit push hangs on introspection.
 * Run: pnpm db:push-indexes
 */
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

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS analytics_snapshots_content_id_idx ON analytics_snapshots (content_id)`,
  `CREATE INDEX IF NOT EXISTS analytics_snapshots_platform_id_idx ON analytics_snapshots (platform_id)`,
  `CREATE INDEX IF NOT EXISTS analytics_snapshots_content_platform_idx ON analytics_snapshots (content_id, platform_id)`,
  `CREATE INDEX IF NOT EXISTS content_pieces_type_status_idx ON content_pieces (type, status)`,
  `CREATE INDEX IF NOT EXISTS content_pieces_type_lifecycle_idx ON content_pieces (type, lifecycle_stage)`,
  `CREATE INDEX IF NOT EXISTS content_platform_links_scheduled_idx ON content_platform_links (scheduled_at)`,
  `CREATE INDEX IF NOT EXISTS content_platform_links_posted_idx ON content_platform_links (posted_at)`,
];

async function main() {
  let url = process.env.DATABASE_URL?.trim() ?? "";
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1);
  }
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    for (const stmt of INDEXES) {
      const name = stmt.match(/IF NOT EXISTS (\S+)/)?.[1] ?? stmt;
      process.stdout.write(`Applying ${name}… `);
      await sql.unsafe(stmt);
      console.log("ok");
    }
    console.log("\nAll indexes applied.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
