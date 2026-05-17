import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "eckstein_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function hmacSign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-change-me";

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();
  const sig = await hmacSign(sessionId, sessionSecret);
  const cookieValue = `${sessionId}.${sig}`;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
