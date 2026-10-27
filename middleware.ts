import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PAGE_PREFIXES = ["/me", "/onboarding"];
const ADMIN_PAGE_PREFIX = "/admin";
const SESSION_COOKIE = "gameindex-auth-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_PAGE_PREFIX)) {
    return handleAdmin(request);
  }

  if (!PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const headerToken = request.headers.get("authorization")?.toLowerCase().startsWith("bearer ");

  if (cookieToken || headerToken) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

async function handleAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Se verifica la firma HMAC: sin ella bastaría con fabricar un payload con isAdmin: true.
  const claims = await verifyTokenClaims(token);
  if (!claims || claims.isAdmin !== true || isExpired(claims.exp)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // El layout de /admin usa esta cabecera para volver a la página correcta tras el login.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function verifyTokenClaims(token: string): Promise<{ isAdmin?: boolean; exp?: number } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getAuthSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(encodedSignature),
      encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );
    if (!valid) return null;
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)));
  } catch {
    return null;
  }
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

// Debe coincidir con getAuthSecret() de services/auth.ts.
function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "gameindex-local-dev-secret";
}

function isExpired(exp: number | undefined) {
  if (typeof exp !== "number") return true;
  return exp < Math.floor(Date.now() / 1000);
}

export const config = {
  matcher: ["/me/:path*", "/onboarding/:path*", "/admin/:path*"]
};
