/**
 * GIGIN'S BUSINESS CENTRE — Real Database & JWT Auth System
 * Database-backed session management, RBAC, and secure HTTP-Only cookies.
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BusinessRole = "OWNER" | "MANAGER" | "KASIR";

export type Permission =
  | "can_void_sale"
  | "can_edit_price"
  | "can_view_hpp"
  | "can_stock_opname"
  | "can_approve_return"
  | "can_manage_users"
  | "can_view_reports"
  | "can_view_finance"
  | "can_delete_product"
  | "can_edit_purchase"
  | "can_approve_opname"
  | "can_manage_promo"
  | "can_export_data";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  platformRole: "OWNER" | "ADMIN" | "APOTEKER" | "TTK" | "KASIR" | "MANAJER";
  isActive: boolean;
}

export interface BusinessAccess {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessType: "PHARMACY" | "RETAIL_TOYS";
  role: BusinessRole;
  permissions: Permission[];
}

export interface AuthSession {
  user: SessionUser;
  businessAccesses: BusinessAccess[];
  currentBusinessSlug?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  platformRole: "OWNER" | "ADMIN" | "APOTEKER" | "TTK" | "KASIR" | "MANAJER";
  isActive: boolean;
  businessAccesses: BusinessAccess[];
}

// ─── JWT Configuration ────────────────────────────────────────────────────────

const JWT_SECRET_STRING = process.env.NEXTAUTH_SECRET || "tamansari-pharmacy-super-secret-key-2026-gigin";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Sign JWT session token with expiration (7 days).
 */
export async function signSessionToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT session token.
 */
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ─── Default permissions per role ────────────────────────────────────────────

export const DEFAULT_PERMISSIONS: Record<BusinessRole, Permission[]> = {
  OWNER: [
    "can_void_sale",
    "can_edit_price",
    "can_view_hpp",
    "can_stock_opname",
    "can_approve_return",
    "can_manage_users",
    "can_view_reports",
    "can_view_finance",
    "can_delete_product",
    "can_edit_purchase",
    "can_approve_opname",
    "can_manage_promo",
    "can_export_data",
  ],
  MANAGER: [
    "can_void_sale",
    "can_edit_price",
    "can_view_hpp",
    "can_stock_opname",
    "can_approve_return",
    "can_view_reports",
    "can_view_finance",
    "can_edit_purchase",
    "can_approve_opname",
    "can_manage_promo",
  ],
  KASIR: [
    "can_stock_opname",
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a user has a specific permission on a business.
 */
export function hasPermission(
  access: BusinessAccess | null | undefined,
  permission: Permission
): boolean {
  if (!access) return false;
  const perms =
    access.permissions && access.permissions.length > 0
      ? access.permissions
      : DEFAULT_PERMISSIONS[access.role] ?? [];
  return perms.includes(permission);
}

/**
 * Get the access record for a specific business slug.
 */
export function getBusinessAccess(
  session: AuthSession | null,
  businessSlug: string
): BusinessAccess | null {
  if (!session) return null;
  return (
    session.businessAccesses.find((a) => a.businessSlug === businessSlug) ??
    null
  );
}

/**
 * Check if a user can access a given business.
 * OWNER can access any business; others must be explicitly assigned.
 */
export function canAccessBusiness(
  session: AuthSession | null,
  businessSlug: string
): boolean {
  if (!session) return false;
  if (session.user.platformRole === "OWNER") return true;
  return session.businessAccesses.some((a) => a.businessSlug === businessSlug);
}

/**
 * Returns the redirect path after login based on role.
 * OWNER → /hub
 * MANAGER → /b/[slug]/dashboard
 * KASIR → /b/[slug]/pos
 */
export function getPostLoginRedirect(session: AuthSession): string {
  if (session.user.platformRole === "OWNER") return "/hub";
  const first = session.businessAccesses[0];
  if (!first) return "/login";
  if (first.role === "MANAGER") return `/b/${first.businessSlug}/dashboard`;
  return `/b/${first.businessSlug}/pos`;
}

// ─── Real Session Resolver (Server-Side) ──────────────────────────────────────

/**
 * Reads HTTP-Only cookie `session_token` and verifies JWT cryptographically.
 * Returns null if token is missing, invalid, expired, or user is inactive.
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.isActive) return null;

    return {
      user: {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        platformRole: payload.platformRole,
        isActive: payload.isActive,
      },
      businessAccesses: payload.businessAccesses,
    };
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[Auth] getSession error:", err);
    return null;
  }
}

// ─── Fallback Seeded Users (Digunakan saat PostgreSQL offline) ────────────────
const BCRYPT_ADMIN123 = bcrypt.hashSync("admin123", 10);
const BCRYPT_KASIR123 = bcrypt.hashSync("kasir123", 10);
const BCRYPT_NURUL123 = bcrypt.hashSync("nurul123", 10);
const BCRYPT_BUDI123 = bcrypt.hashSync("budi123", 10);
const BCRYPT_AHMAD123 = bcrypt.hashSync("ahmad123", 10);
const BCRYPT_DEWI123 = bcrypt.hashSync("dewi123", 10);

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  role: "OWNER" | "ADMIN" | "APOTEKER" | "TTK" | "KASIR" | "MANAJER";
  isActive: boolean;
  businessAccesses: BusinessAccess[];
}

export const FALLBACK_USERS: Record<string, FallbackUser> = {
  // 1. Owner (Gigin) - Password: admin123
  "admin@apotiktamansari.com": {
    id: "usr-owner-gigin",
    name: "Gigin",
    email: "admin@apotiktamansari.com",
    hashedPassword: BCRYPT_ADMIN123,
    role: "OWNER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
    ],
  },
  "owner@gigin.com": {
    id: "usr-owner-gigin",
    name: "Gigin",
    email: "owner@gigin.com",
    hashedPassword: BCRYPT_ADMIN123,
    role: "OWNER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
    ],
  },
  "owner@apotiktamansari.com": {
    id: "usr-owner-gigin",
    name: "Gigin",
    email: "owner@apotiktamansari.com",
    hashedPassword: BCRYPT_ADMIN123,
    role: "OWNER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "OWNER",
        permissions: DEFAULT_PERMISSIONS.OWNER,
      },
    ],
  },

  // 2. Apoteker / Manajer Apotik Tamansari (apt. Nurul Aulia) - Password: nurul123
  "nurul.aulia@apotiktamansari.com": {
    id: "usr-01",
    name: "apt. Nurul Aulia, S.Farm",
    email: "nurul.aulia@apotiktamansari.com",
    hashedPassword: BCRYPT_NURUL123,
    role: "MANAJER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS.MANAGER,
      },
    ],
  },

  // 3. Kasir Apotik Tamansari (Siti Rahma) - Password: kasir123
  "kasir@apotiktamansari.com": {
    id: "usr-02",
    name: "Siti Rahma, A.Md.Farm",
    email: "kasir@apotiktamansari.com",
    hashedPassword: BCRYPT_KASIR123,
    role: "KASIR",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
  },
  "kasir.apotik@gigin.com": {
    id: "usr-02",
    name: "Siti Rahma, A.Md.Farm",
    email: "kasir.apotik@gigin.com",
    hashedPassword: BCRYPT_KASIR123,
    role: "KASIR",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
  },

  // 4. Manajer Toko Mainan (Budi Santoso) - Password: budi123
  "budi@pasarlelea.com": {
    id: "usr-03",
    name: "Budi Santoso",
    email: "budi@pasarlelea.com",
    hashedPassword: BCRYPT_BUDI123,
    role: "MANAJER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS.MANAGER,
      },
    ],
  },
  "kasir.mainan@gigin.com": {
    id: "usr-03",
    name: "Budi Santoso",
    email: "kasir.mainan@gigin.com",
    hashedPassword: BCRYPT_BUDI123,
    role: "MANAJER",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "MANAGER",
        permissions: DEFAULT_PERMISSIONS.MANAGER,
      },
    ],
  },

  // 5. Kasir Toko Mainan (Ahmad Fauzi) - Password: ahmad123 (NONAKTIF/DIBLOKIR)
  "ahmad@pasarlelea.com": {
    id: "usr-04",
    name: "Ahmad Fauzi",
    email: "ahmad@pasarlelea.com",
    hashedPassword: BCRYPT_AHMAD123,
    role: "KASIR",
    isActive: false,
    businessAccesses: [
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
  },

  // 6. Kasir Multi-Cabang (Dewi Lestari) - Password: dewi123
  "dewi.multicabang@gigins.com": {
    id: "usr-05",
    name: "Dewi Lestari",
    email: "dewi.multicabang@gigins.com",
    hashedPassword: BCRYPT_DEWI123,
    role: "KASIR",
    isActive: true,
    businessAccesses: [
      {
        businessId: "biz-apotik-tamansari",
        businessSlug: "apotik-tamansari",
        businessName: "Apotik Tamansari",
        businessType: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
      {
        businessId: "biz-toko-mainan-lelea",
        businessSlug: "toko-mainan-pasar-lelea",
        businessName: "Toko Mainan Pasar Lelea",
        businessType: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
  },
};
