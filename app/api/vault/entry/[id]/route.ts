import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, vaultEntries, vaultAuditLog } from "@/lib/db";

const COOKIE_NAME = "eckstein_session";
const STALE_DAYS = 180;

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

async function auth(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return false;
  return verifySession(cookie.value, process.env.SESSION_SECRET ?? "dev-secret-change-me");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const rows = await db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const e = rows[0];
  await db.insert(vaultAuditLog).values({ entryId: e.id, action: "view" });
  const staleMs = STALE_DAYS * 86_400_000;
  const stale = e.lastRotatedAt ? (Date.now() - new Date(e.lastRotatedAt).getTime()) > staleMs : false;
  return NextResponse.json({
    id: e.id, title: e.title, category: e.category, loginUrl: e.loginUrl,
    username: e.username, email: e.email,
    quickLinks: (() => { try { return JSON.parse(e.quickLinks ?? "[]"); } catch { return []; } })(),
    tags: (() => { try { return JSON.parse(e.tags ?? "[]"); } catch { return []; } })(),
    lastRotatedAt: e.lastRotatedAt ? new Date(e.lastRotatedAt).toISOString() : undefined,
    stale, hasPassword: !!e.passwordEnc, hasRecoveryCodes: !!e.recoveryCodesEnc,
    hasApiTokens: !!e.apiTokensEnc, hasNotes: !!e.notesEnc,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  await db.insert(vaultAuditLog).values({ entryId: id, action: "delete" });
  await db.delete(vaultEntries).where(eq(vaultEntries.id, id));
  return NextResponse.json({ ok: true });
}
