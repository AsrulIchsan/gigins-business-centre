import { NextResponse } from "next/server";
import { activityLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "biz-apotik-tamansari",
      userId = "user-owner-gigin",
      name,
      genericName,
      category,
      barcode,
      baseUnit,
      buyPrice = 0,
      sellPrice = 0,
      initialStock = 0,
    } = body;

    const productId = `prod-${Date.now()}`;

    // Audit trail logging
    await activityLogger.product
      .created(userId, businessId, productId, name)
      .catch((err) => console.error("Activity log error:", err));

    return NextResponse.json({
      success: true,
      message: `Obat baru "${name}" berhasil ditambahkan oleh Owner ke sistem POS!`,
      data: {
        id: productId,
        name,
        genericName,
        category,
        barcode,
        baseUnit,
        buyPrice,
        sellPrice,
        initialStock,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambahkan obat baru" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "biz-apotik-tamansari",
      userId = "user-owner-gigin",
      productId,
      productName,
      oldData = {},
      newData = {},
      reason = "",
    } = body;

    // Check if stock changed
    if (
      oldData.totalStock !== undefined &&
      newData.totalStock !== undefined &&
      oldData.totalStock !== newData.totalStock
    ) {
      await activityLogger.stock
        .adjusted(
          userId,
          businessId,
          productId,
          productName,
          oldData.totalStock,
          newData.totalStock,
          reason || "Penyesuaian stok langsung oleh Owner di POS"
        )
        .catch((err) => console.error("Stock adjust log error:", err));
    }

    // Check if sell price changed
    if (
      oldData.sellPrice !== undefined &&
      newData.sellPrice !== undefined &&
      oldData.sellPrice !== newData.sellPrice
    ) {
      await activityLogger.product
        .priceChanged(
          userId,
          businessId,
          productId,
          productName,
          oldData.sellPrice,
          newData.sellPrice
        )
        .catch((err) => console.error("Price change log error:", err));
    }

    // General update log
    await activityLogger.product
      .updated(
        userId,
        businessId,
        productId,
        productName,
        oldData,
        newData
      )
      .catch((err) => console.error("Product update log error:", err));

    return NextResponse.json({
      success: true,
      message: `Perubahan data obat "${productName}" berhasil disimpan oleh Owner!`,
      data: {
        productId,
        productName,
        oldData,
        newData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui data obat" },
      { status: 500 }
    );
  }
}
