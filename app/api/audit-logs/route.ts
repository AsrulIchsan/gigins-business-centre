import { NextRequest, NextResponse } from "next/server";
import {
  readLoginLogs,
  readActivityLogs,
  appendLoginLog,
  appendActivityLog,
  getAuditStats,
} from "@/lib/audit-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "login" | "activity" | "all"
    const businessSlug = searchParams.get("businessSlug") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const moduleFilter = searchParams.get("module") || "ALL";
    const actionFilter = searchParams.get("action") || "ALL";
    const userFilter = searchParams.get("user") || "ALL";
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);

    const [allLoginLogs, allActivityLogs, stats] = await Promise.all([
      readLoginLogs(),
      readActivityLogs(),
      getAuditStats(),
    ]);

    // 1. Filter Login Logs
    let filteredLogins = allLoginLogs;
    if (type === "all" || type === "login") {
      filteredLogins = allLoginLogs.filter((log) => {
        if (businessSlug !== "ALL" && log.businessSlug !== businessSlug) return false;
        if (status !== "ALL" && log.status !== status) return false;
        if (search) {
          const match =
            log.userName.toLowerCase().includes(search) ||
            log.userEmail.toLowerCase().includes(search) ||
            log.ipAddress.toLowerCase().includes(search) ||
            log.device.toLowerCase().includes(search) ||
            (log.failReason && log.failReason.toLowerCase().includes(search));
          if (!match) return false;
        }
        return true;
      });

      if (limitParam > 0) {
        filteredLogins = filteredLogins.slice(0, limitParam);
      }
    } else {
      filteredLogins = [];
    }

    // 2. Filter Activity Logs
    let filteredActivities = allActivityLogs;
    if (type === "all" || type === "activity") {
      filteredActivities = allActivityLogs.filter((act) => {
        if (businessSlug !== "ALL" && act.businessSlug !== businessSlug) return false;
        if (moduleFilter !== "ALL" && act.module !== moduleFilter) return false;
        if (actionFilter !== "ALL" && act.action !== actionFilter) return false;
        if (userFilter !== "ALL" && act.userName !== userFilter) return false;
        if (search) {
          const match =
            act.userName.toLowerCase().includes(search) ||
            act.description.toLowerCase().includes(search) ||
            act.entityName.toLowerCase().includes(search) ||
            act.entityId.toLowerCase().includes(search) ||
            act.ipAddress.toLowerCase().includes(search);
          if (!match) return false;
        }
        return true;
      });

      if (limitParam > 0) {
        filteredActivities = filteredActivities.slice(0, limitParam);
      }
    } else {
      filteredActivities = [];
    }

    return NextResponse.json({
      success: true,
      stats,
      loginLogs: filteredLogins,
      activityLogs: filteredActivities,
    });
  } catch (err: any) {
    console.error("[API AuditLogs GET Error]", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat log aktivitas dan login." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionType, ...data } = body;

    if (actionType === "LOGIN") {
      const log = await appendLoginLog(data);
      return NextResponse.json({ success: true, log });
    }

    if (actionType === "ACTIVITY") {
      const log = await appendActivityLog(data);
      return NextResponse.json({ success: true, log });
    }

    return NextResponse.json(
      { success: false, message: "actionType wajib diisi (LOGIN atau ACTIVITY)" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API AuditLogs POST Error]", err);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan log." },
      { status: 500 }
    );
  }
}
