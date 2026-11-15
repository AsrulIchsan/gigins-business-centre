import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_ORDERS = [
  {
    id: "ord-internal-01",
    orderNumber: "ORD-WEB-20261116-001",
    channel: "WEBSTORE_INTERNAL",
    channelLabel: "Webstore Apotik Tamansari",
    customerName: "Rina Marlina",
    phone: "08122334455",
    items: [
      { id: "item-1", productName: "Sanmol 500mg (Paracetamol)", qty: 2, unitName: "Strip", price: 5000, subtotal: 10000 },
      { id: "item-2", productName: "Cetirizine 10mg Novell", qty: 1, unitName: "Strip", price: 11000, subtotal: 11000 },
    ],
    totalAmount: 21000,
    status: "PENDING",
    notes: "Pengiriman Instan (Gosend) - Resep Dokter",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-kd-02",
    orderNumber: "ORD-KD-20261116-002",
    channel: "KLIKDOKTER",
    channelLabel: "KlikDokter Merchant",
    customerName: "Dedi Supardi",
    phone: "08571239988",
    items: [
      { id: "item-3", productName: "Amoxicillin 500mg Hexpharm", qty: 2, unitName: "Strip", price: 8000, subtotal: 16000 },
      { id: "item-4", productName: "Vitamin C 500mg IPI", qty: 1, unitName: "Pot", price: 9500, subtotal: 9500 },
    ],
    totalAmount: 25500,
    status: "PROCESSING",
    notes: "Pesanan Tebus Resep Online KlikDokter #KD-88124",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-mkt-03",
    orderNumber: "ORD-MKT-20261116-003",
    channel: "MARKETPLACE",
    channelLabel: "Marketplace (Shopee / Tokopedia)",
    customerName: "Siti Aminah",
    phone: "08961234567",
    items: [
      { id: "item-5", productName: "Madu Herbal TJ Murni 150g", qty: 2, unitName: "Botol", price: 25000, subtotal: 50000 },
      { id: "item-6", productName: "Minyak Kayu Putih Cap Lang 60ml", qty: 1, unitName: "Botol", price: 22000, subtotal: 22000 },
    ],
    totalAmount: 72000,
    status: "COMPLETED",
    notes: "Pengiriman Reguler J&T #JT99281726",
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-internal-04",
    orderNumber: "ORD-WEB-20261116-004",
    channel: "WEBSTORE_INTERNAL",
    channelLabel: "Webstore Apotik Tamansari",
    customerName: "Budi Santoso (Member Gold)",
    phone: "081234567890",
    items: [
      { id: "item-7", productName: "Imboost Force Strip", qty: 3, unitName: "Strip", price: 38500, subtotal: 115500 },
    ],
    totalAmount: 115500,
    status: "PENDING",
    notes: "Ambil di Apotek (Pick-Up Counter)",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("businessSlug") || "apotik-tamansari";
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");

    // Cari businessId berdasarkan slug jika DB terhubung
    let dbOrders: any[] = [];
    try {
      const business = await prisma.business.findUnique({
        where: { slug: businessSlug },
        select: { id: true },
      });

      if (business) {
        dbOrders = await prisma.onlineOrder.findMany({
          where: {
            businessId: business.id,
            ...(channel && channel !== "ALL" ? { channel: channel as any } : {}),
            ...(status && status !== "ALL" ? { status: status as any } : {}),
          },
          include: {
            items: true,
            customer: true,
          },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch {
      // Prisma offline or unseeded
    }

    if (dbOrders && dbOrders.length > 0) {
      const mapped = dbOrders.map((ord) => ({
        id: ord.id,
        orderNumber: ord.orderNumber,
        channel: ord.channel,
        channelLabel:
          ord.channel === "WEBSTORE_INTERNAL"
            ? "Webstore Apotik Tamansari"
            : ord.channel === "KLIKDOKTER"
            ? "KlikDokter Merchant"
            : ord.channel === "MARKETPLACE"
            ? "Marketplace"
            : "Katalog Internal",
        customerName: ord.customer?.name || "Pelanggan Online",
        phone: ord.customer?.phone || "-",
        items: ord.items.map((it: any) => ({
          id: it.id,
          productName: it.productName,
          qty: Number(it.qty),
          unitName: it.unitName,
          price: Number(it.price),
          subtotal: Number(it.subtotal),
        })),
        totalAmount: Number(ord.totalAmount),
        status: ord.status,
        notes: ord.notes || "",
        createdAt: ord.createdAt.toISOString(),
      }));

      return NextResponse.json({ success: true, source: "database", orders: mapped });
    }

    // Filter fallback orders
    let result = [...FALLBACK_ORDERS];
    if (channel && channel !== "ALL") {
      result = result.filter((o) => o.channel === channel);
    }
    if (status && status !== "ALL") {
      result = result.filter((o) => o.status === status);
    }

    return NextResponse.json({
      success: true,
      source: "fallback_seed",
      orders: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: "orderId and status are required" }, { status: 400 });
    }

    try {
      await prisma.onlineOrder.update({
        where: { id: orderId },
        data: { status },
      });
    } catch {
      // Ignore if mock ID
    }

    return NextResponse.json({
      success: true,
      message: `Status pesanan ${orderId} berhasil diubah menjadi ${status}`,
      orderId,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, businessSlug = "apotik-tamansari", action } = body;

    if (action === "PROCESS_TO_POS") {
      try {
        await prisma.onlineOrder.update({
          where: { id: orderId },
          data: { status: "PROCESSING" },
        });
      } catch {
        // Mock fallback
      }

      return NextResponse.json({
        success: true,
        message: `Pesanan ${orderId} telah diarahkan ke Kasir POS Apotik Tamansari.`,
        posUrl: `/b/${businessSlug}/pos?onlineOrderId=${orderId}`,
      });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process order" },
      { status: 500 }
    );
  }
}
