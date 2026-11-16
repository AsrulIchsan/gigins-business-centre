/**
 * GIGIN'S BUSINESS CENTRE — Activity & Login Logger
 * Records all significant user actions and login attempts for audit trail.
 */

import { prisma } from "@/lib/prisma";
import { appendLoginLog, appendActivityLog } from "@/lib/audit-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActivityModule =
  | "POS"
  | "PRODUCT"
  | "PURCHASE"
  | "STOCK"
  | "FINANCE"
  | "USER"
  | "CRM"
  | "SETTING";

export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VOID"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT";

export interface LogActivityParams {
  userId: string;
  userName?: string;
  userRole?: string;
  businessId?: string;
  businessName?: string;
  businessSlug?: string;
  accessId?: string;
  module: ActivityModule;
  action: ActivityAction;
  entityId?: string;
  entityName?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  description: string;
  ipAddress?: string;
}

export interface LogLoginParams {
  userId: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  businessId?: string;
  businessName?: string;
  businessSlug?: string;
  accessId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  status: "SUCCESS" | "FAILED";
  failReason?: string;
}

// ─── Fast Database Availability Cache ───────────────────────────────────────

let lastDbCheckTime = 0;
let isDbReachable = true;
const DB_CHECK_INTERVAL_MS = 60 * 1000; // Check DB at most once a minute if offline

async function checkDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (!isDbReachable && now - lastDbCheckTime < DB_CHECK_INTERVAL_MS) {
    return false;
  }
  lastDbCheckTime = now;
  try {
    const pingPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB ping timeout")), 400)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    isDbReachable = true;
    return true;
  } catch {
    isDbReachable = false;
    return false;
  }
}

// ─── Core Loggers ─────────────────────────────────────────────────────────────

/**
 * Log an activity / audit trail entry.
 * Call this after any significant create/update/delete/void operation.
 * Persists to disk storage and optionally syncs to Prisma PostgreSQL if available.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  // 1. Always persist to disk-backed audit storage
  try {
    await appendActivityLog({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      businessName: params.businessName,
      businessSlug: params.businessSlug,
      module: params.module,
      action: params.action,
      entityId: params.entityId,
      entityName: params.entityName,
      description: params.description,
      ipAddress: params.ipAddress,
      oldData: params.oldData,
      newData: params.newData,
    });
  } catch (err) {
    console.error("[AuditStorage] Failed to append activity log:", err);
  }

  // 2. Dual-write to Prisma if connected and user exists
  try {
    if (params.userId && params.userId !== "unknown") {
      const dbOnline = await checkDatabaseAvailable();
      if (!dbOnline) return;

      const userExists = await prisma.user
        .findUnique({
          where: { id: params.userId },
          select: { id: true },
        })
        .catch(() => null);

      if (userExists) {
        await prisma.activityLog.create({
          data: {
            userId: params.userId,
            businessId: params.businessId ?? null,
            accessId: params.accessId ?? null,
            module: params.module as any,
            action: params.action as any,
            entityId: params.entityId ?? null,
            entityName: params.entityName ?? null,
            oldData: (params.oldData as any) ?? undefined,
            newData: (params.newData as any) ?? undefined,
            description: params.description,
            ipAddress: params.ipAddress ?? null,
          },
        });
      }
    }
  } catch {
    // Database offline / fallback mode: disk storage is our source of truth
  }
}

/**
 * Log a login attempt (success or failure).
 * Call this from your auth API route on every login attempt from any device.
 * Persists to disk storage and optionally syncs to Prisma PostgreSQL if available.
 */
export async function logLogin(params: LogLoginParams): Promise<void> {
  // 1. Always persist to disk-backed audit storage
  try {
    await appendLoginLog({
      userId: params.userId,
      userName: params.userName || (params.userId === "unknown" ? "Pengguna Tak Dikenal" : params.userId),
      userEmail: params.userEmail || (params.userId.includes("@") ? params.userId : "-"),
      role: params.role || "STAFF",
      businessName: params.businessName || "Gigin's Business Centre",
      businessSlug: params.businessSlug || "all",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceInfo: params.deviceInfo,
      status: params.status,
      failReason: params.failReason,
    });
  } catch (err) {
    console.error("[AuditStorage] Failed to append login log:", err);
  }

  // 2. Dual-write to Prisma if connected and user exists
  try {
    if (params.userId && params.userId !== "unknown") {
      const dbOnline = await checkDatabaseAvailable();
      if (!dbOnline) return;

      const userExists = await prisma.user
        .findUnique({
          where: { id: params.userId },
          select: { id: true },
        })
        .catch(() => null);

      if (userExists) {
        await prisma.loginHistory.create({
          data: {
            userId: params.userId,
            businessId: params.businessId ?? null,
            accessId: params.accessId ?? null,
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            deviceInfo: params.deviceInfo ?? null,
            status: params.status as any,
            failReason: params.failReason ?? null,
          },
        });
      }
    }
  } catch {
    // Database offline / fallback mode: disk storage is our source of truth
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const activityLogger = {
  sale: {
    created: (
      userId: string,
      businessId: string,
      saleId: string,
      saleNumber: string,
      total: number,
      paymentDetails?: {
        paymentMethod?: string;
        paymentNote?: string;
        cashGiven?: number;
        roundingAmount?: number;
        change?: number;
      }
    ) =>
      logActivity({
        userId,
        businessId,
        module: "POS",
        action: "CREATE",
        entityId: saleId,
        entityName: saleNumber,
        newData: {
          total,
          ...paymentDetails,
        },
        description: `Transaksi POS baru: ${saleNumber} — Total Rp ${total.toLocaleString("id-ID")}${
          paymentDetails?.paymentMethod
            ? ` (${paymentDetails.paymentMethod}${paymentDetails.paymentNote ? `: ${paymentDetails.paymentNote}` : ""})`
            : ""
        }${
          paymentDetails?.roundingAmount && paymentDetails.roundingAmount > 0
            ? ` [Rounding Kembalian: +Rp ${paymentDetails.roundingAmount.toLocaleString("id-ID")}]`
            : ""
        }`,
      }),

    voided: (userId: string, businessId: string, saleId: string, saleNumber: string, reason: string) =>
      logActivity({
        userId,
        businessId,
        module: "POS",
        action: "VOID",
        entityId: saleId,
        entityName: saleNumber,
        description: `Transaksi POS ${saleNumber} di-void. Alasan: ${reason}`,
      }),
  },

  product: {
    created: (userId: string, businessId: string, productId: string, productName: string) =>
      logActivity({
        userId,
        businessId,
        module: "PRODUCT",
        action: "CREATE",
        entityId: productId,
        entityName: productName,
        description: `Produk baru ditambahkan: ${productName}`,
      }),

    updated: (
      userId: string,
      businessId: string,
      productId: string,
      productName: string,
      oldData: Record<string, unknown>,
      newData: Record<string, unknown>
    ) =>
      logActivity({
        userId,
        businessId,
        module: "PRODUCT",
        action: "UPDATE",
        entityId: productId,
        entityName: productName,
        oldData,
        newData,
        description: `Data produk "${productName}" diperbarui`,
      }),

    priceChanged: (
      userId: string,
      businessId: string,
      productId: string,
      productName: string,
      oldPrice: number,
      newPrice: number
    ) =>
      logActivity({
        userId,
        businessId,
        module: "PRODUCT",
        action: "UPDATE",
        entityId: productId,
        entityName: productName,
        oldData: { sellPrice: oldPrice },
        newData: { sellPrice: newPrice },
        description: `Harga jual "${productName}" diubah: Rp ${oldPrice.toLocaleString("id-ID")} → Rp ${newPrice.toLocaleString("id-ID")}`,
      }),

    deleted: (userId: string, businessId: string, productId: string, productName: string) =>
      logActivity({
        userId,
        businessId,
        module: "PRODUCT",
        action: "DELETE",
        entityId: productId,
        entityName: productName,
        description: `Produk "${productName}" dihapus dari sistem`,
      }),
  },

  purchase: {
    created: (userId: string, businessId: string, purchaseId: string, invoiceNumber: string, total: number) =>
      logActivity({
        userId,
        businessId,
        module: "PURCHASE",
        action: "CREATE",
        entityId: purchaseId,
        entityName: invoiceNumber,
        description: `Faktur pembelian baru: ${invoiceNumber} — Total Rp ${total.toLocaleString("id-ID")}`,
      }),
  },

  stock: {
    adjusted: (
      userId: string,
      businessId: string,
      productId: string,
      productName: string,
      oldStock: number,
      newStock: number,
      reason?: string
    ) =>
      logActivity({
        userId,
        businessId,
        module: "STOCK",
        action: "UPDATE",
        entityId: productId,
        entityName: productName,
        oldData: { totalStock: oldStock },
        newData: { totalStock: newStock },
        description: `Penyesuaian stok "${productName}" oleh Owner di POS: ${oldStock} → ${newStock}${reason ? ` (${reason})` : ""}`,
      }),

    opnameApproved: (userId: string, businessId: string, opnameId: string, opnameNumber: string) =>
      logActivity({
        userId,
        businessId,
        module: "STOCK",
        action: "APPROVE",
        entityId: opnameId,
        entityName: opnameNumber,
        description: `Stok opname ${opnameNumber} disetujui`,
      }),
  },

  user: {
    roleChanged: (
      actorId: string,
      businessId: string,
      targetUserId: string,
      targetName: string,
      oldRole: string,
      newRole: string
    ) =>
      logActivity({
        userId: actorId,
        businessId,
        module: "USER",
        action: "UPDATE",
        entityId: targetUserId,
        entityName: targetName,
        oldData: { role: oldRole },
        newData: { role: newRole },
        description: `Role "${targetName}" diubah: ${oldRole} → ${newRole}`,
      }),
  },
};
