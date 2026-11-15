/**
 * GIGIN'S BUSINESS CENTRE — RBAC Middleware Helpers
 * Server-side permission enforcement for Server Actions & API Routes.
 */

import { AuthSession, BusinessAccess, Permission, getBusinessAccess, hasPermission } from "@/lib/auth";

/**
 * Throws a 403 error if the user does not have the required permission.
 */
export function requirePermission(
  access: BusinessAccess | null | undefined,
  permission: Permission
): asserts access is BusinessAccess {
  if (!access || !hasPermission(access, permission)) {
    throw new Error(`403: Akses ditolak — izin '${permission}' diperlukan`);
  }
}

/**
 * Throws a 403 error if the user does not have access to the given business.
 * Returns the BusinessAccess record if access is granted.
 */
export function requireBusinessAccess(
  session: AuthSession | null,
  businessSlug: string
): BusinessAccess {
  if (!session) throw new Error("401: Silakan login terlebih dahulu");

  // OWNER has access to all businesses
  if (session.user.platformRole === "OWNER") {
    const access = getBusinessAccess(session, businessSlug);
    if (!access) {
      throw new Error(`403: Bisnis '${businessSlug}' tidak ditemukan dalam akses Anda`);
    }
    return access;
  }

  const access = getBusinessAccess(session, businessSlug);
  if (!access) {
    throw new Error(`403: Anda tidak memiliki akses ke bisnis ini`);
  }
  return access;
}

/**
 * Throws a 403 error if the user is not an OWNER.
 */
export function requireOwner(session: AuthSession | null): void {
  if (!session) throw new Error("401: Silakan login terlebih dahulu");
  if (session.user.platformRole !== "OWNER") {
    throw new Error("403: Hanya Owner yang dapat mengakses fitur ini");
  }
}

/**
 * Returns true if the user is an OWNER.
 */
export function isOwner(session: AuthSession | null): boolean {
  return session?.user.platformRole === "OWNER";
}
