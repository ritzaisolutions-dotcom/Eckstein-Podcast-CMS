import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { decryptPacked } from "@/lib/crypto";
import { getDb, vaultEntries, vaultAuditLog } from "@/lib/db";

const COOKIE_NAME = "eckstein_session";

async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = cookieValue.slice(0, lastDot);
  const providedSig = cookieValue.slice(lastDot + 1);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const expectedSig = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
  if (expectedSig.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  return diff === 0;
}

function base64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await verifySession(cookie.value, process.env.SESSION_SECRET ?? "dev-secret-change-me")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const masterKey = process.env.VAULT_MASTER_KEY;
  if (!masterKey) return NextResponse.json({ error: "VAULT_MASTER_KEY not configured" }, { status: 500 });

  const body = await req.json() as { id: string; field: string };
  const ALLOWED = ["password", "recoveryCodes", "apiTokens", "notes"] as const;
  type Field = typeof ALLOWED[number];
  if (!ALLOWED.includes(body.field as Field)) return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  const field = body.field as Field;

  const db = getDb();
  const rows = await db.select().from(vaultEntries).where(eq(vaultEntries.id, body.id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const entry = rows[0];

  const raw = { password: entry.passwordEnc, recoveryCodes: entry.recoveryCodesEnc, apiTokens: entry.apiTokensEnc, notes: entry.notesEnc }[field];
  if (!raw) return NextResponse.json({ value: null });

  try {
    const plaintext = await decryptPacked(base64ToU8(raw), masterKey);
    await db.insert(vaultAuditLog).values({ entryId: body.id, action: "reveal" });
    return NextResponse.json({ value: plaintext });
  } catch {
    return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
  }
}
