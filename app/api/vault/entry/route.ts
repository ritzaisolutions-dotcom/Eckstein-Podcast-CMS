import { NextRequest, NextResponse } from "next/server";
import { encryptPacked } from "@/lib/crypto";
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

function u8ToBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await verifySession(cookie.value, process.env.SESSION_SECRET ?? "dev-secret-change-me")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const masterKey = process.env.VAULT_MASTER_KEY;
  if (!masterKey) return NextResponse.json({ error: "VAULT_MASTER_KEY not configured" }, { status: 500 });

  const body = await req.json() as Record<string, string>;

  const enc = async (value: string | undefined): Promise<string | undefined> => {
    if (!value?.trim()) return undefined;
    const packed = await encryptPacked(value, masterKey);
    return u8ToBase64(packed);
  };

  let quickLinks: Array<{ label: string; url: string }> = [];
  try { if (body.quickLinks?.trim()) quickLinks = JSON.parse(body.quickLinks); } catch { /* ignore */ }
  const tags = (body.tags ?? "").split(",").map(s => s.trim()).filter(Boolean);

  const db = getDb();
  const [inserted] = await db.insert(vaultEntries).values({
    title: body.title,
    category: body.category ?? "misc",
    loginUrl: body.loginUrl || undefined,
    username: body.username || undefined,
    email: body.email || undefined,
    passwordEnc: await enc(body.password),
    recoveryCodesEnc: await enc(body.recoveryCodes),
    apiTokensEnc: await enc(body.apiTokens),
    notesEnc: await enc(body.notes),
    quickLinks: JSON.stringify(quickLinks),
    tags: JSON.stringify(tags),
  }).returning({ id: vaultEntries.id });

  await db.insert(vaultAuditLog).values({ entryId: inserted.id, action: "create" });
  return NextResponse.json({ ok: true, id: inserted.id });
}
