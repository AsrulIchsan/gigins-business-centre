import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllPosSales, addLivePosSale, PosSaleRecord } from "@/lib/pos-sales-data";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("businessSlug") || "apotik-tamansari";
    const saleNumber = searchParams.get("saleNumber");

    if (saleNumber) {
      const single = getAllPosSales().find(
        (s) => s.saleNumber.toLowerCase() === saleNumber.toLowerCase()
      );
      if (single) {
        return NextResponse.json({ success: true, sale: single }, { headers: NO_CACHE_HEADERS });
      }
    }

    // Try DB lookup if connected
    let dbSales: any[] = [];
    try {
      const business = await prisma.business.findUnique({
        where: { slug: businessSlug },
        select: { id: true },
      });

      if (business) {
        dbSales = await prisma.sale.findMany({
          where: { businessId: business.id },
          include: {
            customer: true,
            doctor: true,
            createdBy: true,
            items: {
              include: {
                product: true,
                productUnit: true,
              },
            },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
      }
    } catch {
      // Prisma offline or unseeded
    }

    if (dbSales && dbSales.length > 0) {
      const mapped: PosSaleRecord[] = dbSales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        date: s.createdAt.toISOString(),
        saleType: s.saleType,
        prescriptionNumber: s.prescriptionNumber || undefined,
        customer: s.customer
          ? {
              id: s.customer.id,
              name: s.customer.name,
              phone: s.customer.phone || undefined,
              tier: s.customer.tier,
              memberCode: s.customer.memberCode,
            }
          : null,
        doctor: s.doctor
          ? {
              id: s.doctor.id,
              name: s.doctor.name,
              clinic: s.doctor.clinic,
              sip: s.doctor.sip,
            }
          : null,
        items: s.items.map((it: any) => ({
          productId: it.productId,
          name: it.product?.name || "Obat",
          unitName: it.productUnit?.name || "Pcs",
          qty: Number(it.quantity),
          sellPrice: Number(it.sellPrice),
          subtotal: Number(it.subtotal),
          batchNumber: it.batchId || undefined,
          isCompounding: it.isCompoundingComponent,
        })),
        subtotal: Number(s.subtotal),
        compoundingFee: Number(s.compoundingFee),
        embalaseFee: Number(s.embalaseFee),
        discountAmount: Number(s.discountAmount),
        totalAmount: Number(s.totalAmount),
        paymentMethod: s.payments?.[0]?.paymentMethod || "CASH",
        paymentNote: s.notes || undefined,
        cashGiven: Number(s.totalAmount),
        roundingAmount: 0,
        change: 0,
        cashier: s.createdBy?.name || "Kasir",
        businessName: "Apotik Tamansari",
        businessAddress: "Jl. Tamansari No. 45, Bandung",
        businessPhone: "022-2501234",
        status: s.status as any,
        createdAt: s.createdAt.toISOString(),
      }));

      // Merge with getAllPosSales() to include any just-completed sales
      const merged = [...getAllPosSales()];
      for (const m of mapped) {
        if (!merged.some((s) => s.saleNumber === m.saleNumber)) {
          merged.push(m);
        }
      }

      return NextResponse.json(
        { success: true, source: "database", sales: merged },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, source: "in_memory", sales: getAllPosSales() },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.saleNumber) {
      return NextResponse.json(
        { success: false, message: "Invalid sale data" },
        { status: 400 }
      );
    }

    const newSale: PosSaleRecord = {
      id: body.id || `sale-${Date.now()}`,
      saleNumber: body.saleNumber,
      date: body.date || new Date().toISOString(),
      saleType: body.saleType || "GENERAL",
      prescriptionNumber: body.prescriptionNumber,
      items: body.items || [],
      customer: body.customer || null,
      doctor: body.doctor || null,
      subtotal: Number(body.subtotal || 0),
      compoundingFee: Number(body.compoundingFee || 0),
      embalaseFee: Number(body.embalaseFee || 0),
      discountAmount: Number(body.discountAmount || 0),
      totalAmount: Number(body.totalAmount || 0),
      paymentMethod: body.paymentMethod || "CASH",
      paymentNote: body.paymentNote || "",
      cashGiven: Number(body.cashGiven || body.totalAmount || 0),
      roundingAmount: Number(body.roundingAmount || 0),
      change: Number(body.change || 0),
      cashier: body.cashier || "Siti Rahma, A.Md.Farm",
      businessName: body.businessName || "Apotik Tamansari",
      businessAddress: body.businessAddress || "Jl. Tamansari No. 45, Bandung",
      businessPhone: body.businessPhone || "022-2501234",
      status: "COMPLETED",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    addLivePosSale(newSale);

    return NextResponse.json(
      { success: true, message: "Sale recorded successfully", sale: newSale },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to record sale" },
      { status: 500 }
    );
  }
}
