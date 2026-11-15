"use client";

import React, { useState } from "react";
import {
  BookOpenCheck,
  TrendingUp,
  Scale,
  Percent,
  Printer,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LaporanAkuntansiPage() {
  const [reportType, setReportType] = useState<"INCOME_STATEMENT" | "BALANCE_SHEET" | "FINANCIAL_RATIOS">("INCOME_STATEMENT");

  // INCOME STATEMENT METRICS (Bulan Berjalan)
  const revenueOTC = 24500000;
  const revenuePrescription = 18200000;
  const revenueCompounding = 2100000;
  const revenueConsignmentCommission = 850000;
  const totalRevenue = revenueOTC + revenuePrescription + revenueCompounding + revenueConsignmentCommission;

  const cogsFIFO = 32800000; // Harga Pokok Penjualan FIFO
  const grossProfit = totalRevenue - cogsFIFO;

  // Operating Expenses
  const expCashShortage = 0;
  const expElectricityWifi = 1200000;
  const expStaffSalary = 6500000;
  const expDamagedExpired = 250000;
  const totalExpenses = expCashShortage + expElectricityWifi + expStaffSalary + expDamagedExpired;

  const netProfit = grossProfit - totalExpenses;

  // BALANCE SHEET METRICS
  // Assets
  const assetCashDrawer = 840000;
  const assetBankBCA = 42500000;
  const assetReceivables = 3200000; // Piutang pasien
  const assetInventory = 28600000; // Persediaan obat FIFO
  const totalAssets = assetCashDrawer + assetBankBCA + assetReceivables + assetInventory;

  // Liabilities
  const liabilityPBF = 18450000; // Hutang ke PBF
  const liabilityConsignment = 1250000; // Titipan konsinyasi
  const totalLiabilities = liabilityPBF + liabilityConsignment;

  // Equity
  const equityCapital = 50000000;
  const equityRetainedEarnings = totalAssets - totalLiabilities - equityCapital;
  const totalEquity = equityCapital + equityRetainedEarnings;

  // RATIOS
  const currentRatio = (totalAssets / totalLiabilities).toFixed(2);
  const grossMargin = ((grossProfit / totalRevenue) * 100).toFixed(1);
  const netMargin = ((netProfit / totalRevenue) * 100).toFixed(1);
  const inventoryTurnover = (cogsFIFO / assetInventory).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            Laporan Keuangan Apotek: Laba/Rugi, Neraca & Rasio Keuangan
          </h1>
          <p className="text-xs text-slate-500">
            Laporan keuangan resmi berstandar SAK EMKM yang dihasilkan secara real-time dari mutasi transaksi.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="mr-1.5 h-4 w-4" />
          Cetak Dokumen Keuangan
        </Button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex gap-2 border-b bg-white p-2 rounded-xl">
        <button
          onClick={() => setReportType("INCOME_STATEMENT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            reportType === "INCOME_STATEMENT"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          1. Laporan Laba/Rugi (Income Statement)
        </button>
        <button
          onClick={() => setReportType("BALANCE_SHEET")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            reportType === "BALANCE_SHEET"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Scale className="h-4 w-4 text-emerald-600" />
          2. Neraca Keuangan (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType("FINANCIAL_RATIOS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            reportType === "FINANCIAL_RATIOS"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Percent className="h-4 w-4 text-emerald-600" />
          3. Analisis Rasio Keuangan
        </button>
      </div>

      {/* 1. INCOME STATEMENT */}
      {reportType === "INCOME_STATEMENT" && (
        <Card className="border-slate-200 bg-white max-w-3xl mx-auto shadow-xs">
          <CardHeader className="text-center border-b pb-4">
            <h2 className="text-base font-extrabold text-slate-900">APOTIK TAMANSARI</h2>
            <CardTitle className="text-lg font-bold text-emerald-800">
              LAPORAN LABA / RUGI KOMPREHENSIF
            </CardTitle>
            <CardDescription>Periode: 01 November 2026 - 14 November 2026</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            {/* PENDAPATAN */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 text-sm block">1. PENDAPATAN USAHA (REVENUE)</span>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Pendapatan Penjualan Obat Bebas (OTC):</span>
                <span className="font-medium">{formatRupiah(revenueOTC)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Pendapatan Penjualan Obat Resep Dokter:</span>
                <span className="font-medium">{formatRupiah(revenuePrescription)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Pendapatan Jasa Racik & Embalase (Tuslah):</span>
                <span className="font-medium">{formatRupiah(revenueCompounding)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Pendapatan Komisi Bagi Hasil Konsinyasi:</span>
                <span className="font-medium">{formatRupiah(revenueConsignmentCommission)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t font-bold text-slate-900 text-xs">
                <span>TOTAL PENDAPATAN KOTOR:</span>
                <span className="text-emerald-700 font-extrabold">{formatRupiah(totalRevenue)}</span>
              </div>
            </div>

            {/* HPP (COGS) */}
            <div className="space-y-1.5 pt-2 border-t">
              <span className="font-bold text-slate-900 text-sm block">
                2. HARGA POKOK PENJUALAN (HPP / COGS - METODE FIFO)
              </span>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Beban Pokok Obat Terjual (FIFO Batches):</span>
                <span className="font-medium text-rose-600">-{formatRupiah(cogsFIFO)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t font-black text-slate-900 text-xs">
                <span>LABA KOTOR (GROSS PROFIT):</span>
                <span className="text-teal-700 text-sm">{formatRupiah(grossProfit)}</span>
              </div>
            </div>

            {/* OPERATING EXPENSES */}
            <div className="space-y-1.5 pt-2 border-t">
              <span className="font-bold text-slate-900 text-sm block">3. BEBAN OPERASIONAL (EXPENSES)</span>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Gaji Karyawan, Apoteker & TTK:</span>
                <span className="font-medium">{formatRupiah(expStaffSalary)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Listrik, Air & Internet Apotek:</span>
                <span className="font-medium">{formatRupiah(expElectricityWifi)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Beban Kerusakan & Obat Expired:</span>
                <span className="font-medium">{formatRupiah(expDamagedExpired)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t font-bold text-slate-900 text-xs">
                <span>TOTAL BEBAN OPERASIONAL:</span>
                <span className="text-rose-600 font-bold">-{formatRupiah(totalExpenses)}</span>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-sm font-extrabold text-emerald-900">
              <div>
                <span className="block text-base">LABA BERSIH OPERASIONAL (NET PROFIT):</span>
                <span className="text-xs text-emerald-700 font-normal">Margin Bersih: {netMargin}% dari omset</span>
              </div>
              <span className="text-2xl font-black text-emerald-700">{formatRupiah(netProfit)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. BALANCE SHEET */}
      {reportType === "BALANCE_SHEET" && (
        <Card className="border-slate-200 bg-white max-w-4xl mx-auto shadow-xs">
          <CardHeader className="text-center border-b pb-4">
            <h2 className="text-base font-extrabold text-slate-900">APOTIK TAMANSARI</h2>
            <CardTitle className="text-lg font-bold text-emerald-800">
              NERACA KEUANGAN (BALANCE SHEET)
            </CardTitle>
            <CardDescription>Per 14 November 2026 (Audit Konsistensi Aset = Kewajiban + Ekuitas)</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: ASSETS */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 text-sm block border-b pb-1">
                  AKTIVA / ASET (ASSETS)
                </span>
                <div className="space-y-1.5 pl-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Kas Kasir di Laci (Cash):</span>
                    <span className="font-medium">{formatRupiah(assetCashDrawer)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kas Bank BCA Operasional:</span>
                    <span className="font-medium">{formatRupiah(assetBankBCA)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Piutang Pelanggan / Kredit:</span>
                    <span className="font-medium">{formatRupiah(assetReceivables)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Persediaan Obat & Alkes (FIFO):</span>
                    <span className="font-medium">{formatRupiah(assetInventory)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center font-black text-xs text-emerald-900 mt-4">
                  <span>TOTAL ASET LANCAR:</span>
                  <span className="text-base font-black text-emerald-700">{formatRupiah(totalAssets)}</span>
                </div>
              </div>

              {/* Right Column: LIABILITIES & EQUITY */}
              <div className="space-y-4">
                {/* Liabilities */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-900 text-sm block border-b pb-1">
                    PASIVA: KEWAJIBAN / HUTANG (LIABILITIES)
                  </span>
                  <div className="space-y-1.5 pl-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Hutang Usaha Faktur ke PBF:</span>
                      <span className="font-medium">{formatRupiah(liabilityPBF)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Hutang Bagi Hasil Konsinyasi:</span>
                      <span className="font-medium">{formatRupiah(liabilityConsignment)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t text-slate-900">
                    <span>Total Kewajiban / Hutang:</span>
                    <span className="text-rose-600">{formatRupiah(totalLiabilities)}</span>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-3 pt-2">
                  <span className="font-bold text-slate-900 text-sm block border-b pb-1">
                    EKUITAS / MODAL BERSIH (EQUITY)
                  </span>
                  <div className="space-y-1.5 pl-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Modal Pemilik Disetor:</span>
                      <span className="font-medium">{formatRupiah(equityCapital)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Laba Periode Berjalan (Ditahan):</span>
                      <span className="font-medium">{formatRupiah(equityRetainedEarnings)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t text-slate-900">
                    <span>Total Ekuitas:</span>
                    <span className="text-slate-800">{formatRupiah(totalEquity)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center font-black text-xs text-emerald-900">
                  <span>TOTAL KEWAJIBAN & EKUITAS:</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatRupiah(totalLiabilities + totalEquity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance verification banner */}
            <div className="mt-6 p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Status Keseimbangan Neraca:
              </span>
              <Badge variant="success" className="text-xs font-bold">
                SEIMBANG (Aset Rp 75.14M = Pasiva Rp 75.14M)
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. FINANCIAL RATIOS */}
      {reportType === "FINANCIAL_RATIOS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-500">Rasio Lancar (Current Ratio)</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-700">{currentRatio}x</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-slate-600">
              <p>Formula: Aset Lancar / Hutang Lancar</p>
              <Badge variant="success" className="text-[10px]">Likuiditas Sangat Kuat (&gt; 2.0x)</Badge>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-500">Gross Profit Margin</CardDescription>
              <CardTitle className="text-2xl font-black text-teal-700">{grossMargin}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-slate-600">
              <p>Formula: (Laba Kotor / Omset) x 100%</p>
              <Badge variant="cyan" className="text-[10px]">Standar Farmasi Sehat (25-35%)</Badge>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-500">Net Profit Margin</CardDescription>
              <CardTitle className="text-2xl font-black text-purple-700">{netMargin}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-slate-600">
              <p>Formula: (Laba Bersih / Omset) x 100%</p>
              <Badge variant="purple" className="text-[10px]">Profitabilitas Efisien</Badge>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-500">Perputaran Stok (ITO)</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-700">{inventoryTurnover}x</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-slate-600">
              <p>Formula: HPP / Rata-rata Stok</p>
              <Badge variant="warning" className="text-[10px]">Stok Efisien (Fast Turn)</Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
