import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_WEBSTORE_SETTINGS, WebstoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

// Global in-memory settings for server-side persistence
let currentStoreSettings: WebstoreSettings = { ...DEFAULT_WEBSTORE_SETTINGS };

export async function GET() {
  return NextResponse.json({
    success: true,
    settings: currentStoreSettings,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    currentStoreSettings = {
      ...currentStoreSettings,
      ...body,
      shipping: {
        ...currentStoreSettings.shipping,
        ...(body.shipping || {}),
      },
      payment: {
        ...currentStoreSettings.payment,
        ...(body.payment || {}),
      },
      banner: {
        ...currentStoreSettings.banner,
        ...(body.banner || {}),
      },
    };

    return NextResponse.json({
      success: true,
      message: "Pengaturan Webstore Apotik Tamansari berhasil diperbarui oleh Owner!",
      settings: currentStoreSettings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui pengaturan webstore" },
      { status: 500 }
    );
  }
}
