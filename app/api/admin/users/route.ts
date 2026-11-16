/**
 * API /api/admin/users
 * Manage user accounts, business assignments, role templates, and granular permissions.
 * Persists changes to disk user storage and records every modification into ActivityLog for the audit trail.
 */

import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";
import {
  readStoredUsers,
  upsertStoredUser,
  toggleStoredUserStatus,
  deleteStoredUser,
} from "@/lib/user-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("businessSlug");

    let users = readStoredUsers();

    if (businessSlug && businessSlug !== "ALL" && businessSlug !== "all") {
      users = users.filter((u) =>
        u.assignedBusinesses.some((b) => b.slug === businessSlug || b.slug === "all")
      );
    }

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actorId = "usr-owner-gigin",
      actorName = "Gigin (Owner)",
      userId,
      name,
      email,
      phone,
      password,
      role = "KASIR",
      businessId = "biz-apotik-tamansari",
      businessSlug = "apotik-tamansari",
      permissions = [],
      assignedBusinesses,
      isActive = true,
      action = "SAVE_PERMISSIONS", // "CREATE" | "UPDATE" | "TOGGLE_STATUS" | "DELETE"
      oldData,
    } = body;

    let targetUser: any = null;
    let description = "";

    if (action === "DELETE") {
      deleteStoredUser(userId);
      description = `Akun pegawai "${name || userId}" dihapus permanen dari sistem oleh Owner`;
    } else if (action === "TOGGLE_STATUS") {
      targetUser = toggleStoredUserStatus(userId);
      const newStatus = targetUser ? (targetUser.isActive ? "AKTIF" : "NONAKTIF (DIBLOKIR)") : (isActive ? "AKTIF" : "NONAKTIF");
      description = `Status akun pegawai "${name || userId}" diubah menjadi: ${newStatus}`;
    } else {
      // CREATE or UPDATE
      if (!name) {
        return NextResponse.json({ success: false, message: "Nama pegawai wajib diisi" }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ success: false, message: "Email pegawai wajib diisi" }, { status: 400 });
      }

      targetUser = upsertStoredUser({
        id: userId,
        name,
        email,
        phone,
        password,
        role,
        isActive,
        assignedBusinesses,
      });

      if (action === "CREATE") {
        description = `Akun pegawai baru dibuat: "${name}" (${email}) dengan role ${role}`;
      } else {
        description = `Data akun & hak akses pegawai "${name}" diperbarui (Password aktif diperbarui)`;
      }
    }

    // Audit trail logging
    await logActivity({
      userId: actorId,
      userName: actorName,
      userRole: "OWNER",
      businessId,
      businessName: "Gigin's Business Centre",
      businessSlug: businessSlug || "all",
      module: "USER",
      action: action === "DELETE" ? "DELETE" : action === "CREATE" ? "CREATE" : "UPDATE",
      entityId: userId || targetUser?.id || "USR",
      entityName: name || targetUser?.name || "Pegawai",
      oldData: oldData ?? null,
      newData: targetUser
        ? {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            isActive: targetUser.isActive,
            assignedBusinesses: targetUser.assignedBusinesses,
          }
        : null,
      description,
    }).catch((err) => console.error("Failed to log user activity:", err));

    return NextResponse.json({
      success: true,
      message: description,
      data: targetUser,
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
