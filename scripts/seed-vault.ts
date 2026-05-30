import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { ensureVaultPlatformSeeds } from "../lib/vault-seed";

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
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  const inserted = await ensureVaultPlatformSeeds();
  console.log(inserted > 0 ? `Seeded ${inserted} vault platform entries.` : "Vault platform seeds already present.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
