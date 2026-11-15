import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { channel, externalOrderId, customerName, phone, items, totalAmount } = payload;

    if (!channel || !externalOrderId) {
      return NextResponse.json(
        { success: false, message: "Channel and externalOrderId are required" },
        { status: 400 }
      );
    }

    const orderNumber = `ORD-${channel.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // In a live DB environment:
    // 1. Validate signature / webhook secret
    // 2. Persist to OnlineOrder & OnlineOrderItem
    // 3. Trigger realtime notification to Cashier / Warehouse screen

    return NextResponse.json({
      success: true,
      message: `Pesanan dari kanal ${channel} berhasil diterima dan disinkronkan ke SIM Apotik Tamansari.`,
      order: {
        orderNumber,
        channel,
        externalOrderId,
        customerName,
        phone,
        totalAmount,
        status: "PENDING",
        receivedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
