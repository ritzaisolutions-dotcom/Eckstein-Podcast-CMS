import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionCookie, sessionSecret } from "@/lib/require-session";

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon", "/design-preview"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE);
  const isApi = pathname.startsWith("/api/");

  if (!cookie?.value) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await verifySessionCookie(cookie.value, sessionSecret());
  if (!valid) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)"],
};
