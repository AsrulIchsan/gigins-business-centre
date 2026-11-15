/**
 * POST /api/auth/login
 * Real Database-backed authentication dengan Prisma + bcryptjs + JWT HTTP-Only Cookie.
 * Mencatat LoginHistory otomatis (SUCCESS / FAILED).
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import {
  signSessionToken,
  getPostLoginRedirect,
  FALLBACK_USERS,
  TokenPayload,
  AuthSession,
} from "@/lib/auth";
import { logLogin } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, password } = body ?? {};

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") ?? "Unknown Browser";

    if (!rawEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    // 1. Cari user di Database Prisma (dengan timeout cerdas 800ms jika DB server offline)
    let dbUser: any = null;
    let isDbOnline = false;

    try {
      const dbQuery = prisma.user.findUnique({
        where: { email },
        include: {
          businessAccesses: {
            include: {
              business: true,
            },
          },
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout")), 800)
      );
      dbUser = (await Promise.race([dbQuery, timeoutPromise])) as any;
      isDbOnline = true;
    } catch (err: any) {
      console.warn("[Auth Login] Database query unavailable/timeout, falling back to secure credentials:", err?.message);
    }

    // 2. Jika tidak ada di DB (atau DB offline), cek fallback data ter-enkripsi
    let userRecord: {
      id: string;
      name: string;
      email: string;
      hashedPassword: string;
      role: any;
      isActive: boolean;
      businessAccesses: any[];
    } | null = null;

    if (dbUser) {
      userRecord = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        hashedPassword: dbUser.hashedPassword,
        role: dbUser.role,
        isActive: dbUser.isActive,
        businessAccesses: dbUser.businessAccesses.map((acc: any) => ({
          businessId: acc.businessId,
          businessSlug: acc.business?.slug ?? "apotik-tamansari",
          businessName: acc.business?.name ?? "Apotik Tamansari",
          businessType: acc.business?.type ?? "PHARMACY",
          role: acc.role,
          permissions: Array.isArray(acc.permissions) ? acc.permissions : [],
        })),
      };
    } else if (FALLBACK_USERS[email]) {
      const fb = FALLBACK_USERS[email];
      userRecord = {
        id: fb.id,
        name: fb.name,
        email: fb.email,
        hashedPassword: fb.hashedPassword,
        role: fb.role,
        isActive: fb.isActive,
        businessAccesses: fb.businessAccesses,
      };
    }

    // 3. Jika user tidak ditemukan sama sekali
    if (!userRecord) {
      await logLogin({
        userId: "unknown",
        ipAddress,
        userAgent,
        deviceInfo: userAgent,
        status: "FAILED",
        failReason: "Email tidak terdaftar di sistem",
      }).catch(() => {});

      return NextResponse.json(
        { success: false, message: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // 4. Validasi status akun (isActive: true)
    if (!userRecord.isActive) {
      await logLogin({
        userId: userRecord.id,
        businessId: userRecord.businessAccesses[0]?.businessId,
        ipAddress,
        userAgent,
        deviceInfo: userAgent,
        status: "FAILED",
        failReason: "Akun telah dinonaktifkan oleh Owner",
      }).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda telah dinonaktifkan oleh Owner. Silakan hubungi Administrator untuk mengaktifkan kembali.",
        },
        { status: 403 }
      );
    }

    // 5. Verifikasi Password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, userRecord.hashedPassword);

    if (!isPasswordValid) {
      await logLogin({
        userId: userRecord.id,
        businessId: userRecord.businessAccesses[0]?.businessId,
        ipAddress,
        userAgent,
        deviceInfo: userAgent,
        status: "FAILED",
        failReason: "Password salah",
      }).catch(() => {});

      return NextResponse.json(
        { success: false, message: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // 6. Login Sukses — Catat ke LoginHistory
    await logLogin({
      userId: userRecord.id,
      businessId: userRecord.businessAccesses[0]?.businessId,
      ipAddress,
      userAgent,
      deviceInfo: userAgent,
      status: "SUCCESS",
    }).catch(() => {});

    // 7. Bangun session token & JWT
    const tokenPayload: TokenPayload = {
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      platformRole: userRecord.role,
      isActive: userRecord.isActive,
      businessAccesses: userRecord.businessAccesses,
    };

    const sessionToken = await signSessionToken(tokenPayload);

    // 8. Tentukan URL Redirect sesuai Role
    const authSession: AuthSession = {
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        platformRole: userRecord.role,
        isActive: userRecord.isActive,
      },
      businessAccesses: userRecord.businessAccesses,
    };
    const redirectTo = getPostLoginRedirect(authSession);

    // 9. Kirim response dengan secure HTTP-Only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
      redirectTo,
    });

    // HTTP-Only JWT Cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    // Client-side accessible user profile (untuk render nama di header/sidebar tanpa blocking)
    response.cookies.set(
      "user_profile",
      JSON.stringify({
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      }),
      {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    // Cookie role untuk backward-compat
    response.cookies.set("role", userRecord.role, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[Auth Login Error]", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server saat proses login." },
      { status: 500 }
    );
  }
}
