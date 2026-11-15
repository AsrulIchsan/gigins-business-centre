"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  Clock,
  ShieldAlert,
  Flame,
  Search,
  Filter,
  Truck,
  Printer,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { formatRupiah, formatDateIndo, getDaysUntilExpiration, getExpirationBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function StokAlertPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const isPharmacy = activeBusiness.type === "PHARMACY";

  const poHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/po` : "/pembelian/po";
  const returHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/retur` : "/pembelian/retur";

  const [activeTab, setActiveTab] = useState<"EXPIRED" | "LOW_STOCK" | "FAST_MOVING">("EXPIRED");
  const [expiredFilter, setExpiredFilter] = useState<number>(90); // 30, 90, 180

  // 1. All batches with days to expiry
  const allBatches = INITIAL_PRODUCTS.flatMap((p) =>
    p.batches.map((b) => {
      const days = getDaysUntilExpiration(b.expiredDate);
      const badgeInfo = getExpirationBadge(b.expiredDate);
      return {
        product: p,
        batch: b,
        days,
        ...badgeInfo,
      };
    })
  );

  const filteredBatches = allBatches
    .filter((b) => b.days <= expiredFilter)
    .sort((a, b) => a.days - b.days);

  // 2. Low stock items (totalStock <= minStock)
  const lowStockProducts = INITIAL_PRODUCTS.filter((p) => p.totalStock <= p.minStock);

  // 3. Fast Moving items mock
  const fastMovingProducts = [
    { product: INITIAL_PRODUCTS[0], monthlySales: 1240, avgDaily: 41, stockCoverageDays: 10 },
    { product: INITIAL_PRODUCTS[1], monthlySales: 890, avgDaily: 30, stockCoverageDays: 10 },
    { product: INITIAL_PRODUCTS[3], monthlySales: 750, avgDaily: 25, stockCoverageDays: 11 },
    { product: INITIAL_PRODUCTS[2], monthlySales: 620, avgDaily: 21, stockCoverageDays: 9 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Laporan Peringatan Stok, Kedaluwarsa & Fast-Moving
          </h1>
          <p className="text-xs text-slate-500">
            Pencegahan kerugian apotek dengan deteksi dini batch expired (H-30/90/180) dan antisipasi obat habis.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="mr-1.5 h-4 w-4" />
          Cetak Laporan Peringatan
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b bg-white p-2 rounded-xl">
        <button
          onClick={() => setActiveTab("EXPIRED")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "EXPIRED"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock className="h-4 w-4 text-rose-600" />
          Laporan Obat Expired ({filteredBatches.length})
        </button>
        <button
          onClick={() => setActiveTab("LOW_STOCK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "LOW_STOCK"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          Obat Menipis / Bawah Minimum ({lowStockProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("FAST_MOVING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "FAST_MOVING"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Flame className="h-4 w-4 text-emerald-600" />
          Obat Laris (Fast-Moving)
        </button>
      </div>

      {/* TAB 1: EXPIRED REPORT */}
      {activeTab === "EXPIRED" && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Peringatan Batch Obat Mendekati Kedaluwarsa
              </CardTitle>
              <CardDescription>
                Urutan batch yang perlu diretur ke PBF atau diprioritaskan keluar melalui kasir
              </CardDescription>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
              {[30, 90, 180].map((days) => (
                <button
                  key={days}
                  onClick={() => setExpiredFilter(days)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    expiredFilter === days
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Filter H-{days} Hari
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Nama Obat</th>
                    <th className="p-3">Nomor Batch</th>
                    <th className="p-3">Tanggal Expired</th>
                    <th className="p-3">Sisa Hari</th>
                    <th className="p-3 text-right">Sisa Stok Fisik</th>
                    <th className="p-3 text-right">Potensi Kerugian (HPP)</th>
                    <th className="p-3 text-center">Tingkat Urgensi</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {filteredBatches.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-800">
                        {item.product.name}
                      </td>
                      <td className="p-3 font-mono font-bold">{item.batch.batchNumber}</td>
                      <td className="p-3 font-semibold">{formatDateIndo(item.batch.expiredDate)}</td>
                      <td className="p-3 font-bold text-rose-600">
                        {item.days < 0 ? `${Math.abs(item.days)} hari lalu` : `${item.days} hari lagi`}
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">
                        {item.batch.quantity} {item.product.baseUnit}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-700">
                        {formatRupiah(item.batch.quantity * item.batch.buyPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.label}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <Link href={returHref}>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-300">
                            {isPharmacy ? "Retur PBF" : "Retur Supplier"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: LOW STOCK */}
      {activeTab === "LOW_STOCK" && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              Daftar Obat di Bawah Stok Minimum (Perlu Restock)
            </CardTitle>
            <CardDescription>
              Obat yang stoknya menipis dan harus segera dibuatkan Purchase Order (PO) ke PBF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Nama Obat</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Supplier PBF Utama</th>
                    <th className="p-3 text-right">Stok Saat Ini</th>
                    <th className="p-3 text-right">Batas Stok Minimum</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{p.supplierName}</td>
                      <td className="p-3 text-right font-black text-rose-600 text-sm">
                        {p.totalStock} {p.baseUnit}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700">
                        {p.minStock} {p.baseUnit}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          Kritis / Habis
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={poHref}>
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                            <Truck className="h-3 w-3 mr-1" />
                            Buat PO Restock
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: FAST MOVING */}
      {activeTab === "FAST_MOVING" && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              Analisis Obat Laris (Fast-Moving Items)
            </CardTitle>
            <CardDescription>
              Obat dengan perputaran tercepat yang menyumbang omset tertinggi apotek
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Peringkat & Obat</th>
                    <th className="p-3 text-right">Rata-rata Jual / Hari</th>
                    <th className="p-3 text-right">Total Terjual (30 Hari)</th>
                    <th className="p-3 text-right">Sisa Stok Fisik</th>
                    <th className="p-3 text-right">Ketahanan Stok (Hari)</th>
                    <th className="p-3 text-center">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {fastMovingProducts.map((fm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <span>{fm.product.name}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {fm.avgDaily} {fm.product.baseUnit}/hari
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        {fm.monthlySales} {fm.product.baseUnit}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {fm.product.totalStock} {fm.product.baseUnit}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700">
                        {fm.stockCoverageDays} Hari Lagi
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="cyan" className="text-[10px]">
                          Pesan 10 Box ke PBF
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
