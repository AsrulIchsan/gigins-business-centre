"use client";

import React, { useState } from "react";
import {
  Boxes,
  Clock,
  Filter,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { formatRupiah, formatDateIndo, getExpirationBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function KartuStokPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("prod-1");
  const [filterType, setFilterType] = useState<string>("ALL");

  const product = INITIAL_PRODUCTS.find((p) => p.id === selectedProductId) || INITIAL_PRODUCTS[0];

  // Mock Stock Mutations for the selected product
  const stockMutations = [
    {
      id: "mut-1",
      date: "2026-11-14 14:15",
      type: "SALE",
      ref: "SL-TS-981240",
      batch: "BCH-SNM-24A",
      exp: "2026-12-10",
      qtyIn: 0,
      qtyOut: 10,
      balanceBefore: 420,
      balanceAfter: 410,
      unit: "Tablet",
      notes: "Penjualan Kasir POS Shift 1 (FIFO Earliest Batch)",
      user: "Siti Rahma (Kasir)",
    },
    {
      id: "mut-2",
      date: "2026-11-14 10:30",
      type: "SALE",
      ref: "SL-TS-981232",
      batch: "BCH-SNM-24A",
      exp: "2026-12-10",
      qtyIn: 0,
      qtyOut: 20,
      balanceBefore: 440,
      balanceAfter: 420,
      unit: "Tablet",
      notes: "Penjualan Resep dr. Hendra Gunawan",
      user: "Siti Rahma (Kasir)",
    },
    {
      id: "mut-3",
      date: "2026-11-13 16:00",
      type: "SALE_RETURN",
      ref: "RET-SL-004",
      batch: "BCH-SNM-24A",
      exp: "2026-12-10",
      qtyIn: 10,
      qtyOut: 0,
      balanceBefore: 430,
      balanceAfter: 440,
      unit: "Tablet",
      notes: "Retur Penjualan: Pasien kelebihan tebus obat",
      user: "apt. Nurul Aulia",
    },
    {
      id: "mut-4",
      date: "2026-11-10 11:20",
      type: "PURCHASE",
      ref: "FAK-KF-89211",
      batch: "BCH-SNM-26C",
      exp: "2027-11-20",
      qtyIn: 200,
      qtyOut: 0,
      balanceBefore: 230,
      balanceAfter: 430,
      unit: "Tablet",
      notes: "Penerimaan Faktur Pembelian PBF Kimia Farma (Batch Baru)",
      user: "apt. Nurul Aulia",
    },
    {
      id: "mut-5",
      date: "2026-11-01 08:00",
      type: "OPNAME",
      ref: "OPN-20261101",
      batch: "BCH-SNM-24A",
      exp: "2026-12-10",
      qtyIn: 0,
      qtyOut: 2,
      balanceBefore: 232,
      balanceAfter: 230,
      unit: "Tablet",
      notes: "Penyesuaian Selisih Fisik Opname Awal Bulan",
      user: "Siti Rahma (Kasir)",
    },
  ];

  const filteredMutations = stockMutations.filter((m) => {
    if (filterType === "ALL") return true;
    return m.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-600" />
            Kartu Stok Otomatis & Manajemen Batch FIFO
          </h1>
          <p className="text-xs text-slate-500">
            Log mutasi stok real-time (Masuk, Keluar, Retur, Opname) dengan saldo akhir per batch kedaluwarsa.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("Mengunduh Kartu Stok & Laporan Mutasi FIFO (Format Excel & PDF)...")}
          className="text-xs"
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-700" />
          Export Excel / PDF
        </Button>
      </div>

      {/* Select Product & Batch Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Product Selector */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pilih Obat Untuk Ditinjau</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {INITIAL_PRODUCTS.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex justify-between items-center ${
                  p.id === selectedProductId
                    ? "border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 ring-1 ring-emerald-500"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div>
                  <p>{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{p.barcode}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold">{p.totalStock} {p.baseUnit}</span>
                  <span className="block text-[10px] text-slate-400">
                    {p.batches.length} Batch
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Batches of Selected Product (FIFO Priority) */}
        <Card className="border-slate-200 bg-white lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Daftar Batch FIFO: {product.name}
              </CardTitle>
              <CardDescription>
                Urutan pengurangan stok otomatis: Batch paling cepat kedaluwarsa keluar duluan
              </CardDescription>
            </div>
            <Badge variant="cyan" className="text-xs">
              Total Stok: {product.totalStock} {product.baseUnit}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.batches.map((batch, idx) => {
                const badge = getExpirationBadge(batch.expiredDate);
                const isFirstFifo = idx === 0;

                return (
                  <div
                    key={batch.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-all ${
                      isFirstFifo
                        ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isFirstFifo && (
                          <Badge variant="success" className="text-[9px] font-bold">
                            PRIORITAS FIFO #1
                          </Badge>
                        )}
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {batch.batchNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kedaluwarsa: <b>{formatDateIndo(batch.expiredDate)}</b> &bull; Harga Beli:{" "}
                        {formatRupiah(batch.buyPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeColor}`}>
                        {badge.label}
                      </span>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-800">
                          {batch.quantity}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{product.baseUnit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Mutation Log (Kartu Stok) */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Riwayat Mutasi Kartu Stok (Audit Trail Saldo)
            </CardTitle>
            <CardDescription>
              Setiap penambahan atau pengurangan saldo terekam beserta referensi dokumen
            </CardDescription>
          </div>

          {/* Filter Types */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {["ALL", "SALE", "PURCHASE", "SALE_RETURN", "OPNAME"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === f ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
                }`}
              >
                {f === "ALL"
                  ? "Semua"
                  : f === "SALE"
                  ? "Keluar (Jual)"
                  : f === "PURCHASE"
                  ? "Masuk (Beli)"
                  : f === "SALE_RETURN"
                  ? "Retur Jual"
                  : "Opname"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Waktu & User</th>
                  <th className="p-3">Jenis Transaksi</th>
                  <th className="p-3">No. Referensi</th>
                  <th className="p-3">Batch & Expired</th>
                  <th className="p-3 text-right">Masuk</th>
                  <th className="p-3 text-right">Keluar</th>
                  <th className="p-3 text-right">Saldo Akhir</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredMutations.map((mut) => (
                  <tr key={mut.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{mut.date}</div>
                      <div className="text-[10px] text-slate-400">{mut.user}</div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          mut.type === "PURCHASE" || mut.type === "SALE_RETURN"
                            ? "success"
                            : mut.type === "SALE"
                            ? "secondary"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {mut.type}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-800">{mut.ref}</td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {mut.batch}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {mut.qtyIn > 0 ? `+${mut.qtyIn}` : "-"}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      {mut.qtyOut > 0 ? `-${mut.qtyOut}` : "-"}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      {mut.balanceAfter} <span className="text-[10px] text-slate-400 font-normal">{mut.unit}</span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500 max-w-xs">{mut.notes}</td>
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
