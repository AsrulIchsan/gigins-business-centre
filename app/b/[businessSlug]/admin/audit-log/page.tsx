"use client";

/**
 * /b/[businessSlug]/admin/audit-log/page.tsx
 * Halaman Audit Trail — riwayat aktivitas & perubahan data per cabang bisnis.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  Filter,
  Download,
  ChevronDown,
  Clock,
  ExternalLink,
  Pill,
  Store,
  XCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";

const MODULES = ["Semua", "POS", "PRODUCT", "PURCHASE", "STOCK", "FINANCE", "USER", "CRM", "SETTING"];
const ACTIONS = ["Semua", "CREATE", "UPDATE", "DELETE", "VOID", "APPROVE", "REJECT"];

const ALL_MOCK_LOGS = [
  {
    id: "1",
    businessSlug: "apotik-tamansari",
    user: "Siti Rahma, A.Md.Farm",
    role: "KASIR",
    module: "POS",
    action: "CREATE",
    entity: "INV-20261115-0142",
    desc: "Transaksi POS baru: INV-20261115-0142 — Total Rp 85.000",
    time: "Hari ini, 07:42 WIB",
    oldData: null,
    newData: { total: 85000, items: 3, paymentMethod: "CASH" },
  },
  {
    id: "2",
    businessSlug: "apotik-tamansari",
    user: "Gigin",
    role: "OWNER",
    module: "PRODUCT",
    action: "UPDATE",
    entity: "Paracetamol 500mg",
    desc: "Harga jual diubah dari Rp 1.200 → Rp 1.500",
    time: "Hari ini, 05:50 WIB",
    oldData: { sellPrice: 1200, buyPriceHpp: 800 },
    newData: { sellPrice: 1500, buyPriceHpp: 950 },
  },
  {
    id: "3",
    businessSlug: "apotik-tamansari",
    user: "Siti Rahma, A.Md.Farm",
    role: "KASIR",
    module: "POS",
    action: "VOID",
    entity: "INV-20261114-0138",
    desc: "Transaksi di-void. Alasan: Salah input nominal resep",
    time: "14/11/2026 15:22 WIB",
    oldData: { status: "PAID", total: 120000 },
    newData: { status: "VOID", total: 0, reason: "Salah input nominal resep" },
  },
  {
    id: "4",
    businessSlug: "apotik-tamansari",
    user: "apt. Nurul Aulia, S.Farm",
    role: "MANAGER",
    module: "STOCK",
    action: "APPROVE",
    entity: "OPNAME-2026-11-14",
    desc: "Stok opname bulanan disetujui (selisih 2 botol rusak)",
    time: "14/11/2026 11:00 WIB",
    oldData: { status: "PENDING", diff: -2 },
    newData: { status: "APPROVED", approvedBy: "apt. Nurul Aulia" },
  },
  {
    id: "5",
    businessSlug: "toko-mainan-pasar-lelea",
    user: "Budi Santoso",
    role: "MANAGER",
    module: "PURCHASE",
    action: "CREATE",
    entity: "PO-LELEA-2026-088",
    desc: "Faktur penerimaan barang: INV-TOYS-7721 — Total Rp 4.850.000",
    time: "14/11/2026 16:30 WIB",
    oldData: null,
    newData: { supplier: "CV Mainan Jaya Sentosa", total: 4850000, terms: "TEMPO_30_HARI" },
  },
  {
    id: "6",
    businessSlug: "toko-mainan-pasar-lelea",
    user: "Dewi Lestari",
    role: "KASIR",
    module: "POS",
    action: "CREATE",
    entity: "SL-ML-0045",
    desc: "Transaksi kasir mainan tunai: Diecast Hotwheels & Robot — Rp 180.000",
    time: "14/11/2026 14:10 WIB",
    oldData: null,
    newData: { total: 180000, items: 2, cashier: "Dewi Lestari" },
  },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-blue-50 text-blue-700 border-blue-200",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  VOID: "bg-red-50 text-red-700 border-red-200 font-bold",
  APPROVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECT: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function AuditLogPage() {
  const params = useParams();
  const slug = (params?.businessSlug as string) || "apotik-tamansari";
  const isPharmacy = slug === "apotik-tamansari";
  const businessName = isPharmacy ? "Apotik Tamansari" : "Toko Mainan Pasar Lelea";

  const [selectedModule, setSelectedModule] = useState("Semua");
  const [selectedAction, setSelectedAction] = useState("Semua");
  const [selectedLog, setSelectedLog] = useState<(typeof ALL_MOCK_LOGS)[0] | null>(null);

  const filtered = ALL_MOCK_LOGS.filter((log) => {
    if (log.businessSlug !== slug) return false;
    if (selectedModule !== "Semua" && log.module !== selectedModule) return false;
    if (selectedAction !== "Semua" && log.action !== selectedAction) return false;
    return true;
  });

  function handleExport() {
    alert(`Mengunduh file laporan audit trail ${businessName} (Format CSV/Excel siap dicetak)...`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isPharmacy ? "bg-emerald-600" : "bg-amber-600"
            }`}
          >
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isPharmacy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {businessName}
              </span>
              <span className="text-xs text-slate-400">• Audit Trail Cabang</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Riwayat Perubahan Data & Aktivitas Staf
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Melacak setiap aksi kasir, perubahan harga, penerimaan faktur, dan void transaksi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/hub/audit-logs"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Audit Log Pusat</span>
          </Link>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter Cabang:</span>
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                Modul: {m}
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                Aksi: {a}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Ditemukan <strong>{filtered.length}</strong> catatan aktivitas
        </span>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada data log yang cocok dengan filter di cabang ini.
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/80 transition"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <span
                  className={`mt-0.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    ACTION_COLORS[log.action] ?? "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {log.action}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 leading-snug">{log.desc}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-600">{log.user}</span> &bull;{" "}
                    <span className="font-mono text-slate-500">{log.module}</span> &bull;{" "}
                    <span>Ref: {log.entity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" /> {log.time}
                </span>

                {(log.oldData || log.newData) && (
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Diff</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: DIFF BEFORE VS AFTER */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Perbandingan Data: {selectedLog.entity}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Oleh {selectedLog.user} &bull; {selectedLog.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50/50 rounded-2xl border border-red-200 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-900 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Data Sebelum (Old State)</span>
                  </div>
                  <pre className="text-xs text-red-950 font-mono bg-white/70 p-3 rounded-xl border border-red-100 overflow-auto max-h-64">
                    {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : "(Operasi Baru / CREATE)"}
                  </pre>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Data Sesudah (New State)</span>
                  </div>
                  <pre className="text-xs text-emerald-950 font-mono bg-white/70 p-3 rounded-xl border border-emerald-100 overflow-auto max-h-64">
                    {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : "(Data Dihapus / DELETE)"}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
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
