import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "eckstein_session";

async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = cookieValue.slice(0, lastDot);
  const providedSig = cookieValue.slice(lastDot + 1);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const expectedSig = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  if (expectedSig.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const valid = await verifySession(cookie.value, secret);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buffer = await file.arrayBuffer();

  // Try R2 upload (Workers runtime); fall back to local-dev mode gracefully
  let url: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@opennextjs/cloudflare");
    const { env } = getRequestContext();
    const bucket = env.MEDIA as R2Bucket | undefined;
    if (bucket) {
      await bucket.put(key, buffer, { httpMetadata: { contentType: file.type } });
      // Public R2 URL — set R2_PUBLIC_URL in env to your bucket's public domain
      const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
      url = base ? `${base}/${key}` : `/api/media/${key}`;
    } else {
      // No bucket binding in local dev — use placeholder path
      url = `/api/media/${key}`;
    }
  } catch {
    // getRequestContext unavailable (local next dev) — use placeholder path
    url = `/api/media/${key}`;
  }

  return NextResponse.json({
    ok: true,
    key,
    url,
    filename: file.name,
    mime: file.type,
    sizeBytes: file.size,
  });
}
