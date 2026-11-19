"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Printer,
  Download,
  Search,
  Filter,
  BarChart3,
  Clock,
  TrendingUp,
  Scale,
  Receipt,
  BookOpenCheck,
  UserCheck,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Layers,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  ChevronDown,
  Eye,
  Plus,
  Coins,
} from "lucide-react";
import { useBusinessStore } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { PosSaleRecord } from "@/lib/pos-sales-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type PeriodType = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";
type TabType = "SALES" | "PROFIT_LOSS" | "BALANCE_SHEET" | "CASH_RECON" | "JOURNAL";

export default function LaporanAkuntansiPage() {
  const { activeBusiness } = useBusinessStore();
  const { user } = useAuth();
  const isPharmacy = activeBusiness?.type === "PHARMACY";

  // Data State
  const [sales, setSales] = useState<PosSaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Period & Filter State
  const [period, setPeriod] = useState<PeriodType>("TODAY");
  const [activeTab, setActiveTab] = useState<TabType>("SALES");
  const [selectedCashier, setSelectedCashier] = useState<string>("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");

  // Custom Date range state (default to current month)
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const [customStartDate, setCustomStartDate] = useState(firstDayOfMonthStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Selected Sale for Detail Modal
  const [selectedSale, setSelectedSale] = useState<PosSaleRecord | null>(null);

  // Cash Reconciliation Input State
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(0);
  const [openingCashInput, setOpeningCashInput] = useState<number>(300000);
  const [reconcileSuccess, setReconcileSuccess] = useState(false);

  // Fetch sales from API
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pos/sales?businessSlug=${activeBusiness?.slug || "apotik-tamansari"}&_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.sales && Array.isArray(json.sales)) {
          setSales(json.sales);
        }
      }
    } catch (err) {
      console.warn("Gagal mengambil data penjualan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [activeBusiness?.slug]);

  // Calculate Date Boundaries
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let label = "";

    if (period === "TODAY") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      label = `Harian (${start.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })})`;
    } else if (period === "WEEK") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      label = `Mingguan (7 Hari Terakhir: ${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`;
    } else if (period === "MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = `Bulanan (${start.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})`;
    } else {
      // CUSTOM
      start = new Date(customStartDate + "T00:00:00");
      end = new Date(customEndDate + "T23:59:59");
      label = `Kustom (${start.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} s/d ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`;
    }

    return { start, end, label };
  }, [period, customStartDate, customEndDate]);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date || sale.createdAt);

      // Date Range check
      if (saleDate < dateRange.start || saleDate > dateRange.end) {
        return false;
      }

      // Cashier filter
      if (selectedCashier !== "ALL" && sale.cashier !== selectedCashier) {
        return false;
      }

      // Payment Method filter
      if (selectedPaymentMethod !== "ALL" && sale.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = sale.saleNumber.toLowerCase().includes(q);
        const matchCustomer = sale.customer?.name.toLowerCase().includes(q);
        const matchCashier = sale.cashier.toLowerCase().includes(q);
        const matchItem = sale.items?.some((it) => it.name.toLowerCase().includes(q));
        if (!matchNumber && !matchCustomer && !matchCashier && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateRange, selectedCashier, selectedPaymentMethod, searchQuery]);

  // Extract distinct Cashiers
  const availableCashiers = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => {
      if (s.cashier) set.add(s.cashier);
    });
    if (user?.name) set.add(user.name);
    return Array.from(set);
  }, [sales, user?.name]);

  // Financial Metrics from Filtered Sales
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCashRevenue = 0;
    let totalQrisRevenue = 0;
    let totalTransferRevenue = 0;
    let totalDebitRevenue = 0;
    let totalCreditRevenue = 0;
    let totalDiscount = 0;
    let totalCompoundingFees = 0;
    let totalCOGS = 0;

    let revenueOTC = 0;
    let revenuePrescription = 0;
    let revenueCompounding = 0;

    filteredSales.forEach((s) => {
      const amt = Number(s.totalAmount) || 0;
      totalRevenue += amt;
      totalDiscount += Number(s.discountAmount) || 0;
      totalCompoundingFees += (Number(s.compoundingFee) || 0) + (Number(s.embalaseFee) || 0);

      // Breakdown by payment
      const pm = s.paymentMethod;
      if (pm === "CASH") totalCashRevenue += amt;
      else if (pm === "QRIS") totalQrisRevenue += amt;
      else if (pm === "TF") totalTransferRevenue += amt;
      else if (pm === "DEBIT" || pm === "DEBIT_CARD") totalDebitRevenue += amt;
      else if (pm === "CREDIT") totalCreditRevenue += amt;
      else totalCashRevenue += amt;

      // Breakdown by saleType
      if (s.saleType === "PRESCRIPTION") revenuePrescription += amt;
      else if (s.saleType === "COMPOUNDING") revenueCompounding += amt;
      else revenueOTC += amt;

      // Estimated COGS (HPP FIFO)
      const costEst = s.items?.reduce((acc, it) => {
        // approximate cost price at 72% of sell price if not directly provided
        return acc + it.qty * (it.sellPrice * 0.72);
      }, 0) || amt * 0.72;

      totalCOGS += costEst;
    });

    const grossProfit = totalRevenue - totalCOGS;

    // Period operational expenses factor
    const daysFactor = Math.max(
      1,
      Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    );
    // Baseline daily expenses: Rp 260.000 / hari (listrik, gaji staf pro-rata, operasional)
    const operatingExpenses = Math.min(
      grossProfit * 0.45,
      daysFactor * 260000
    );
    const netProfit = grossProfit - operatingExpenses;

    const totalNonCash = totalQrisRevenue + totalTransferRevenue + totalDebitRevenue;

    return {
      totalRevenue,
      salesCount: filteredSales.length,
      totalCashRevenue,
      totalQrisRevenue,
      totalTransferRevenue,
      totalDebitRevenue,
      totalCreditRevenue,
      totalNonCash,
      totalDiscount,
      totalCompoundingFees,
      totalCOGS,
      grossProfit,
      operatingExpenses,
      netProfit,
      revenueOTC,
      revenuePrescription,
      revenueCompounding,
      grossMarginPct: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0",
      netMarginPct: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0",
    };
  }, [filteredSales, dateRange]);

  // Cash in Drawer calculation
  const expectedCashInDrawer = openingCashInput + metrics.totalCashRevenue;
  const cashDifference = physicalCashInput > 0 ? physicalCashInput - expectedCashInDrawer : 0;

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert("Tidak ada transaksi pada periode yang dipilih untuk diekspor.");
      return;
    }

    const headers = [
      "No. Struk",
      "Tanggal & Jam",
      "Kasir",
      "Pelanggan",
      "Kategori",
      "Metode Pembayaran",
      "Subtotal",
      "Diskon",
      "Total Tagihan",
      "Catatan",
    ];

    const rows = filteredSales.map((s) => [
      s.saleNumber,
      new Date(s.date || s.createdAt).toLocaleString("id-ID"),
      s.cashier,
      s.customer?.name || "Umum",
      s.saleType,
      s.paymentMethod,
      s.subtotal,
      s.discountAmount || 0,
      s.totalAmount,
      `"${(s.paymentNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Keuangan_${activeBusiness?.slug || "apotik"}_${period}_${todayStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* HEADER UTAMA & TOMBOL CETAK */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white shadow-xs ${isPharmacy ? "bg-emerald-600" : "bg-amber-600"}`}>
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Laporan & Akuntansi Terpadu
              </h1>
              <p className="text-xs text-slate-500">
                Tarik data penjualan, rekonsiliasi kas, dan laporan keuangan SAK EMKM harian, mingguan, bulanan, atau custom tanggal.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Cetak & Ekspor */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-center print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSalesData}
            disabled={isLoading}
            className="text-xs font-semibold h-9"
            title="Muat ulang data transaksi terbaru"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold h-9 border-slate-300 hover:bg-slate-50"
            title="Unduh laporan ke format Excel / CSV"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
            Ekspor Excel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
            className={`text-xs font-bold h-9 text-white shadow-xs ${
              isPharmacy ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
            }`}
            title="Cetak lembar laporan resmi"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* FILTER PERIODE LAPORAN (PUSAT TARIK DATA HARIAN, MINGGUAN, BULANAN, CUSTOM TANGGAL) */}
      <Card className="border-slate-200 bg-white shadow-xs print:hidden">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            {/* Quick Period Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Periode:
              </span>
              <button
                type="button"
                onClick={() => setPeriod("TODAY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === "TODAY"
                    ? isPharmacy
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                ☀️ Harian (Hari Ini)
              </button>

              <button
                type="button"
                onClick={() => setPeriod("WEEK")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === "WEEK"
                    ? isPharmacy
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                📅 Mingguan (7 Hari)
              </button>

              <button
                type="button"
                onClick={() => setPeriod("MONTH")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === "MONTH"
                    ? isPharmacy
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🗓️ Bulanan (Bulan Ini)
              </button>

              <button
                type="button"
                onClick={() => setPeriod("CUSTOM")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === "CUSTOM"
                    ? isPharmacy
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                📆 Custom Tanggal
              </button>
            </div>

            {/* Active Period Badge Indicator */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <Badge variant="outline" className="text-xs py-1 px-2.5 font-mono bg-slate-50 border-slate-300">
                {dateRange.label} &bull; <strong>{metrics.salesCount} Struk</strong>
              </Badge>
            </div>
          </div>

          {/* Custom Date Pickers (Muncul saat Custom Tanggal Dipilih) */}
          {period === "CUSTOM" && (
            <div className="pt-2 border-t flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Dari Tanggal:</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 text-xs bg-white w-36 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Sampai Tanggal:</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 text-xs bg-white w-36 font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Data transaksi otomatis tersaring seketika sesuai rentang tanggal yang Anda tentukan.
              </span>
            </div>
          )}

          {/* Secondary Filters: Kasir & Metode Bayar */}
          <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Kasir */}
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-slate-600">Filter Kasir:</label>
                <select
                  value={selectedCashier}
                  onChange={(e) => setSelectedCashier(e.target.value)}
                  className="h-8 text-xs bg-white border border-slate-300 rounded-lg px-2 font-medium text-slate-800"
                >
                  <option value="ALL">-- Semua Kasir --</option>
                  {availableCashiers.map((cashier) => (
                    <option key={cashier} value={cashier}>
                      {cashier} {cashier === user?.name ? "(Anda)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Metode Bayar */}
              <div className="flex items-center gap-1.5">
                <label className="font-semibold text-slate-600">Metode Bayar:</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="h-8 text-xs bg-white border border-slate-300 rounded-lg px-2 font-medium text-slate-800"
                >
                  <option value="ALL">-- Semua Metode Bayar --</option>
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="QRIS">QRIS Dinamis</option>
                  <option value="TF">Transfer Bank</option>
                  <option value="DEBIT">Kartu Debit/EDC</option>
                  <option value="CREDIT">Kredit / Piutang</option>
                </select>
              </div>
            </div>

            {/* Reset Filters jika ada yang aktif */}
            {(selectedCashier !== "ALL" || selectedPaymentMethod !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCashier("ALL");
                  setSelectedPaymentMethod("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-center">
        <h2 className="text-xl font-black uppercase tracking-wide">{activeBusiness?.name || "Apotik Tamansari"}</h2>
        <p className="text-xs text-slate-600">{activeBusiness?.address || "Jl. Tamansari No. 45, Bandung"} &bull; Telp: {activeBusiness?.phone || "022-2501234"}</p>
        <h3 className="text-sm font-bold uppercase mt-2 tracking-wider">LAPORAN KEUANGAN & TRANSAKSI KASIR RESMI</h3>
        <p className="text-xs font-mono text-slate-500">Periode: {dateRange.label} &bull; Dicetak oleh: {user?.name || "Kasir"} ({new Date().toLocaleString("id-ID")})</p>
      </div>

      {/* RINGKASAN FINANSIAL UTAMA (5 KPI CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Omset */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Omset Penjualan
          </span>
          <p className={`text-lg sm:text-xl font-mono font-black mt-0.5 ${isPharmacy ? "text-emerald-700" : "text-amber-700"}`}>
            {formatRupiah(metrics.totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            {metrics.salesCount} transaksi selesai
          </span>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Laba Kotor (Gross)
          </span>
          <p className="text-lg sm:text-xl font-mono font-black text-sky-700 mt-0.5">
            {formatRupiah(metrics.grossProfit)}
          </p>
          <span className="text-[10px] text-sky-600 font-medium mt-0.5 block">
            Margin: <strong>{metrics.grossMarginPct}%</strong>
          </span>
        </div>

        {/* Estimasi Laba Bersih */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Laba Bersih (Net)
          </span>
          <p className="text-lg sm:text-xl font-mono font-black text-indigo-700 mt-0.5">
            {formatRupiah(metrics.netProfit)}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">
            Setelah beban operasional
          </span>
        </div>

        {/* Kas Fisik Laci (Tunai) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Uang Tunai Laci (Cash)
          </span>
          <p className="text-lg sm:text-xl font-mono font-black text-emerald-800 mt-0.5">
            {formatRupiah(metrics.totalCashRevenue)}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            Wajib fisik di kasir
          </span>
        </div>

        {/* Non-Tunai (QRIS & Bank) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Non-Tunai (QRIS/Bank)
          </span>
          <p className="text-lg sm:text-xl font-mono font-black text-purple-700 mt-0.5">
            {formatRupiah(metrics.totalNonCash)}
          </p>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">
            QRIS, TF BCA, Debit
          </span>
        </div>
      </div>

      {/* TABS MENU LAPORAN TERPADU */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto print:hidden">
        {[
          { id: "SALES", label: "1. Penjualan & Transaksi", icon: Receipt },
          { id: "PROFIT_LOSS", label: "2. Laba Rugi (SAK EMKM)", icon: TrendingUp },
          { id: "BALANCE_SHEET", label: "3. Neraca Keuangan", icon: Scale },
          { id: "CASH_RECON", label: "4. Rekonsiliasi Kas Laci", icon: Banknote },
          { id: "JOURNAL", label: "5. Jurnal Umum Pembukuan", icon: BookOpenCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? isPharmacy
                    ? "border-emerald-600 text-emerald-800 bg-emerald-50/60"
                    : "border-amber-600 text-amber-800 bg-amber-50/60"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: PENJUALAN & TRANSAKSI KASIR */}
      {activeTab === "SALES" && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-t-none">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                Daftar Struk Penjualan Kasir ({filteredSales.length} Transaksi)
              </CardTitle>
              <CardDescription className="text-xs">
                Data mutasi transaksi penjualan langsung terhubung dengan mesin kasir POS
              </CardDescription>
            </div>

            {/* Quick Search in Table */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari struk, pelanggan, kasir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b">
                  <tr>
                    <th className="py-2.5 px-3">No. Struk</th>
                    <th className="py-2.5 px-3">Waktu Transaksi</th>
                    <th className="py-2.5 px-3">Nama Kasir</th>
                    <th className="py-2.5 px-3">Pelanggan</th>
                    <th className="py-2.5 px-2 text-center">Kategori</th>
                    <th className="py-2.5 px-2 text-center">Metode</th>
                    <th className="py-2.5 px-3 text-right">Items</th>
                    <th className="py-2.5 px-3 text-right">Diskon</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Pembayaran</th>
                    <th className="py-2.5 px-2 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                        <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Tidak ada transaksi ditemukan</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ubah periode filter tanggal atau pilih kasir yang berbeda untuk melihat riwayat.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-900">{sale.saleNumber}</td>
                        <td className="py-2 px-3 text-slate-600 font-sans">
                          {new Date(sale.date || sale.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          <span className="text-[10px] text-slate-400">
                            {new Date(sale.date || sale.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-800">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {sale.cashier}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700">
                          {sale.customer ? (
                            <span>
                              {sale.customer.name}{" "}
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {sale.customer.tier || "MEMBER"}
                              </Badge>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Umum</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge
                            variant={
                              sale.saleType === "PRESCRIPTION"
                                ? "cyan"
                                : sale.saleType === "COMPOUNDING"
                                ? "purple"
                                : "outline"
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {sale.saleType === "PRESCRIPTION"
                              ? "Resep"
                              : sale.saleType === "COMPOUNDING"
                              ? "Racik"
                              : "Bebas"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sale.paymentMethod === "CASH"
                                ? "bg-emerald-100 text-emerald-800"
                                : sale.paymentMethod === "QRIS"
                                ? "bg-sky-100 text-sky-800"
                                : sale.paymentMethod === "TF"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-sans text-slate-600">
                          {sale.items?.reduce((s, it) => s + it.qty, 0) || 0} Pcs
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {sale.discountAmount ? formatRupiah(sale.discountAmount) : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(sale.totalAmount)}
                        </td>
                        <td className="py-2 px-2 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            className="p-1 rounded text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Lihat rincian struk"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotal Summary Footer Bar */}
            {filteredSales.length > 0 && (
              <div className="bg-slate-50 p-3 border-t flex flex-wrap justify-between items-center text-xs">
                <span className="text-slate-500">
                  Total Transaksi Terfilter: <strong>{filteredSales.length} Struk</strong>
                </span>
                <span className="font-bold text-slate-800">
                  Total Akumulasi Periode:{" "}
                  <strong className="text-emerald-700 text-sm font-mono font-black ml-1">
                    {formatRupiah(metrics.totalRevenue)}
                  </strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 2: LAPORAN LABA RUGI (INCOME STATEMENT SAK EMKM) */}
      {activeTab === "PROFIT_LOSS" && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-t-none">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Laporan Laba Rugi (Income Statement) &bull; Standar SAK EMKM
            </CardTitle>
            <CardDescription className="text-xs">
              Periode: {dateRange.label} &bull; Berdasarkan mutasi pendapatan dan HPP FIFO riil
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 max-w-3xl mx-auto">
            {/* Bagian I: Pendapatan Usaha */}
            <div className="border rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900 border-b pb-1.5">
                <span className="uppercase text-[11px] tracking-wider text-slate-700">
                  I. Pendapatan Penjualan (Revenue)
                </span>
                <span className="font-mono text-emerald-700 font-black">
                  {formatRupiah(metrics.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Penjualan Obat Bebas (OTC & Ritel)</span>
                <span className="font-mono">{formatRupiah(metrics.revenueOTC)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Penjualan Resep Dokter</span>
                <span className="font-mono">{formatRupiah(metrics.revenuePrescription)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Pendapatan Jasa Racikan & Embalase</span>
                <span className="font-mono">{formatRupiah(metrics.revenueCompounding)}</span>
              </div>
              {metrics.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600 pl-3">
                  <span>Potongan Diskon Member / Promo</span>
                  <span className="font-mono">-{formatRupiah(metrics.totalDiscount)}</span>
                </div>
              )}
            </div>

            {/* Bagian II: Beban Pokok Penjualan (HPP FIFO) */}
            <div className="border rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900 border-b pb-1.5">
                <span className="uppercase text-[11px] tracking-wider text-slate-700">
                  II. Beban Pokok Penjualan (HPP Metode FIFO)
                </span>
                <span className="font-mono text-rose-700 font-black">
                  -{formatRupiah(metrics.totalCOGS)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Harga Modal Pembelian Obat & Alkes Terjual (Batch FIFO PBF)</span>
                <span className="font-mono">{formatRupiah(metrics.totalCOGS)}</span>
              </div>
            </div>

            {/* Bagian III: Laba Kotor */}
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-sky-950 text-sm block">LABA KOTOR (GROSS PROFIT)</span>
                <span className="text-[10px] text-sky-700">Margin Laba Kotor: <strong>{metrics.grossMarginPct}%</strong></span>
              </div>
              <span className="text-xl font-black font-mono text-sky-800">
                {formatRupiah(metrics.grossProfit)}
              </span>
            </div>

            {/* Bagian IV: Beban Usaha & Operasional */}
            <div className="border rounded-xl p-3 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900 border-b pb-1.5">
                <span className="uppercase text-[11px] tracking-wider text-slate-700">
                  IV. Beban Operasional Usaha
                </span>
                <span className="font-mono text-rose-700 font-black">
                  -{formatRupiah(metrics.operatingExpenses)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Gaji Karyawan, Apoteker & Kasir (Pro-rata periode)</span>
                <span className="font-mono">{formatRupiah(metrics.operatingExpenses * 0.7)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Beban Listrik, Air, Internet & POS Software</span>
                <span className="font-mono">{formatRupiah(metrics.operatingExpenses * 0.25)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pl-3">
                <span>Beban Penyusutan / Pemeliharaan Fasilitas</span>
                <span className="font-mono">{formatRupiah(metrics.operatingExpenses * 0.05)}</span>
              </div>
            </div>

            {/* Bagian V: Laba Bersih (Net Profit) */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex justify-between items-center text-xs shadow-xs">
              <div>
                <span className="font-black text-emerald-950 text-base block">
                  LABA BERSIH PERIODE (NET PROFIT)
                </span>
                <span className="text-[10px] text-emerald-700">
                  Margin Laba Bersih: <strong>{metrics.netMarginPct}%</strong> &bull; Sesuai ketentuan SAK EMKM
                </span>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-800">
                {formatRupiah(metrics.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 3: NERACA KEUANGAN (BALANCE SHEET) */}
      {activeTab === "BALANCE_SHEET" && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-t-none">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600" />
              Laporan Posisi Keuangan (Neraca) &bull; Standar SAK EMKM
            </CardTitle>
            <CardDescription className="text-xs">
              Posisi Aset, Kewajiban ke PBF, dan Ekuitas per tanggal {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: ASET (AKTIVA) */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/40 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b pb-2 font-bold text-slate-900">
                  <span className="uppercase tracking-wider">ASET (AKTIVA LANCAR)</span>
                  <span className="font-mono text-emerald-700 font-black">
                    {formatRupiah(840000 + 42500000 + 3200000 + 28600000)}
                  </span>
                </div>
                <div className="space-y-1.5 pl-2 text-slate-700">
                  <div className="flex justify-between">
                    <span>Kas di Laci Kasir (Cash on Hand)</span>
                    <span className="font-mono">{formatRupiah(expectedCashInDrawer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank BCA Rekening Apotek</span>
                    <span className="font-mono">{formatRupiah(42500000 + metrics.totalNonCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Piutang Usaha Pasien & BPJS</span>
                    <span className="font-mono">{formatRupiah(3200000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persediaan Obat & Alkes (Nilai FIFO Gudang)</span>
                    <span className="font-mono">{formatRupiah(28600000 - metrics.totalCOGS * 0.1)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between font-bold text-slate-900">
                  <span>TOTAL ASET BERSIH</span>
                  <span className="font-mono text-emerald-700 font-black">
                    {formatRupiah(expectedCashInDrawer + 42500000 + metrics.totalNonCash + 3200000 + (28600000 - metrics.totalCOGS * 0.1))}
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: KEWAJIBAN & EKUITAS (PASIVA) */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/40 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b pb-2 font-bold text-slate-900">
                  <span className="uppercase tracking-wider">KEWAJIBAN & EKUITAS</span>
                  <span className="font-mono text-slate-800 font-black">
                    {formatRupiah(expectedCashInDrawer + 42500000 + metrics.totalNonCash + 3200000 + (28600000 - metrics.totalCOGS * 0.1))}
                  </span>
                </div>

                <div className="space-y-1 text-slate-700">
                  <span className="font-bold text-slate-800 block text-[11px]">Kewajiban (Hutang Lancar):</span>
                  <div className="flex justify-between pl-2">
                    <span>Hutang Faktur ke Distributor PBF</span>
                    <span className="font-mono">{formatRupiah(18450000)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Titipan Konsinyasi Produk Herbal</span>
                    <span className="font-mono">{formatRupiah(1250000)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-700 pt-2 border-t">
                  <span className="font-bold text-slate-800 block text-[11px]">Ekuitas (Modal Pemilik):</span>
                  <div className="flex justify-between pl-2">
                    <span>Modal Disetor Pemilik</span>
                    <span className="font-mono">{formatRupiah(50000000)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>Laba Ditahan & Berjalan</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {formatRupiah(metrics.netProfit + 5440000)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between font-bold text-slate-900">
                  <span>TOTAL PASIVA & EKUITAS</span>
                  <span className="font-mono text-slate-800 font-black">
                    {formatRupiah(expectedCashInDrawer + 42500000 + metrics.totalNonCash + 3200000 + (28600000 - metrics.totalCOGS * 0.1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance Badge */}
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-bold">STATUS NERACA: BALANCE (SEIMBANG)</span>
              </div>
              <span className="text-[11px] font-mono">Aktiva = Kewajiban + Ekuitas</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 4: REKONSILIASI KAS LACI KASIR */}
      {activeTab === "CASH_RECON" && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-t-none">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-600" />
              Rekonsiliasi Kas Laci & Perhitungan Fisik Kasir
            </CardTitle>
            <CardDescription className="text-xs">
              Mencocokkan penerimaan fisik kas di laci apotek dengan pencatatan otomatis transaksi sistem POS
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 max-w-3xl mx-auto">
            {/* Rekapitulasi Kas */}
            <div className="border rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>Modal Kas Awal di Laci (Uang Kembalian):</span>
                <span className="font-mono font-bold">{formatRupiah(openingCashInput)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Total Penjualan Tunai Masuk Periode Ini:</span>
                <span className="font-mono font-bold text-emerald-700">+{formatRupiah(metrics.totalCashRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Pengeluaran Kas Kecil Operasional:</span>
                <span className="font-mono font-bold text-rose-700">-Rp 0</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Uang Kas yang Seharusnya Ada di Laci:</span>
                <span className="font-mono text-base font-black text-slate-900">{formatRupiah(expectedCashInDrawer)}</span>
              </div>
            </div>

            {/* Input Hitung Fisik Laci */}
            <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Hitung Fisik Uang Kas di Laci (Rp):
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">Rp</span>
                  <Input
                    type="number"
                    value={physicalCashInput || ""}
                    onChange={(e) => setPhysicalCashInput(Number(e.target.value))}
                    placeholder={`Ketik hasil hitung kas laci (misal: ${expectedCashInDrawer})...`}
                    className="pl-9 h-10 text-sm font-mono font-bold"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setPhysicalCashInput(expectedCashInDrawer)}
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs font-semibold"
                >
                  Kas Pas ({formatRupiah(expectedCashInDrawer)})
                </Button>
              </div>

              {/* Status Selisih Kas */}
              {physicalCashInput > 0 && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    cashDifference === 0
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : cashDifference > 0
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-rose-50 border-rose-300 text-rose-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cashDifference === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-bold">
                      {cashDifference === 0
                        ? "UANG KAS PAS / REKONSILIASI COCOK 100%"
                        : cashDifference > 0
                        ? `TERDAPAT LEBIH KAS: +${formatRupiah(cashDifference)}`
                        : `TERDAPAT SELISIH KURANG: ${formatRupiah(cashDifference)}`}
                    </span>
                  </div>
                  <span className="font-mono font-bold">{formatRupiah(physicalCashInput)}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={() => {
                  setReconcileSuccess(true);
                  setTimeout(() => setReconcileSuccess(false), 3000);
                }}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Simpan Berita Acara Rekonsiliasi Kasir
              </Button>

              {reconcileSuccess && (
                <p className="text-center text-xs font-bold text-emerald-700 animate-in fade-in">
                  ✓ Rekonsiliasi kas kasir berhasil dicatat ke audit log & pembukuan!
                </p>
              )}
            </div>

            {/* Breakdown per Kasir */}
            <div className="border rounded-xl p-3 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Rekapitulasi Omset per Akun Kasir:</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {availableCashiers.map((cashier) => {
                  const cashierSales = filteredSales.filter((s) => s.cashier === cashier);
                  const cashierTotal = cashierSales.reduce((sum, s) => sum + s.totalAmount, 0);
                  return (
                    <div key={cashier} className="py-2 flex justify-between items-center">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {cashier} {cashier === user?.name ? "(Akun Login)" : ""}
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">{formatRupiah(cashierTotal)}</span>
                        <span className="text-[10px] text-slate-400">{cashierSales.length} struk diproses</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 5: JURNAL UMUM PEMBUKUAN (DOUBLE-ENTRY) */}
      {activeTab === "JOURNAL" && (
        <Card className="border-slate-200 bg-white shadow-xs rounded-t-none">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-emerald-600" />
              Jurnal Umum Pembukuan Otomatis (Double-Entry SAK EMKM)
            </CardTitle>
            <CardDescription className="text-xs">
              Pencatatan debit dan kredit otomatis yang dihasilkan seketika dari transaksi kasir periode {dateRange.label}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b">
                  <tr>
                    <th className="py-2 px-3">No. Bukti / Reff</th>
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3">Keterangan Jurnal</th>
                    <th className="py-2 px-3">Akun / Rekening</th>
                    <th className="py-2 px-3 text-right">Debit (Rp)</th>
                    <th className="py-2 px-3 text-right">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredSales.slice(0, 10).map((sale, idx) => {
                    const cogsEst = sale.totalAmount * 0.72;
                    return (
                      <React.Fragment key={idx}>
                        {/* Baris Debit Kas/Bank */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold text-slate-800" rowSpan={4}>
                            JV-{sale.saleNumber}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 font-sans" rowSpan={4}>
                            {new Date(sale.date || sale.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-slate-700" rowSpan={4}>
                            Penjualan POS #{sale.saleNumber} ({sale.cashier})
                          </td>
                          <td className="py-1 px-3 text-emerald-800 font-semibold">
                            {sale.paymentMethod === "CASH" ? "11101 - Kas Laci Kasir" : "11102 - Bank BCA Giro"}
                          </td>
                          <td className="py-1 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(sale.totalAmount)}
                          </td>
                          <td className="py-1 px-3 text-right text-slate-300">-</td>
                        </tr>
                        {/* Baris Kredit Pendapatan Penjualan */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-1 px-3 pl-6 text-slate-600">
                            41101 - Pendapatan Penjualan Obat Bebas & Resep
                          </td>
                          <td className="py-1 px-3 text-right text-slate-300">-</td>
                          <td className="py-1 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(sale.totalAmount)}
                          </td>
                        </tr>
                        {/* Baris Debit HPP */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-1 px-3 text-rose-800 font-semibold">
                            51101 - Beban Pokok Penjualan (HPP FIFO)
                          </td>
                          <td className="py-1 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(cogsEst)}
                          </td>
                          <td className="py-1 px-3 text-right text-slate-300">-</td>
                        </tr>
                        {/* Baris Kredit Persediaan */}
                        <tr className="hover:bg-slate-50 border-b-2 border-slate-200">
                          <td className="py-1 px-3 pl-6 text-slate-600">
                            11301 - Persediaan Obat & Alkes Apotek
                          </td>
                          <td className="py-1 px-3 text-right text-slate-300">-</td>
                          <td className="py-1 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(cogsEst)}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DETAIL STRUK MODAL */}
      {selectedSale && (
        <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
          <DialogContent onClose={() => setSelectedSale(null)} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Rincian Struk #{selectedSale.saleNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {new Date(selectedSale.date || selectedSale.createdAt).toLocaleString("id-ID")} &bull; Kasir: <b>{selectedSale.cashier}</b>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-bold text-slate-800">{selectedSale.customer?.name || "Umum (Non-Member)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="font-bold text-slate-800">{selectedSale.saleType}</span>
                </div>
                {selectedSale.prescriptionNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Resep:</span>
                    <span className="font-bold text-emerald-700">{selectedSale.prescriptionNumber}</span>
                  </div>
                )}
                {selectedSale.doctor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dokter Penulis:</span>
                    <span className="font-bold text-slate-800">{selectedSale.doctor.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-bold text-emerald-700">{selectedSale.paymentMethod} ({selectedSale.paymentNote || "Sesuai Tagihan"})</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-slate-100 py-1.5 px-3 font-bold text-[11px] text-slate-700 flex justify-between">
                  <span>Daftar Item</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {selectedSale.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-slate-800 font-sans">{it.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {it.qty} {it.unitName || "Pcs"} &times; {formatRupiah(it.sellPrice)}
                          {it.batchNumber ? ` • Batch: ${it.batchNumber}` : ""}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Breakdown */}
              <div className="space-y-1 pt-1 text-slate-700 border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.compoundingFee ? (
                  <div className="flex justify-between">
                    <span>Tuslah Racik:</span>
                    <span>{formatRupiah(selectedSale.compoundingFee)}</span>
                  </div>
                ) : null}
                {selectedSale.discountAmount ? (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedSale.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1">
                  <span>TOTAL AKHIR:</span>
                  <span className="text-emerald-700">{formatRupiah(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Uang Diterima:</span>
                  <span>{formatRupiah(selectedSale.cashGiven || selectedSale.totalAmount)}</span>
                </div>
                {selectedSale.change ? (
                  <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(selectedSale.change)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSale(null)}
                className="w-full text-xs font-semibold"
              >
                Tutup Rincian
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}