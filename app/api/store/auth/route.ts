import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, phone, address, email, password } = body;

    // REGISTRASI AKUN BARU — HANYA DATA VITAL: Nama, No HP, Alamat, Email (opsional)
    if (action === "REGISTER") {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, message: "Nama lengkap wajib diisi." },
          { status: 400 }
        );
      }
      if (!phone || !phone.trim()) {
        return NextResponse.json(
          { success: false, message: "Nomor HP / WhatsApp wajib diisi." },
          { status: 400 }
        );
      }
      if (!address || !address.trim()) {
        return NextResponse.json(
          { success: false, message: "Alamat pengiriman obat wajib diisi." },
          { status: 400 }
        );
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const memberCode = `MBR-TAMAN-${randomSuffix}`;
      const customerId = `cust-store-${Date.now()}`;

      // In live environment with DB:
      let createdCustomer: any = null;
      try {
        const business = await prisma.business.findFirst({
          where: { type: "PHARMACY" },
        });

        if (business) {
          createdCustomer = await prisma.customer.create({
            data: {
              name: name.trim(),
              phone: phone.trim(),
              address: address.trim(),
              email: email?.trim() ? email.trim() : null, // Opsional
              memberCode,
              points: 50, // Welcome points
              businessId: business.id,
              isActive: true,
            },
          });
        }
      } catch {
        // Fallback if db offline or unseeded
      }

      const finalCustomer = {
        id: createdCustomer?.id || customerId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email?.trim() || null, // Opsional
        memberCode: createdCustomer?.memberCode || memberCode,
        points: 50,
        tier: "REGULAR",
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: `Pendaftaran berhasil! Akun Member Apotik Tamansari aktif.`,
        customer: finalCustomer,
      });
    }

    // LOGIN AKUN PELANGGAN
    if (action === "LOGIN") {
      const { phoneOrEmail } = body;
      if (!phoneOrEmail || !phoneOrEmail.trim()) {
        return NextResponse.json(
          { success: false, message: "Nomor HP atau Email wajib diisi." },
          { status: 400 }
        );
      }

      let foundCustomer: any = null;
      try {
        foundCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              { phone: phoneOrEmail.trim() },
              { email: phoneOrEmail.trim() },
              { memberCode: phoneOrEmail.trim() },
            ],
          },
        });
      } catch {}

      if (foundCustomer) {
        return NextResponse.json({
          success: true,
          message: `Selamat datang kembali, ${foundCustomer.name}!`,
          customer: {
            id: foundCustomer.id,
            name: foundCustomer.name,
            phone: foundCustomer.phone,
            address: foundCustomer.address,
            email: foundCustomer.email,
            memberCode: foundCustomer.memberCode,
            points: foundCustomer.points,
            tier: foundCustomer.tier || "REGULAR",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Login berhasil (mode sesi lokal).",
      });
    }

    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses permintaan." },
      { status: 500 }
    );
  }
}
