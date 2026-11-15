"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Calendar,
  Receipt,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReturPenjualanPage() {
  const [saleNumberSearch, setSaleNumberSearch] = useState("SL-TS-981240");
  const [saleFound, setSaleFound] = useState<any>({
    saleNumber: "SL-TS-981240",
    customerName: "Budi Santoso",
    date: "2026-11-14 14:15",
    items: [
      {
        name: "Sanmol 500mg (Paracetamol)",
        unit: "Tablet",
        qty: 10,
        sellPrice: 500,
        subtotal: 5000,
        batchNumber: "BCH-SNM-24A",
      },
      {
        name: "Cetirizine 10mg Novell",
        unit: "Strip",
        qty: 1,
        sellPrice: 11000,
        subtotal: 11000,
        batchNumber: "CTZ-24-X1",
      },
    ],
    totalAmount: 16000,
  });

  const [returnQty, setReturnQty] = useState(5);
  const [reason, setReason] = useState("Pasien salah beli obat / tidak cocok dosis");
  const [isDone, setIsDone] = useState(false);

  const handleSearchSale = () => {
    if (!saleNumberSearch.trim()) {
      alert("Masukkan nomor nota/struk kasir terlebih dahulu!");
      return;
    }
    setSaleFound({
      saleNumber: saleNumberSearch.trim().toUpperCase(),
      customerName: "Budi Santoso",
      date: "2026-11-14 14:15",
      items: [
        {
          name: "Sanmol 500mg (Paracetamol)",
          unit: "Tablet",
          qty: 10,
          sellPrice: 500,
          subtotal: 5000,
          batchNumber: "BCH-SNM-24A",
        },
        {
          name: "Cetirizine 10mg Novell",
          unit: "Strip",
          qty: 1,
          sellPrice: 11000,
          subtotal: 11000,
          batchNumber: "CTZ-24-X1",
        },
      ],
      totalAmount: 16000,
    });
    setIsDone(false);
  };

  const handleProcessReturn = () => {
    setIsDone(true);
    alert("Retur Penjualan berhasil diproses!\nStok batch BCH-SNM-24A dikembalikan +5 Tablet & Kas keluar / Jurnal koreksi pendapatan dibuat.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-600" />
            Retur Penjualan dari Pasien / Pelanggan
          </h1>
          <p className="text-xs text-slate-500">
            Pengembalian obat oleh pasien yang mengembalikan stok batch ke rak & membuat jurnal balik penerimaan kas.
          </p>
        </div>
      </div>

      {/* Search Sale Document */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cari Nota Penjualan Kasir</CardTitle>
          <CardDescription>Masukkan nomor transaksi pada struk pasien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Contoh: SL-TS-981240"
                value={saleNumberSearch}
                onChange={(e) => setSaleNumberSearch(e.target.value)}
                className="pl-9 font-mono"
              />
            </div>
            <Button onClick={handleSearchSale} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              Cari Struk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sale Record & Return Action */}
      {saleFound && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
            <div>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {saleFound.saleNumber}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Pasien: <b>{saleFound.customerName}</b> &bull; Waktu: {saleFound.date}
              </p>
            </div>
            <Badge variant="success">Transaksi Valid</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <span className="font-bold text-xs text-slate-800 block">
              Pilih Obat yang Akan Diretur:
            </span>

            <div className="space-y-2">
              {saleFound.items.map((it: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{it.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Beli: {it.qty} {it.unit} &bull; Batch Terjual:{" "}
                      <span className="font-mono text-emerald-700 font-bold">{it.batchNumber}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Jumlah Diretur:</span>
                    <Input
                      type="number"
                      value={returnQty}
                      onChange={(e) => setReturnQty(Number(e.target.value))}
                      className="w-20 h-8 text-center bg-white font-bold"
                    />
                    <span className="font-bold">{it.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alasan Pengembalian Obat:
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-xs">
              <span className="font-semibold text-rose-900">Uang yang Dikembalikan ke Pasien:</span>
              <span className="text-base font-black text-rose-700">{formatRupiah(2500)}</span>
            </div>

            <Button
              onClick={handleProcessReturn}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Proses Retur & Kembalikan Stok ke Batch Asal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
