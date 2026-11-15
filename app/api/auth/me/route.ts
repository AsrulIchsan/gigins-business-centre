/**
 * GET /api/auth/me
 * Mengembalikan data pengguna yang sedang login saat ini.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    businessAccesses: session.businessAccesses,
  });
}
