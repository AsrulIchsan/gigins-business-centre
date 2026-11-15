"use client";

import React, { useState } from "react";
import {
  BookOpenCheck,
  FileText,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Printer,
  ChevronDown,
} from "lucide-react";
import { DEFAULT_COA } from "@/lib/accounting";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function JurnalUmumPage() {
  const [activeTab, setActiveTab] = useState<"JOURNAL" | "COA" | "LEDGER">("JOURNAL");
  const [selectedAccountForLedger, setSelectedAccountForLedger] = useState("11101");

  // Sample automated balanced journal entries from pharmacy operations
  const journalEntries = [
    {
      entryNumber: "JV-SL-981240",
      date: "2026-11-14 14:15",
      type: "SALE",
      description: "Jurnal Otomatis Penjualan POS Kasir Shift 1",
      reference: "SL-TS-981240",
      totalDebit: 16000,
      totalCredit: 16000,
      lines: [
        { code: "11101", name: "Kas Kasir / Shift", debit: 16000, credit: 0 },
        { code: "41101", name: "Pendapatan Penjualan Obat Bebas", debit: 0, credit: 16000 },
        { code: "51101", name: "HPP - Beban Pokok Penjualan Obat", debit: 11200, credit: 0 },
        { code: "11301", name: "Persediaan Obat & Alkes", debit: 0, credit: 11200 },
      ],
    },
    {
      entryNumber: "JV-PUR-99812",
      date: "2026-11-14 11:30",
      type: "PURCHASE",
      description: "Penerimaan Faktur PBF Kimia Farma (Faktur FAK-KF-99812)",
      reference: "FAK-KF-99812",
      totalDebit: 1840000,
      totalCredit: 1840000,
      lines: [
        { code: "11301", name: "Persediaan Obat & Alkes", debit: 1840000, credit: 0 },
        { code: "21101", name: "Hutang Usaha ke PBF", debit: 0, credit: 1840000 },
      ],
    },
    {
      entryNumber: "JV-RET-PUR-01",
      date: "2026-11-13 16:30",
      type: "PURCHASE_RETURN",
      description: "Retur Pembelian Obat Rusak ke PBF Kimia Farma",
      reference: "RET-PUR-202611-01",
      totalDebit: 3000,
      totalCredit: 3000,
      lines: [
        { code: "21101", name: "Hutang Usaha ke PBF", debit: 3000, credit: 0 },
        { code: "11301", name: "Persediaan Obat & Alkes", debit: 0, credit: 3000 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            Akuntansi Otomatis: Jurnal Umum, Buku Besar & Bagan Akun
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan double-entry otomatis terintegrasi dari penjualan kasir, pembelian PBF, retur, dan konsinyasi.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
          <Printer className="mr-1.5 h-4 w-4" />
          Cetak Jurnal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b bg-white p-2 rounded-xl">
        <button
          onClick={() => setActiveTab("JOURNAL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "JOURNAL"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Jurnal Umum Otomatis
        </button>
        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "LEDGER"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Buku Besar (General Ledger)
        </button>
        <button
          onClick={() => setActiveTab("COA")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "COA"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Bagan Akun (Chart of Accounts)
        </button>
      </div>

      {/* TAB 1: JURNAL UMUM */}
      {activeTab === "JOURNAL" && (
        <div className="space-y-4">
          {journalEntries.map((entry) => (
            <Card key={entry.entryNumber} className="border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-800">
                      {entry.entryNumber}
                    </span>
                    <Badge variant="cyan" className="text-[9px]">
                      {entry.type}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {entry.reference}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {entry.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{entry.date}</span>
                  <Badge variant="success" className="text-[9px]">
                    SEIMBANG (Balanced)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-4">Kode & Nama Akun</th>
                      <th className="p-2.5 text-right w-36">Debit (Rp)</th>
                      <th className="p-2.5 pr-4 text-right w-36">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {entry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 pl-4">
                          <span className={`font-mono mr-2 ${line.credit > 0 ? "text-slate-400 ml-4" : "font-bold text-slate-700"}`}>
                            {line.code}
                          </span>
                          <span className={line.credit > 0 ? "text-slate-600 pl-2" : "font-semibold text-slate-800"}>
                            {line.name}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          {line.debit > 0 ? formatRupiah(line.debit) : "-"}
                        </td>
                        <td className="p-2.5 pr-4 text-right font-bold text-slate-700">
                          {line.credit > 0 ? formatRupiah(line.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER */}
      {activeTab === "LEDGER" && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Buku Besar per Akun Perkiraan
              </CardTitle>
              <CardDescription>
                Pilih akun perkiraan untuk melihat mutasi debet/kredit dan saldo berjalan
              </CardDescription>
            </div>

            <select
              value={selectedAccountForLedger}
              onChange={(e) => setSelectedAccountForLedger(e.target.value)}
              className="text-xs p-2 rounded-lg border bg-slate-50 font-semibold text-slate-800"
            >
              {DEFAULT_COA.map((acc) => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} - {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">No. Bukti / Jurnal</th>
                    <th className="p-3">Keterangan Transaksi</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Kredit</th>
                    <th className="p-3 text-right">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">2026-11-14 07:00</td>
                    <td className="p-3 font-mono text-slate-400">SALDO-AWAL</td>
                    <td className="p-3 font-semibold text-slate-800">Saldo Awal Kas Laci Kasir</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatRupiah(300000)}</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(300000)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">2026-11-14 14:15</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">JV-SL-981240</td>
                    <td className="p-3 font-semibold text-slate-800">Penerimaan Kas Penjualan POS Kasir</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatRupiah(16000)}</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(316000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: CHART OF ACCOUNTS (COA) */}
      {activeTab === "COA" && (
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              Master Bagan Akun Apotek (Chart of Accounts)
            </CardTitle>
            <CardDescription>
              Struktur klasifikasi akun keuangan standar apotek (Aset, Kewajiban, Ekuitas, Pendapatan, HPP, Beban)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">Kode Akun</th>
                    <th className="p-3">Nama Akun Perkiraan</th>
                    <th className="p-3">Kategori Laporan</th>
                    <th className="p-3">Fungsi Operasional Apotek</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {DEFAULT_COA.map((acc) => (
                    <tr key={acc.code} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">{acc.code}</td>
                      <td className="p-3 font-semibold text-slate-800">{acc.name}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            acc.type === "ASSET"
                              ? "success"
                              : acc.type === "LIABILITY"
                              ? "destructive"
                              : acc.type === "REVENUE"
                              ? "cyan"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {acc.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500">{acc.desc}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">
                          Aktif
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
