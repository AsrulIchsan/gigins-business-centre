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
import { logLogin, logActivity, checkDatabaseAvailable } from "@/lib/logger";
import { findUserByIdentifier } from "@/lib/user-storage";

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
        { success: false, message: "Email atau username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedInput = rawEmail.trim();
    let email = trimmedInput.toLowerCase();

    // 1. Cari user dari Master User Storage (data/users.json — terhubung langsung ke Role & Access Control)
    let userRecord: {
      id: string;
      name: string;
      email: string;
      password?: string;
      hashedPassword: string;
      role: any;
      isActive: boolean;
      businessAccesses: any[];
    } | null = null;

    const storedUser = findUserByIdentifier(trimmedInput);
    if (storedUser) {
      userRecord = {
        id: storedUser.id,
        name: storedUser.name,
        email: storedUser.email,
        password: storedUser.password,
        hashedPassword: storedUser.hashedPassword,
        role: storedUser.role,
        isActive: storedUser.isActive,
        businessAccesses: (storedUser.assignedBusinesses || []).map((b) => ({
          businessId: `biz-${b.slug}`,
          businessSlug: b.slug,
          businessName: b.name,
          businessType: b.type,
          role: b.role,
          permissions: b.permissions || [],
        })),
      };
      email = storedUser.email.toLowerCase();
    }

    // 2. Jika tidak ada di user-storage, cek Database Prisma (jika DB server online)
    if (!userRecord) {
      const dbAvailable = await checkDatabaseAvailable();
      if (dbAvailable) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: {
              businessAccesses: {
                include: {
                  business: true,
                },
              },
            },
          });
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
          }
        } catch (err: any) {
          console.warn("[Auth Login] Database query unavailable:", err?.message);
        }
      }
    }

    // 3. Jika belum ditemukan juga, cek fallback dictionary
    if (!userRecord && FALLBACK_USERS[email]) {
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

    // 4. Jika user tidak ditemukan sama sekali
    if (!userRecord) {
      await logLogin({
        userId: "unknown",
        userName: `Percobaan Login: ${trimmedInput}`,
        userEmail: trimmedInput.includes("@") ? trimmedInput : "-",
        role: "UNKNOWN",
        businessName: "Portal Utama",
        businessSlug: "all",
        ipAddress,
        userAgent,
        deviceInfo: userAgent,
        status: "FAILED",
        failReason: "Akun atau email tidak terdaftar di sistem",
      }).catch(() => {});

      return NextResponse.json(
        { success: false, message: "Email atau password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // 5. Validasi status akun (isActive: true)
    if (!userRecord.isActive) {
      await logLogin({
        userId: userRecord.id,
        userName: userRecord.name,
        userEmail: userRecord.email,
        role: userRecord.role,
        businessId: userRecord.businessAccesses[0]?.businessId,
        businessName: userRecord.businessAccesses[0]?.businessName ?? "Gigin's Business Centre",
        businessSlug: userRecord.businessAccesses[0]?.businessSlug ?? "all",
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

    // 6. Verifikasi Password secara ketat (bcrypt hash atau password resmi aktif)
    // Backdoor password123 telah DIHAPUS demi keamanan enterprise.
    let isPasswordValid = false;
    if (userRecord.hashedPassword) {
      isPasswordValid = await bcrypt.compare(password, userRecord.hashedPassword);
    }
    if (!isPasswordValid && userRecord.password && userRecord.password === password) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      await logLogin({
        userId: userRecord.id,
        userName: userRecord.name,
        userEmail: userRecord.email,
        role: userRecord.role,
        businessId: userRecord.businessAccesses[0]?.businessId,
        businessName: userRecord.businessAccesses[0]?.businessName ?? "Gigin's Business Centre",
        businessSlug: userRecord.businessAccesses[0]?.businessSlug ?? "all",
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

    // 7. Login Sukses — Catat ke LoginHistory & ActivityLog
    const primaryBiz = userRecord.businessAccesses[0];
    await logLogin({
      userId: userRecord.id,
      userName: userRecord.name,
      userEmail: userRecord.email,
      role: userRecord.role,
      businessId: primaryBiz?.businessId,
      businessName: primaryBiz?.businessName ?? "Gigin's Business Centre",
      businessSlug: primaryBiz?.businessSlug ?? "all",
      ipAddress,
      userAgent,
      deviceInfo: userAgent,
      status: "SUCCESS",
    }).catch(() => {});

    await logActivity({
      userId: userRecord.id,
      userName: userRecord.name,
      userRole: userRecord.role,
      businessId: primaryBiz?.businessId,
      businessName: primaryBiz?.businessName ?? "Gigin's Business Centre",
      businessSlug: primaryBiz?.businessSlug ?? "all",
      module: "USER",
      action: "LOGIN",
      entityId: userRecord.id,
      entityName: userRecord.name,
      description: `Pengguna ${userRecord.name} (${userRecord.role}) berhasil login ke sistem melalui ${userAgent.includes("Mobile") ? "Perangkat Mobile / HP" : "Desktop Browser"}.`,
      ipAddress,
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

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    // HTTP-Only JWT Cookie (kompatibel lintas perangkat baik HTTP LAN maupun HTTPS)
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: isHttps,
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
        secure: isHttps,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    // Cookie role untuk backward-compat
    response.cookies.set("role", userRecord.role, {
      httpOnly: true,
      secure: isHttps,
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
