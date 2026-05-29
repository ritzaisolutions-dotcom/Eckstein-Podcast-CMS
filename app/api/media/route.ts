import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const COOKIE_NAME = "eckstein_session";

async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = cookieValue.slice(0, lastDot);
  const providedSig = cookieValue.slice(lastDot + 1);
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const expectedSig = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  if (expectedSig.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}

async function requireSession(req: NextRequest): Promise<NextResponse | null> {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  if (!await verifySession(cookie.value, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const db = getDb();
  const assets = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt)).limit(200);

  return NextResponse.json(assets.map(a => ({
    ...a,
    tags: JSON.parse(a.tags ?? "[]") as string[],
  })));
}

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const body = await req.json();
  const { filename, blobUrl, mime, sizeBytes, tags } = body as {
    filename?: string;
    blobUrl?: string;
    mime?: string;
    sizeBytes?: number;
    tags?: string[];
  };

  if (!filename || !blobUrl || !mime) {
    return NextResponse.json({ error: "filename, blobUrl, and mime required" }, { status: 400 });
  }

  const db = getDb();
  const [asset] = await db.insert(mediaAssets).values({
    filename,
    blobUrl,
    mime,
    sizeBytes: sizeBytes ?? null,
    tags: JSON.stringify(tags ?? []),
  }).returning();

  return NextResponse.json({
    ...asset,
    tags: JSON.parse(asset.tags ?? "[]") as string[],
  });
}
