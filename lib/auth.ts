import { cookies } from "next/headers";

const COOKIE_NAME = "eckstein_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function getSecret(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signValue(value: string): Promise<string> {
  const key = await getSecret();
  const data = new TextEncoder().encode(value);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${value}.${sigHex}`;
}

async function verifyValue(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = await signValue(value);
  if (expected !== signed) return null;
  return value;
}

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomUUID();
  return signValue(sessionId);
}

export async function getSession(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyValue(raw);
}

export async function setSessionCookie(value: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function verifyPassword(input: string): Promise<boolean> {
  return input === process.env.ADMIN_PASSWORD;
}
