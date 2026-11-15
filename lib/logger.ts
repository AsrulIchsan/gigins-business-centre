/**
 * GIGIN'S BUSINESS CENTRE — Activity & Login Logger
 * Records all significant user actions and login attempts for audit trail.
 */

import { prisma } from "@/lib/prisma";

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
  businessId?: string;
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
  businessId?: string;
  accessId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  status: "SUCCESS" | "FAILED";
  failReason?: string;
}

// ─── Core Loggers ─────────────────────────────────────────────────────────────

/**
 * Log an activity / audit trail entry.
 * Call this after any significant create/update/delete/void operation.
 *
 * @example
 * await logActivity({
 *   userId: session.user.id,
 *   businessId: "biz-xxx",
 *   module: "PRODUCT",
 *   action: "UPDATE",
 *   entityId: product.id,
 *   entityName: product.name,
 *   oldData: { sellPrice: 5000 },
 *   newData: { sellPrice: 5500 },
 *   description: `Harga jual ${product.name} diubah dari Rp 5.000 → Rp 5.500`,
 * });
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
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
  } catch (err) {
    // Never let logging failure crash main flow
    console.error("[ActivityLog] Failed to write log:", err);
  }
}

/**
 * Log a login attempt (success or failure).
 * Call this from your auth API route on every login attempt.
 */
export async function logLogin(params: LogLoginParams): Promise<void> {
  try {
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
  } catch (err) {
    console.error("[LoginHistory] Failed to write login log:", err);
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
