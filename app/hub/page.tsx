"use client";

/**
 * /hub/page.tsx
 * Portal Utama Gigin's Business Centre — hanya untuk OWNER.
 * Menampilkan ringkasan semua unit bisnis, login history, dan activity log terbaru.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Pill, Gamepad2, TrendingUp, Users, ShoppingCart,
  Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight,
  BarChart3, Shield, LogOut, Settings, Eye, KeyRound, History
} from "lucide-react";
import { HubHeader } from "@/components/hub/hub-header";
import { useAuth } from "@/lib/use-auth";

// Mock data untuk development (akan diganti dengan Prisma query saat DB aktif)
const MOCK_BUSINESSES = [
  {
    id: "biz-apotik-tamansari",
    slug: "apotik-tamansari",
    name: "Apotik Tamansari",
    type: "PHARMACY",
    icon: Pill,
    color: "emerald",
    stats: { revenue: 18750000, transactions: 142, lowStock: 3, activeUsers: 4 },
    lastActivity: "5 menit lalu",
    status: "online",
  },
  {
    id: "biz-toko-mainan-lelea",
    slug: "toko-mainan-pasar-lelea",
    name: "Toko Mainan Pasar Lelea",
    type: "RETAIL_TOYS",
    icon: Gamepad2,
    color: "amber",
    stats: { revenue: 4320000, transactions: 28, lowStock: 0, activeUsers: 2 },
    lastActivity: "1 jam lalu",
    status: "online",
  },
];

const MOCK_LOGIN_HISTORY = [
  { id: "1", user: "Gigin (Owner)", business: "Semua Bisnis", ip: "192.168.1.1", device: "Chrome / Windows", status: "SUCCESS", time: "15 Nov 2026, 07:30" },
  { id: "2", user: "Siti Rahma (Kasir)", business: "Apotik Tamansari", ip: "192.168.1.5", device: "Chrome / Android", status: "SUCCESS", time: "15 Nov 2026, 07:00" },
  { id: "3", user: "Unknown", business: "—", ip: "10.0.0.99", device: "Firefox / Linux", status: "FAILED", time: "14 Nov 2026, 23:14" },
  { id: "4", user: "Budi (Manager)", business: "Toko Mainan Pasar Lelea", ip: "192.168.1.8", device: "Safari / macOS", status: "SUCCESS", time: "14 Nov 2026, 09:00" },
];

const MOCK_ACTIVITY_LOG = [
  { id: "1", user: "Siti Rahma", business: "Apotik Tamansari", module: "POS", action: "CREATE", desc: "Transaksi POS baru: INV-20261115-0142 — Rp 85.000", time: "10 mnt lalu" },
  { id: "2", user: "Gigin", business: "Apotik Tamansari", module: "PRODUCT", action: "UPDATE", desc: "Harga jual \"Paracetamol 500mg\" diubah: Rp 1.200 → Rp 1.500", time: "2 jam lalu" },
  { id: "3", user: "Budi", business: "Toko Mainan", module: "PURCHASE", action: "CREATE", desc: "Faktur pembelian baru: PO-2026-0028 — Rp 1.250.000", time: "3 jam lalu" },
  { id: "4", user: "Siti Rahma", business: "Apotik Tamansari", module: "POS", action: "VOID", desc: "Transaksi POS INV-20261114-0138 di-void. Alasan: Salah input", time: "1 hari lalu" },
];

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function HubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "login" | "activity">("overview");
  const [loginHistory, setLoginHistory] = useState(MOCK_LOGIN_HISTORY);
  const [activityLog, setActivityLog] = useState(MOCK_ACTIVITY_LOG);

  useEffect(() => {
    async function loadRecentAudit() {
      try {
        const res = await fetch("/api/audit-logs?limit=5", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.loginLogs) && data.loginLogs.length > 0) {
            setLoginHistory(
              data.loginLogs.slice(0, 5).map((l: any) => ({
                id: l.id,
                user: `${l.userName} (${l.role})`,
                business: l.businessName || "Semua Bisnis",
                ip: l.ipAddress || "-",
                device: l.device || "-",
                status: l.status || "SUCCESS",
                time: l.time || "-",
              }))
            );
          }
          if (Array.isArray(data.activityLogs) && data.activityLogs.length > 0) {
            setActivityLog(
              data.activityLogs.slice(0, 5).map((a: any) => ({
                id: a.id,
                user: a.userName,
                business: a.businessName,
                module: a.module,
                action: a.action,
                desc: a.description,
                time: a.time,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Gagal memuat log audit di Hub:", err);
      }
    }
    loadRecentAudit();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HubHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Selamat datang, {user?.name || "Gigin"} 👋</h2>
          <p className="text-gray-500 mt-1">Kelola semua unit bisnis Anda dari sini.</p>
        </div>

        {/* Business Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {MOCK_BUSINESSES.map((biz) => {
            const Icon = biz.icon;
            const isEmerald = biz.color === "emerald";
            return (
              <div key={biz.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className={`px-6 py-4 ${isEmerald ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{biz.name}</h3>
                        <p className="text-xs text-white/80">{biz.type === "PHARMACY" ? "🏥 Apotek" : "🧸 Retail Mainan"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80">Online</span>
                    </div>
                  </div>
                </div>

                {/* Card Stats */}
                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Pendapatan Hari Ini</p>
                    <p className="font-bold text-gray-900 text-lg">{formatRupiah(biz.stats.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Transaksi</p>
                    <p className="font-bold text-gray-900 text-lg">{biz.stats.transactions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stok Menipis</p>
                    <p className={`font-bold text-lg ${biz.stats.lowStock > 0 ? "text-red-500" : "text-gray-900"}`}>
                      {biz.stats.lowStock > 0 ? `⚠️ ${biz.stats.lowStock} produk` : "✅ Aman"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pengguna Aktif</p>
                    <p className="font-bold text-gray-900 text-lg">{biz.stats.activeUsers} orang</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Aktivitas: {biz.lastActivity}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/b/${biz.slug}/dashboard`}
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${
                        isEmerald ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      } transition-colors`}
                    >
                      Buka Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/b/${biz.slug}/pos`}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      POS
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { key: "overview", label: "Ringkasan Platform", icon: BarChart3 },
                { key: "login", label: "Login History", icon: Shield },
                { key: "activity", label: "Audit Trail", icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Pendapatan Hari Ini", value: formatRupiah(23070000), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Total Transaksi", value: "170", icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
                  { label: "Total Pengguna", value: "6 orang", icon: Users, color: "text-purple-600 bg-purple-50" },
                  { label: "Stok Perlu Perhatian", value: "3 produk", icon: AlertCircle, color: "text-red-600 bg-red-50" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-4 rounded-xl bg-gray-50">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="font-bold text-gray-900 text-lg mt-0.5">{item.value}</p>
                    </div>
                  );
                })}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Menampilkan 4 log perubahan data terbaru</span>
                  <Link
                    href="/hub/audit-logs"
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Buka Halaman Audit Trail & Diff Lengkap <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Login History Tab */}
            {activeTab === "login" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="pb-3 font-medium">Waktu</th>
                      <th className="pb-3 font-medium">Pengguna</th>
                      <th className="pb-3 font-medium">Bisnis</th>
                      <th className="pb-3 font-medium">IP</th>
                      <th className="pb-3 font-medium">Device</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loginHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-3 text-gray-500 whitespace-nowrap">{log.time}</td>
                        <td className="py-3 font-medium text-gray-900">{log.user}</td>
                        <td className="py-3 text-gray-600">{log.business}</td>
                        <td className="py-3 text-gray-500 font-mono text-xs">{log.ip}</td>
                        <td className="py-3 text-gray-500">{log.device}</td>
                        <td className="py-3">
                          {log.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Berhasil
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Gagal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Menampilkan 4 riwayat login terbaru</span>
                  <Link
                    href="/hub/audit-logs"
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Buka Halaman Audit Logs Lengkap <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Audit Trail Tab */}
            {activeTab === "activity" && (
              <div className="space-y-3">
                {activityLog.map((log) => {
                  const actionColors: Record<string, string> = {
                    CREATE: "bg-blue-50 text-blue-700",
                    UPDATE: "bg-amber-50 text-amber-700",
                    DELETE: "bg-red-50 text-red-700",
                    VOID: "bg-red-50 text-red-700",
                    APPROVE: "bg-emerald-50 text-emerald-700",
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${actionColors[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.desc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium">{log.user}</span> · {log.business} · {log.module}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.time}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Menampilkan 4 log perubahan data terbaru</span>
                  <Link
                    href="/hub/audit-logs"
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Buka Halaman Audit Trail & Diff Lengkap <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/hub/access-control"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block group-hover:text-indigo-600">
                Role & Access Control
              </span>
              <span className="text-[11px] text-gray-500">Kelola akun, cabang & izin granular</span>
            </div>
          </Link>

          <Link
            href="/hub/audit-logs"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block group-hover:text-purple-600">
                Audit Trail & Login Logs
              </span>
              <span className="text-[11px] text-gray-500">Riwayat login & perbandingan data</span>
            </div>
          </Link>

          <Link
            href="/b/apotik-tamansari/pos"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block group-hover:text-emerald-600">
                Kasir POS Apotek
              </span>
              <span className="text-[11px] text-gray-500">Unit Apotik Tamansari</span>
            </div>
          </Link>

          <Link
            href="/b/toko-mainan-pasar-lelea/pos"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block group-hover:text-amber-600">
                Kasir POS Toko Mainan
              </span>
              <span className="text-[11px] text-gray-500">Unit Toko Mainan Pasar Lelea</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
