/**
 * GIGIN'S BUSINESS CENTRE — Next.js Route Protection Middleware
 * Memastikan proteksi ketat tanpa bypass mock session:
 * 1. Tanpa session token valid -> redirect ke /login
 * 2. Role OWNER -> akses bebas ke /hub dan seluruh unit bisnis
 * 3. Role MANAGER & KASIR -> terisolasi pada bisnis yang ditugaskan, dilarang masuk /hub
 * 4. User sudah login membuka /login -> redirect otomatis ke dashboard masing-masing
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const JWT_SECRET_STRING = process.env.NEXTAUTH_SECRET || "tamansari-pharmacy-super-secret-key-2026-gigin";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  platformRole: string;
  isActive: boolean;
  businessAccesses: {
    businessId: string;
    businessSlug: string;
    role: string;
  }[];
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Public endpoints and static assets
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/store",
  "/webstore",
  "/api/store",
];

function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)$/) !== null
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  // Subdomain Webstore Handling (e.g. store.apotiktamansari.com, webstore.apotiktamansari.com, store.localhost:3000)
  const host = request.headers.get("host") || "";
  const isStoreSubdomain =
    host.startsWith("store.") ||
    host.startsWith("webstore.") ||
    host.startsWith("shop.");

  if (isStoreSubdomain) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/store", request.url));
    }
    // Keamanan & Isolasi: Cegah kebocoran sistem internal staf dari subdomain webstore
    const INTERNAL_PREFIXES = ["/pos", "/online-orders", "/hub", "/b/", "/pembelian", "/inventory", "/master", "/akuntansi", "/crm", "/laporan"];
    if (INTERNAL_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/store", request.url));
    }
    if (!pathname.startsWith("/store") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      return NextResponse.rewrite(new URL(`/store${pathname}`, request.url));
    }
  }

  // Alias /webstore -> rewrite ke /store
  if (pathname === "/webstore" || pathname.startsWith("/webstore/")) {
    const target = pathname.replace(/^\/webstore/, "/store");
    return NextResponse.rewrite(new URL(target, request.url));
  }

  const sessionToken = request.cookies.get("session_token")?.value;
  const payload = sessionToken ? await verifyToken(sessionToken) : null;

  // 1. Jika pengguna membuka halaman /login
  if (pathname === "/login") {
    if (payload && payload.isActive) {
      // User sudah punya session valid -> redirect sesuai role
      if (payload.platformRole === "OWNER") {
        return NextResponse.redirect(new URL("/hub", request.url));
      }
      const firstAccess = payload.businessAccesses[0];
      const targetSlug = firstAccess?.businessSlug || "apotik-tamansari";
      const targetUrl =
        firstAccess?.role === "KASIR"
          ? `/b/${targetSlug}/pos`
          : `/b/${targetSlug}/dashboard`;
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    return NextResponse.next();
  }

  // Izinkan public API auth routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Proteksi Halaman: Jika belum login atau token kadaluarsa -> Lempar ke /login
  if (!payload || !payload.isActive) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    // Bersihkan cookie kadaluarsa jika ada
    if (sessionToken) {
      response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("user_profile", "", { maxAge: 0, path: "/" });
    }
    return response;
  }

  // 3. Routing Root "/" -> Redirect sesuai role
  if (pathname === "/") {
    if (payload.platformRole === "OWNER") {
      return NextResponse.redirect(new URL("/hub", request.url));
    }
    const firstAccess = payload.businessAccesses[0];
    const targetSlug = firstAccess?.businessSlug || "apotik-tamansari";
    const targetUrl =
      firstAccess?.role === "KASIR"
        ? `/b/${targetSlug}/pos`
        : `/b/${targetSlug}/dashboard`;
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // 4. Proteksi Portal Owner (/hub) — HANYA UNTUK ROLE OWNER
  if (pathname.startsWith("/hub")) {
    if (payload.platformRole !== "OWNER") {
      // Non-owner mencoba membuka /hub -> Lempar ke halaman bisnisnya
      const firstAccess = payload.businessAccesses[0];
      const targetSlug = firstAccess?.businessSlug || "apotik-tamansari";
      const targetUrl =
        firstAccess?.role === "KASIR"
          ? `/b/${targetSlug}/pos`
          : `/b/${targetSlug}/dashboard`;
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    return NextResponse.next();
  }

  // 5. Proteksi Rute Multi-Bisnis (/b/[businessSlug]/*)
  if (pathname.startsWith("/b/")) {
    const segments = pathname.split("/");
    const slug = segments[2];

    // OWNER bebas mengakses semua unit bisnis
    if (payload.platformRole === "OWNER") {
      return NextResponse.next();
    }

    // Kasir / Manajer wajib memiliki hak akses ke slug bisnis ini
    const hasAccess = payload.businessAccesses.some((a) => a.businessSlug === slug);

    if (!hasAccess) {
      // Tolak akses jika membuka bisnis yang bukan tugasnya
      const assignedAccess = payload.businessAccesses[0];
      if (assignedAccess) {
        const fallbackUrl =
          assignedAccess.role === "KASIR"
            ? `/b/${assignedAccess.businessSlug}/pos`
            : `/b/${assignedAccess.businessSlug}/dashboard`;
        return NextResponse.redirect(new URL(fallbackUrl, request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
