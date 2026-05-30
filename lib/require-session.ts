import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "eckstein_session";

export async function verifySessionCookie(cookieValue: string, secret: string): Promise<boolean> {
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

export function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret-change-me";
}

/** Returns a 401 response if unauthenticated, otherwise null. */
export async function requireSession(req: NextRequest): Promise<NextResponse | null> {
  const cookie = req.cookies.get(SESSION_COOKIE);
  if (!cookie?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!await verifySessionCookie(cookie.value, sessionSecret())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
