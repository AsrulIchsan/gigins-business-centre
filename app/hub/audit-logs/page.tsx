"use client";

/**
 * /hub/audit-logs/page.tsx
 * Portal Utama Owner — Login Activity & Riwayat Aktivitas Pegawai (Audit Trail)
 * Tab 1: Login History (Waktu, Device, IP, Status)
 * Tab 2: Audit Trail Kronologis Perubahan Data (Old vs New Data Comparison Modal)
 */

import { useState } from "react";
import {
  History,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Pill,
  Store,
  Clock,
  Laptop,
  Smartphone,
  Eye,
  Download,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  FileText,
  Calendar,
  X,
  RefreshCw,
} from "lucide-react";
import { HubHeader } from "@/components/hub/hub-header";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface LoginLogItem {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  businessName: string;
  businessSlug: string;
  time: string;
  timestamp: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  ipAddress: string;
  status: "SUCCESS" | "FAILED";
  failReason?: string;
}

interface ActivityLogItem {
  id: string;
  userName: string;
  userRole: string;
  businessName: string;
  businessSlug: string;
  module: "POS" | "PRODUCT" | "PURCHASE" | "STOCK" | "FINANCE" | "USER" | "CRM" | "SETTING";
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID" | "APPROVE" | "REJECT" | "LOGIN";
  entityId: string;
  entityName: string;
  description: string;
  time: string;
  timestamp: string;
  ipAddress: string;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_LOGIN_LOGS: LoginLogItem[] = [
  {
    id: "log-01",
    userName: "Gigin",
    userEmail: "admin@apotiktamansari.com",
    role: "OWNER",
    businessName: "Gigin's Business Centre (Portal)",
    businessSlug: "all",
    time: "Hari ini, 07:30 WIB",
    timestamp: "2026-11-15T07:30:00+07:00",
    device: "Chrome 122.0 / Windows 11",
    deviceType: "desktop",
    ipAddress: "192.168.1.1 (LAN Kantor)",
    status: "SUCCESS",
  },
  {
    id: "log-02",
    userName: "Siti Rahma, A.Md.Farm",
    userEmail: "kasir@apotiktamansari.com",
    role: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    time: "Hari ini, 07:00 WIB",
    timestamp: "2026-11-15T07:00:00+07:00",
    device: "Chrome Mobile / Tablet POS Android",
    deviceType: "tablet",
    ipAddress: "192.168.1.15 (Kasir 1)",
    status: "SUCCESS",
  },
  {
    id: "log-03",
    userName: "Percobaan Login Tak Dikenal",
    userEmail: "hacker@test.com",
    role: "UNKNOWN",
    businessName: "Portal Utama",
    businessSlug: "all",
    time: "Hari ini, 06:14 WIB",
    timestamp: "2026-11-15T06:14:00+07:00",
    device: "Firefox 118 / Linux Ubuntu",
    deviceType: "desktop",
    ipAddress: "182.253.110.42 (IP Publik)",
    status: "FAILED",
    failReason: "Kombinasi email atau password salah (3x percobaan)",
  },
  {
    id: "log-04",
    userName: "Budi Santoso",
    userEmail: "budi@pasarlelea.com",
    role: "MANAGER",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    time: "Hari ini, 06:05 WIB",
    timestamp: "2026-11-15T06:05:00+07:00",
    device: "Safari 17.2 / iPad Air",
    deviceType: "tablet",
    ipAddress: "192.168.2.8 (Kasir Toko)",
    status: "SUCCESS",
  },
  {
    id: "log-05",
    userName: "apt. Nurul Aulia, S.Farm",
    userEmail: "nurul.aulia@apotiktamansari.com",
    role: "MANAGER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    time: "Kemarin, 21:10 WIB",
    timestamp: "2026-11-14T21:10:00+07:00",
    device: "Chrome Mobile / iPhone 15 Pro",
    deviceType: "mobile",
    ipAddress: "114.124.200.5",
    status: "SUCCESS",
  },
  {
    id: "log-06",
    userName: "Ahmad Fauzi",
    userEmail: "ahmad@pasarlelea.com",
    role: "KASIR",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    time: "Kemarin, 16:45 WIB",
    timestamp: "2026-11-14T16:45:00+07:00",
    device: "Edge 121 / Windows 10",
    deviceType: "desktop",
    ipAddress: "192.168.2.12",
    status: "FAILED",
    failReason: "Akun telah dinonaktifkan oleh Owner",
  },
  {
    id: "log-07",
    userName: "Dewi Lestari",
    userEmail: "dewi.multicabang@gigins.com",
    role: "KASIR",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    time: "Kemarin, 08:30 WIB",
    timestamp: "2026-11-14T08:30:00+07:00",
    device: "Chrome / Handheld Scanner Barcode",
    deviceType: "mobile",
    ipAddress: "192.168.2.50",
    status: "SUCCESS",
  },
];

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "act-01",
    userName: "Siti Rahma, A.Md.Farm",
    userRole: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "POS",
    action: "CREATE",
    entityId: "SL-TS-894102",
    entityName: "Struk #SL-TS-894102",
    description: "Transaksi Kasir Penjualan Umum Tunai berhasil diselesaikan",
    time: "10 menit lalu (07:42 WIB)",
    timestamp: "2026-11-15T07:42:00+07:00",
    ipAddress: "192.168.1.15",
    oldData: null,
    newData: {
      saleNumber: "SL-TS-894102",
      totalAmount: 145000,
      paymentMethod: "CASH",
      cashGiven: 150000,
      change: 5000,
      items: [
        { name: "Amoxicillin 500mg", qty: 10, unit: "Kapsul", subtotal: 25000 },
        { name: "Paracetamol Sirup 120mg", qty: 2, unit: "Botol", subtotal: 40000 },
        { name: "Betadine Antiseptik 60ml", qty: 1, unit: "Botol", subtotal: 80000 },
      ],
      journalGenerated: "JV-SL-894102",
    },
  },
  {
    id: "act-02",
    userName: "Gigin",
    userRole: "OWNER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "PRODUCT",
    action: "UPDATE",
    entityId: "PRD-MED-0012",
    entityName: "Paracetamol 500mg Tablet",
    description: "Harga jual eceran dinaikkan sesuai penyesuaian HPP dari PBF Kimia Farma",
    time: "2 jam lalu (05:50 WIB)",
    timestamp: "2026-11-15T05:50:00+07:00",
    ipAddress: "192.168.1.1",
    oldData: {
      productId: "PRD-MED-0012",
      name: "Paracetamol 500mg Tablet",
      buyPriceHpp: 800,
      sellPrice: 1200,
      marginPercent: 50,
      lastUpdatedBy: "apt. Nurul Aulia",
    },
    newData: {
      productId: "PRD-MED-0012",
      name: "Paracetamol 500mg Tablet",
      buyPriceHpp: 950,
      sellPrice: 1500,
      marginPercent: 57.8,
      lastUpdatedBy: "Gigin (Owner)",
    },
  },
  {
    id: "act-03",
    userName: "Budi Santoso",
    userRole: "MANAGER",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    module: "PURCHASE",
    action: "CREATE",
    entityId: "PO-LELEA-2026-088",
    entityName: "Faktur Masuk Supplier #INV-TOYS-7721",
    description: "Penerimaan faktur masuk distributor Mobil Remote Control & Diecast",
    time: "Kemarin, 16:30 WIB",
    timestamp: "2026-11-14T16:30:00+07:00",
    ipAddress: "192.168.2.8",
    oldData: null,
    newData: {
      supplier: "CV Mainan Jaya Sentosa (Jakarta)",
      invoiceNumber: "INV-TOYS-7721",
      poNumber: "PO-LELEA-2026-088",
      totalInvoice: 4850000,
      paymentTerms: "TEMPO_30_HARI",
      dueDate: "2026-12-14",
      itemsReceived: [
        { name: "Mobil RC Rock Crawler 4WD", qty: 12, buyPrice: 175000 },
        { name: "Hotwheels Basic Box 72pcs", qty: 2, buyPrice: 1375000 },
      ],
    },
  },
  {
    id: "act-04",
    userName: "Siti Rahma, A.Md.Farm",
    userRole: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "POS",
    action: "VOID",
    entityId: "SL-TS-893991",
    entityName: "Struk #SL-TS-893991",
    description: "Void / Pembatalan transaksi kasir karena pelanggan salah bawa resep",
    time: "Kemarin, 14:15 WIB",
    timestamp: "2026-11-14T14:15:00+07:00",
    ipAddress: "192.168.1.15",
    oldData: {
      saleNumber: "SL-TS-893991",
      status: "COMPLETED",
      totalAmount: 230000,
      paymentMethod: "QRIS",
      customer: "Bp. Hendra Kurniawan",
      voidReason: null,
      voidApprovedBy: null,
    },
    newData: {
      saleNumber: "SL-TS-893991",
      status: "VOID",
      totalAmount: 0,
      paymentMethod: "REFUNDED_QRIS",
      customer: "Bp. Hendra Kurniawan",
      voidReason: "Salah bawa resep obat keras, diganti nomor resep baru",
      voidApprovedBy: "apt. Nurul Aulia (Manager)",
    },
  },
  {
    id: "act-05",
    userName: "apt. Nurul Aulia, S.Farm",
    userRole: "MANAGER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "STOCK",
    action: "APPROVE",
    entityId: "OPN-2026-11-14",
    entityName: "Stok Opname Rak Kapsul & Sirup",
    description: "Approval penyesuaian selisih stok fisik bulanan apotek",
    time: "Kemarin, 11:00 WIB",
    timestamp: "2026-11-14T11:00:00+07:00",
    ipAddress: "192.168.1.10",
    oldData: {
      opnameId: "OPN-2026-11-14",
      status: "DRAFT_PENDING_APPROVAL",
      systemRecordedTotalUnits: 1420,
      physicalCountedTotalUnits: 1418,
      discrepancyUnits: -2,
      financialImpact: -15000,
    },
    newData: {
      opnameId: "OPN-2026-11-14",
      status: "APPROVED_ADJUSTED",
      approvedBy: "apt. Nurul Aulia, S.Farm",
      journalAdjustment: "JV-OPN-20261114-01",
      notes: "Selisih 2 botol rusak pecah saat display, dialokasikan ke Beban Kerusakan Obat",
    },
  },
  {
    id: "act-06",
    userName: "Gigin",
    userRole: "OWNER",
    businessName: "Gigin's Business Centre",
    businessSlug: "all",
    module: "USER",
    action: "UPDATE",
    entityId: "usr-04",
    entityName: "Ahmad Fauzi (Kasir)",
    description: "Status akun diubah menjadi Nonaktif (akses diblokir)",
    time: "2 hari lalu (13/11/2026)",
    timestamp: "2026-11-13T10:00:00+07:00",
    ipAddress: "192.168.1.1",
    oldData: {
      userId: "usr-04",
      name: "Ahmad Fauzi",
      isActive: true,
      role: "KASIR",
      assignedTo: "Toko Mainan Pasar Lelea",
    },
    newData: {
      userId: "usr-04",
      name: "Ahmad Fauzi",
      isActive: false,
      blockedReason: "Pegawai mutasi tugas sementara",
      updatedBy: "Gigin (Owner)",
    },
  },
];

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<"login" | "activity">("login");

  // Tab 1 (Login History) State
  const [loginSearch, setLoginSearch] = useState("");
  const [loginBusinessFilter, setLoginBusinessFilter] = useState("ALL");
  const [loginStatusFilter, setLoginStatusFilter] = useState("ALL");

  // Tab 2 (Activity Logs) State
  const [actSearch, setActSearch] = useState("");
  const [actBusinessFilter, setActBusinessFilter] = useState("ALL");
  const [actUserFilter, setActUserFilter] = useState("ALL");
  const [actModuleFilter, setActModuleFilter] = useState("ALL");
  const [actActionFilter, setActActionFilter] = useState("ALL");

  // Detail Modal State (Comparison Before / After)
  const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);

  // Filtered Login Logs
  const filteredLoginLogs = MOCK_LOGIN_LOGS.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(loginSearch.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(loginSearch.toLowerCase()) ||
      log.ipAddress.includes(loginSearch);

    if (!matchesSearch) return false;

    if (loginBusinessFilter !== "ALL" && log.businessSlug !== loginBusinessFilter) return false;
    if (loginStatusFilter !== "ALL" && log.status !== loginStatusFilter) return false;

    return true;
  });

  // Filtered Activity Logs
  const filteredActivityLogs = MOCK_ACTIVITY_LOGS.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(actSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(actSearch.toLowerCase()) ||
      log.entityName.toLowerCase().includes(actSearch.toLowerCase()) ||
      log.entityId.toLowerCase().includes(actSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (actBusinessFilter !== "ALL" && log.businessSlug !== actBusinessFilter) return false;
    if (actUserFilter !== "ALL" && log.userName !== actUserFilter) return false;
    if (actModuleFilter !== "ALL" && log.module !== actModuleFilter) return false;
    if (actActionFilter !== "ALL" && log.action !== actActionFilter) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <HubHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <History className="w-4 h-4" />
              <span>GIGIN'S BUSINESS CENTRE · AUDIT TRAIL & SECURITY</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Audit Logs & Security Monitoring
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Awasi seluruh riwayat login dan rekaman perubahan data (sebelum vs sesudah) di semua unit bisnis.
            </p>
          </div>

          <button
            onClick={() => alert("Mengunduh log aktivitas (Format CSV/Excel siap diarsipkan)...")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Laporan Audit
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs mb-6 inline-flex max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "login"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Tab 1: Login Activity ({MOCK_LOGIN_LOGS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "activity"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tab 2: Audit Trail Perubahan Data ({MOCK_ACTIVITY_LOGS.length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════
            TAB 1: LOGIN ACTIVITY
           ══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "login" && (
          <div className="space-y-6">
            {/* KPI Cards Login */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 block">Total Percobaan Login</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {MOCK_LOGIN_LOGS.length}
                </span>
                <span className="text-[11px] text-slate-400">24 jam terakhir</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 block">Login Sukses</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {MOCK_LOGIN_LOGS.filter((l) => l.status === "SUCCESS").length}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Pegawai terotentikasi</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 block">Percobaan Gagal / Ditolak</span>
                <span className="text-2xl font-black text-red-500 mt-1 block">
                  {MOCK_LOGIN_LOGS.filter((l) => l.status === "FAILED").length}
                </span>
                <span className="text-[11px] text-red-500 font-medium">Potensi anomali</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 block">Perangkat Aktif</span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block">4 Unit</span>
                <span className="text-[11px] text-slate-400">POS Tablet, Scanner & Web</span>
              </div>
            </div>

            {/* Filter Bar Login */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginSearch}
                    onChange={(e) => setLoginSearch(e.target.value)}
                    placeholder="Cari nama pegawai, email, atau alamat IP..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={loginBusinessFilter}
                    onChange={(e) => setLoginBusinessFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Unit Bisnis</option>
                    <option value="apotik-tamansari">🏥 Apotik Tamansari</option>
                    <option value="toko-mainan-pasar-lelea">🧸 Toko Mainan Pasar Lelea</option>
                    <option value="all">🏢 Portal Utama</option>
                  </select>

                  <select
                    value={loginStatusFilter}
                    onChange={(e) => setLoginStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="SUCCESS">✅ Hanya Berhasil</option>
                    <option value="FAILED">❌ Hanya Gagal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Login Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4">Nama Pegawai & Role</th>
                      <th className="px-6 py-4">Unit Bisnis</th>
                      <th className="px-6 py-4">Perangkat & Browser</th>
                      <th className="px-6 py-4">Alamat IP</th>
                      <th className="px-6 py-4">Status & Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLoginLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Tidak ada riwayat login yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLoginLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            log.status === "FAILED" ? "bg-red-50/30" : ""
                          }`}
                        >
                          {/* Waktu */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.time}</span>
                            </div>
                          </td>

                          {/* Pegawai & Role */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {log.userName}
                              </span>
                              <span className="text-xs text-slate-500 block">{log.userEmail}</span>
                              <span
                                className={`inline-block mt-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                  log.role === "OWNER"
                                    ? "bg-purple-100 text-purple-800"
                                    : log.role === "MANAGER"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : log.role === "KASIR"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {log.role}
                              </span>
                            </div>
                          </td>

                          {/* Unit Bisnis */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              {log.businessSlug === "apotik-tamansari" ? (
                                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              ) : log.businessSlug === "toko-mainan-pasar-lelea" ? (
                                <Store className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                              <span>{log.businessName}</span>
                            </div>
                          </td>

                          {/* Perangkat & Browser */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              {log.deviceType === "mobile" ? (
                                <Smartphone className="w-4 h-4 text-slate-400" />
                              ) : (
                                <Laptop className="w-4 h-4 text-slate-400" />
                              )}
                              <span>{log.device}</span>
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-600">
                            {log.ipAddress}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {log.status === "SUCCESS" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Berhasil Masuk
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  Gagal / Ditolak
                                </span>
                                {log.failReason && (
                                  <p className="text-[11px] text-red-600 mt-1 font-medium leading-tight">
                                    {log.failReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════
            TAB 2: AUDIT TRAIL PERUBAHAN DATA (CHRONOLOGICAL + MODAL DIFF)
           ══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Filter Bar Activity */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={actSearch}
                    onChange={(e) => setActSearch(e.target.value)}
                    placeholder="Cari deskripsi perubahan, ID transaksi, nama produk/supplier..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Unit Bisnis */}
                  <select
                    value={actBusinessFilter}
                    onChange={(e) => setActBusinessFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Unit Bisnis</option>
                    <option value="apotik-tamansari">🏥 Apotik Tamansari</option>
                    <option value="toko-mainan-pasar-lelea">🧸 Toko Mainan Pasar Lelea</option>
                  </select>

                  {/* Filter Pegawai */}
                  <select
                    value={actUserFilter}
                    onChange={(e) => setActUserFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Pegawai</option>
                    <option value="Gigin">Gigin (Owner)</option>
                    <option value="Siti Rahma, A.Md.Farm">Siti Rahma (Kasir Apotek)</option>
                    <option value="apt. Nurul Aulia, S.Farm">apt. Nurul Aulia (Manager Apotek)</option>
                    <option value="Budi Santoso">Budi Santoso (Manager Mainan)</option>
                  </select>

                  {/* Filter Modul */}
                  <select
                    value={actModuleFilter}
                    onChange={(e) => setActModuleFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Modul</option>
                    <option value="POS">Kasir & POS</option>
                    <option value="PRODUCT">Katalog & Harga Produk</option>
                    <option value="PURCHASE">Faktur Pembelian PBF/Distributor</option>
                    <option value="STOCK">Inventori & Stok Opname</option>
                    <option value="USER">User & Hak Akses</option>
                  </select>

                  {/* Filter Aksi */}
                  <select
                    value={actActionFilter}
                    onChange={(e) => setActActionFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">Semua Aksi</option>
                    <option value="CREATE">CREATE (Tambah Baru)</option>
                    <option value="UPDATE">UPDATE (Ubah Data/Harga)</option>
                    <option value="VOID">VOID (Batalkan Transaksi)</option>
                    <option value="APPROVE">APPROVE (Persetujuan)</option>
                    <option value="DELETE">DELETE (Hapus)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4">Pegawai</th>
                      <th className="px-6 py-4">Unit Bisnis</th>
                      <th className="px-6 py-4">Modul & Aksi</th>
                      <th className="px-6 py-4">Rincian Perubahan Data</th>
                      <th className="px-6 py-4 text-right">Detail Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Tidak ada catatan aktivitas yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredActivityLogs.map((act) => {
                        const hasDiff = act.oldData !== null || act.newData !== null;
                        const actionBadgeClass =
                          act.action === "CREATE"
                            ? "bg-blue-100 text-blue-800"
                            : act.action === "UPDATE"
                            ? "bg-amber-100 text-amber-800"
                            : act.action === "VOID"
                            ? "bg-red-100 text-red-800 font-extrabold"
                            : act.action === "APPROVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700";

                        return (
                          <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Waktu */}
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{act.time}</span>
                              </div>
                            </td>

                            {/* Pegawai */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block leading-tight">
                                {act.userName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                Role: {act.userRole}
                              </span>
                            </td>

                            {/* Unit Bisnis */}
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                {act.businessSlug === "apotik-tamansari" ? (
                                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                ) : act.businessSlug === "toko-mainan-pasar-lelea" ? (
                                  <Store className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                )}
                                <span>{act.businessName}</span>
                              </div>
                            </td>

                            {/* Modul & Aksi */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${actionBadgeClass}`}>
                                  {act.action}
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {act.module}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                {act.entityName}
                              </span>
                            </td>

                            {/* Rincian Perubahan */}
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-800 font-medium leading-snug">
                                {act.description}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                Ref ID: {act.entityId} · IP: {act.ipAddress}
                              </span>
                            </td>

                            {/* Detail Diff Button */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {hasDiff ? (
                                <button
                                  onClick={() => setSelectedActivity(act)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Bandingkan Data</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL: PERBANDINGAN DATA SEBELUM (OLD) VS SESUDAH (NEW)
         ══════════════════════════════════════════════════════════════════════════ */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 uppercase">
                      {selectedActivity.action} · {selectedActivity.module}
                    </span>
                    <span className="text-xs text-slate-300">
                      Ref: {selectedActivity.entityId}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base mt-0.5">
                    Audit Trail: {selectedActivity.entityName}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedActivity(null)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Summary Bar */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Pegawai / Aktor</span>
                <span className="font-bold text-slate-800">{selectedActivity.userName} ({selectedActivity.userRole})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Unit Bisnis</span>
                <span className="font-bold text-slate-800">{selectedActivity.businessName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Waktu Eksekusi</span>
                <span className="font-medium text-slate-800">{selectedActivity.time}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">IP Address</span>
                <span className="font-mono text-slate-800">{selectedActivity.ipAddress}</span>
              </div>
            </div>

            {/* Description Banner */}
            <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 text-xs text-indigo-900 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Aktivitas:</strong> {selectedActivity.description}
              </div>
            </div>

            {/* Diff Body Side-by-Side */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel Kiri: SEBELUM (Old Data) */}
                <div className="bg-red-50/40 rounded-2xl border border-red-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-red-100/70 border-b border-red-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Data Sebelum (Old Data)
                    </span>
                    <span className="text-[10px] bg-red-200/80 text-red-800 px-2 py-0.5 rounded font-mono">
                      State Lama
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    {selectedActivity.oldData ? (
                      <pre className="text-xs text-red-950 font-mono overflow-auto max-h-80 whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(selectedActivity.oldData, null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        (Tidak ada data sebelumnya — Ini adalah operasi penambahan baru / CREATE)
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Kanan: SESUDAH (New Data) */}
                <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-emerald-100/70 border-b border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Data Sesudah (New Data)
                    </span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      State Terbaru
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    {selectedActivity.newData ? (
                      <pre className="text-xs text-emerald-950 font-mono overflow-auto max-h-80 whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(selectedActivity.newData, null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        (Data dihapus secara permanen / DELETE)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Log ini tersimpan permanen di tabel <code className="font-mono text-slate-700 font-bold">ActivityLog</code> untuk keperluan kepatuhan audit BPOM & Pajak.
              </span>
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition shadow-xs"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
