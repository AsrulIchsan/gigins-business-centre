/**
 * POST /api/auth/logout
 * Hapus sesi pengguna, bersihkan cookie HTTP-Only, dan catat audit log logout.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session?.user) {
      const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "127.0.0.1";

      await logActivity({
        userId: session.user.id,
        businessId: session.businessAccesses[0]?.businessId,
        module: "USER",
        action: "LOGOUT",
        entityId: session.user.id,
        entityName: session.user.name,
        description: `Pengguna ${session.user.name} (${session.user.email}) telah logout dari sistem.`,
        ipAddress,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("[Auth Logout] Error recording logout audit:", err);
  }

  const response = NextResponse.json({
    success: true,
    message: "Berhasil keluar dari sistem.",
  });

  // Hapus semua cookies sesi
  const cookiesToClear = ["session_token", "user_profile", "role", "session"];
  for (const cookieName of cookiesToClear) {
    response.cookies.set(cookieName, "", {
      httpOnly: cookieName === "session_token" || cookieName === "role" || cookieName === "session",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
      expires: new Date(0),
    });
  }

  return response;
}
