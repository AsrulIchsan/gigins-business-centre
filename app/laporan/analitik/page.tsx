"use client";

import React from "react";
import {
  TrendingUp,
  Sparkles,
  BarChart3,
  Calendar,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  CheckCircle,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalitikCerdasPage() {
  // Smart Forecasting Data Model
  const forecastData = [
    {
      productName: "Sanmol 500mg (Paracetamol)",
      unit: "Box",
      currentStock: 4, // 4 Box = 400 tab
      avgSalesWeekly: 2.5, // 2.5 Box/week
      leadTimeDays: 2, // PBF shipping lead time
      safetyStock: 1, // safety reserve
      reorderPoint: 2, // When to order
      recommendedOrderQty: 10, // Recommended PO
      estimatedBudget: 380000,
      confidence: "96%",
    },
    {
      productName: "Amoxicillin 500mg Hexpharm",
      unit: "Box",
      currentStock: 3,
      avgSalesWeekly: 1.8,
      leadTimeDays: 3,
      safetyStock: 1,
      reorderPoint: 2,
      recommendedOrderQty: 8,
      estimatedBudget: 464000,
      confidence: "92%",
    },
    {
      productName: "Antasida Doen Tablet Kunyah",
      unit: "Box",
      currentStock: 2,
      avgSalesWeekly: 2.0,
      leadTimeDays: 2,
      safetyStock: 1,
      reorderPoint: 2,
      recommendedOrderQty: 12,
      estimatedBudget: 336000,
      confidence: "94%",
    },
  ];

  // Price & Competitor Analysis
  const priceAnalysis = [
    {
      productName: "Sanmol 500mg",
      unit: "Strip",
      hpp: 4000,
      ourPrice: 5000,
      ourMargin: "25.0%",
      marketAvgPrice: 5500,
      competitorMin: 4800,
      competitorMax: 6000,
      status: "KOMPETITIF (Optimal)",
    },
    {
      productName: "Amoxicillin 500mg",
      unit: "Strip",
      hpp: 6000,
      ourPrice: 8000,
      ourMargin: "33.3%",
      marketAvgPrice: 8500,
      competitorMin: 7500,
      competitorMax: 9000,
      status: "KOMPETITIF (Optimal)",
    },
    {
      productName: "Cetirizine 10mg",
      unit: "Strip",
      hpp: 8000,
      ourPrice: 11000,
      ourMargin: "37.5%",
      marketAvgPrice: 12000,
      competitorMin: 10500,
      competitorMax: 13000,
      status: "MARGIN TINGGI",
    },
  ];

  // Discount Impact on Profit Analysis
  const discountImpact = [
    {
      promoName: "Diskon Member Silver (3%)",
      transactionsCount: 38,
      grossSales: 1820000,
      discountGiven: 54600,
      netSales: 1765400,
      totalCOGS: 1280000,
      netProfit: 485400,
      profitMargin: "27.5%",
      impactVerdict: "Sangat Sehat (+35% Kunjungan Pasien)",
    },
    {
      promoName: "Diskon Member Gold (5%)",
      transactionsCount: 24,
      grossSales: 2150000,
      discountGiven: 107500,
      netSales: 2042500,
      totalCOGS: 1470000,
      netProfit: 572500,
      profitMargin: "28.0%",
      impactVerdict: "Sangat Sehat (Basket Size Naik Rp 89k)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            Laporan Analitik Cerdas (Smart Forecasting & Analisa Profit)
          </h1>
          <p className="text-xs text-slate-500">
            Prediksi kebutuhan restock dari rata-rata penjualan (Safety Stock), analisa harga pasar, dan efektivitas diskon.
          </p>
        </div>

        <Badge variant="cyan" className="text-xs">
          AI Engine: Algoritma Moving Average Terkalibrasi
        </Badge>
      </div>

      {/* SECTION 1: SMART FORECASTING */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600" />
                1. Smart Restock Forecasting (Prediksi Kebutuhan Belanja PBF)
              </CardTitle>
              <CardDescription>
                Dihitung dari laju penjualan harian (run-rate), lead time pengiriman PBF, dan batas safety stock
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Total Est. Modal Belanja: Rp 1.180.000
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Nama Obat</th>
                  <th className="p-3 text-right">Stok Saat Ini</th>
                  <th className="p-3 text-right">Kecepatan Jual</th>
                  <th className="p-3 text-right">Lead Time PBF</th>
                  <th className="p-3 text-right font-bold text-emerald-800">Saran Order ke PBF</th>
                  <th className="p-3 text-right">Estimasi Anggaran</th>
                  <th className="p-3 text-center">Tingkat Akurasi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {forecastData.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-800">{f.productName}</td>
                    <td className="p-3 text-right font-bold">{f.currentStock} {f.unit}</td>
                    <td className="p-3 text-right text-slate-600">{f.avgSalesWeekly} {f.unit}/minggu</td>
                    <td className="p-3 text-right text-slate-500">{f.leadTimeDays} Hari</td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      Pesan {f.recommendedOrderQty} {f.unit}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      {formatRupiah(f.estimatedBudget)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="success" className="text-[10px]">
                        {f.confidence} Akurat
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PRICE & COMPETITOR ANALYSIS */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            2. Analisa Harga Jual vs HPP & Benchmark Pasar
          </CardTitle>
          <CardDescription>
            Memastikan margin keuntungan tetap sehat tanpa membuat harga apotek kalah saing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Nama Obat</th>
                  <th className="p-3 text-right">HPP Beli</th>
                  <th className="p-3 text-right">Harga Jual Apotek</th>
                  <th className="p-3 text-right">Margin Kita</th>
                  <th className="p-3 text-right">Rata-rata Pasar</th>
                  <th className="p-3 text-right">Rentang Kompetitor</th>
                  <th className="p-3 text-center">Evaluasi Posisi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {priceAnalysis.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-800">
                      {p.productName} ({p.unit})
                    </td>
                    <td className="p-3 text-right text-slate-500">{formatRupiah(p.hpp)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatRupiah(p.ourPrice)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">{p.ourMargin}</td>
                    <td className="p-3 text-right text-slate-600 font-medium">
                      {formatRupiah(p.marketAvgPrice)}
                    </td>
                    <td className="p-3 text-right text-[11px] text-slate-400">
                      {formatRupiah(p.competitorMin)} - {formatRupiah(p.competitorMax)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="cyan" className="text-[10px]">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: DISCOUNT IMPACT ON PROFIT */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Percent className="h-4 w-4 text-purple-600" />
            3. Analisa Dampak Promo & Diskon Terhadap Laba Bersih
          </CardTitle>
          <CardDescription>
            Menilai apakah program diskon member meningkatkan volume tanpa menggerus profit margin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Program Promo</th>
                  <th className="p-3 text-right">Volume Transaksi</th>
                  <th className="p-3 text-right">Omset Kotor</th>
                  <th className="p-3 text-right">Potongan Diskon</th>
                  <th className="p-3 text-right">HPP (COGS)</th>
                  <th className="p-3 text-right font-bold text-emerald-800">Laba Bersih</th>
                  <th className="p-3 text-right">Margin Laba</th>
                  <th className="p-3">Kesimpulan Efektivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {discountImpact.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-800">{d.promoName}</td>
                    <td className="p-3 text-right font-bold">{d.transactionsCount} Struk</td>
                    <td className="p-3 text-right">{formatRupiah(d.grossSales)}</td>
                    <td className="p-3 text-right text-rose-600 font-bold">
                      -{formatRupiah(d.discountGiven)}
                    </td>
                    <td className="p-3 text-right text-slate-500">{formatRupiah(d.totalCOGS)}</td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      {formatRupiah(d.netProfit)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">{d.profitMargin}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{d.impactVerdict}</td>
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
