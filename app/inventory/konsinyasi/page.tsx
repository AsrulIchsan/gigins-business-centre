"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle,
  Clock,
  Printer,
  Boxes,
} from "lucide-react";
import { INITIAL_PRODUCTS, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InventoryNavTabs } from "@/components/inventory/inventory-nav-tabs";

export default function KonsinyasiPage() {
  const consignmentProducts = INITIAL_PRODUCTS.filter((p) => p.isConsignment);

  // Sample Consignment Settlement Data
  const [settlements, setSettlements] = useState([
    {
      id: "SET-202611-01",
      supplierName: "CV Alami Sejahtera (Herbal Titipan)",
      period: "01 Nov 2026 - 14 Nov 2026",
      productName: "Madu Herbal TJ Murni 150g (Konsinyasi)",
      qtyReceived: 30,
      qtySold: 6,
      qtyRemaining: 24,
      sellPrice: 25000,
      totalSales: 150000,
      buyPrice: 20000, // Price to pay supplier
      supplierPayable: 120000,
      pharmacyCommission: 30000, // Apotik commission (20%)
      status: "DRAFT", // DRAFT, SENT, PAID
    },
  ]);

  const handlePaySettlement = (id: string) => {
    setSettlements(
      settlements.map((s) => (s.id === id ? { ...s, status: "PAID" } : s))
    );
    alert("Tagihan Konsinyasi telah ditandai LUNAS & Jurnal Pengeluaran Kas/Bank otomatis dibuat!");
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <InventoryNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            Manajemen Obat Konsinyasi & Bagi Hasil Titipan
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan obat titipan pihak ketiga, monitoring stok terjual, dan kalkulasi tagihan bagi hasil.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => alert("Tagihan konsinyasi periode ini berhasil dihitung otomatis dan draft pelunasan telah dibuat!")}
          className="bg-purple-600 hover:bg-purple-700 text-xs font-bold"
        >
          <FileText className="mr-1.5 h-4 w-4" />
          Generate Tagihan Konsinyasi Periode Ini
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-purple-100 bg-purple-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700">Total Penjualan Konsinyasi</CardDescription>
            <CardTitle className="text-xl font-bold text-purple-900">
              {formatRupiah(150000)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-purple-700">6 Item Terjual Periode Ini</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700">Pendapatan Komisi Apotek</CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-800">
              {formatRupiah(30000)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-emerald-700">Bagi Hasil Apotek (20% Margin)</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500">Hutang ke Supplier Titipan</CardDescription>
            <CardTitle className="text-xl font-bold text-slate-800">
              {formatRupiah(120000)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">Wajib Dibayar saat Tutup Periode</span>
          </CardContent>
        </Card>
      </div>

      {/* Active Consignment Items */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Daftar Produk Konsinyasi Aktif
          </CardTitle>
          <CardDescription>
            Barang dagangan titipan yang tidak menambah hutang dagang sebelum laku terjual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Nama Produk Titipan</th>
                  <th className="p-3">Supplier Konsinyasi</th>
                  <th className="p-3 text-right">Harga Setor (HPP)</th>
                  <th className="p-3 text-right">Harga Jual POS</th>
                  <th className="p-3 text-right">Komisi Apotek</th>
                  <th className="p-3 text-right">Sisa Stok Fisik</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {consignmentProducts.map((p) => {
                  const unit = p.units[0];
                  const commission = unit.sellPrice - unit.buyPrice;
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.supplierName}</td>
                      <td className="p-3 text-right">{formatRupiah(unit.buyPrice)}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {formatRupiah(unit.sellPrice)}
                      </td>
                      <td className="p-3 text-right text-purple-700 font-bold">
                        {formatRupiah(commission)} ({((commission / unit.sellPrice) * 100).toFixed(0)}%)
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {p.totalStock} {p.baseUnit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Rekap Lembar Bagi Hasil & Tagihan Konsinyasi Terjual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">No. Tagihan</th>
                  <th className="p-3">Supplier Titipan</th>
                  <th className="p-3">Periode Rekap</th>
                  <th className="p-3 text-right">Terjual</th>
                  <th className="p-3 text-right">Omset Jual</th>
                  <th className="p-3 text-right">Komisi Apotek</th>
                  <th className="p-3 text-right">Hutang ke Supplier</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono font-bold text-slate-800">{s.id}</td>
                    <td className="p-3 font-medium text-slate-800">{s.supplierName}</td>
                    <td className="p-3 text-slate-500">{s.period}</td>
                    <td className="p-3 text-right font-bold">{s.qtySold} Botol</td>
                    <td className="p-3 text-right font-semibold">{formatRupiah(s.totalSales)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatRupiah(s.pharmacyCommission)}
                    </td>
                    <td className="p-3 text-right font-bold text-purple-700 text-sm">
                      {formatRupiah(s.supplierPayable)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={s.status === "PAID" ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {s.status === "PAID" ? "Lunas" : "Draft / Belum Bayar"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {s.status !== "PAID" && (
                        <Button
                          size="sm"
                          onClick={() => handlePaySettlement(s.id)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold"
                        >
                          Bayar Supplier
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-7 text-xs"
                        title="Cetak Bukti Tagihan Konsinyasi"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
