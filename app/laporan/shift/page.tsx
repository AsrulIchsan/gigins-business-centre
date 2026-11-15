"use client";

import React, { useState } from "react";
import {
  Clock,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UserCheck,
  Calendar,
  Lock,
} from "lucide-react";
import { ACTIVE_SHIFT } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
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

export default function LaporanShiftPage() {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingPhysicalCash, setClosingPhysicalCash] = useState<number>(840000); // 300k opening + 540k cash sales
  const [shiftNotes, setShiftNotes] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  // Expected Cash = Kas Awal + Penjualan Tunai
  const expectedCash = ACTIVE_SHIFT.openingCash + ACTIVE_SHIFT.totalCashSales;
  const cashDifference = closingPhysicalCash - expectedCash;

  const handleCloseShift = () => {
    setIsClosed(true);
    setIsCloseModalOpen(false);
    alert(`Shift ${ACTIVE_SHIFT.shiftNumber} berhasil DITUTUP!\nRekap kasir dicatat & selisih kas telah dijurnal ke sistem akuntansi.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Laporan Pergantian Shift & Rekonsiliasi Kas Kasir
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan kas awal, omset per metode bayar, dan rekonsiliasi selisih kasir saat serah terima tugas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
            <Printer className="mr-1.5 h-4 w-4" />
            Cetak Rekap Shift
          </Button>
          {!isClosed && (
            <Button
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <Lock className="mr-1.5 h-4 w-4" />
              Tutup Shift Kasir Sekarang
            </Button>
          )}
        </div>
      </div>

      {/* Shift Status Banner */}
      <Card className={`border ${isClosed ? "border-slate-300 bg-slate-50" : "border-emerald-200 bg-emerald-50/50"}`}>
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isClosed ? "bg-slate-400" : "bg-emerald-600"}`}>
              {isClosed ? <CheckCircle2 className="h-6 w-6" /> : "S1"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{ACTIVE_SHIFT.shiftNumber}</span>
                <Badge variant={isClosed ? "secondary" : "success"} className="text-[10px]">
                  {isClosed ? "SHIFT SELESAI / CLOSED" : "SHIFT AKTIF (OPEN)"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Petugas Kasir: <b>{ACTIVE_SHIFT.cashierName}</b> ({ACTIVE_SHIFT.cashierRole}) &bull; Buka: {new Date(ACTIVE_SHIFT.openedAt).toLocaleTimeString("id-ID")} WIB
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Transaksi Selesai</span>
            <span className="text-xl font-black text-slate-800">{ACTIVE_SHIFT.salesCount} Struk</span>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Reconciliation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Summary By Payment Method */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">
              Rincian Penjualan per Metode Bayar
            </CardTitle>
            <CardDescription>
              Akumulasi penerimaan uang dari pasien selama shift berjalan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-emerald-900 block">Uang Tunai (Cash):</span>
                <span className="text-[10px] text-emerald-700">Wajib ada di laci kasir apotek</span>
              </div>
              <span className="text-base font-black text-emerald-800">
                {formatRupiah(ACTIVE_SHIFT.totalCashSales)}
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-blue-900 block">Non-Tunai (QRIS & EDC Debit):</span>
                <span className="text-[10px] text-blue-700">Langsung masuk ke rekening bank apotek</span>
              </div>
              <span className="text-base font-black text-blue-800">
                {formatRupiah(ACTIVE_SHIFT.totalNonCashSales)}
              </span>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
              <span>Total Omset Penjualan Shift:</span>
              <span className="text-lg font-black text-slate-900">
                {formatRupiah(ACTIVE_SHIFT.totalSales)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Cash Drawer Balance (Kas Laci Fisik) */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">
              Rekonsiliasi Fisik Kas di Laci
            </CardTitle>
            <CardDescription>
              Perbandingan uang modal kas awal + omset tunai vs hitungan fisik nyata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Modal Kas Awal di Laci:</span>
              <span className="font-bold">{formatRupiah(ACTIVE_SHIFT.openingCash)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Penerimaan Penjualan Tunai:</span>
              <span className="font-bold text-emerald-700">+{formatRupiah(ACTIVE_SHIFT.totalCashSales)}</span>
            </div>
            <div className="pt-2 border-t flex justify-between text-slate-800 font-bold">
              <span>Seharusnya Ada di Laci (Expected):</span>
              <span className="text-sm font-black">{formatRupiah(expectedCash)}</span>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center">
              <span className="font-semibold text-slate-700">Uang Fisik Dihitung Kasir:</span>
              <span className="text-base font-black text-slate-900">
                {formatRupiah(closingPhysicalCash)}
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex justify-between items-center ${
              cashDifference === 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}>
              <span className="font-bold">
                {cashDifference === 0 ? "Status Kas: SEIMBANG (Cocok)" : "Selisih Kasir:"}
              </span>
              <span className="text-base font-black">
                {cashDifference === 0
                  ? "Rp 0"
                  : `${cashDifference > 0 ? "+" : ""}${formatRupiah(cashDifference)}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL: TUTUP SHIFT KASIR */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent onClose={() => setIsCloseModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Formulir Penutupan Shift Kasir</DialogTitle>
            <DialogDescription>
              Hitung uang fisik di laci kasir dan serahkan ke kasir shift berikutnya
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-slate-500 block mb-0.5">Uang Kas Sistem (Expected):</span>
              <span className="text-xl font-black text-slate-800">{formatRupiah(expectedCash)}</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Hitungan Uang Fisik Nyata di Laci (Rp):
              </label>
              <Input
                type="number"
                value={closingPhysicalCash}
                onChange={(e) => setClosingPhysicalCash(Number(e.target.value))}
                className="h-11 text-lg font-bold text-center"
              />
            </div>

            <div className={`p-3 rounded-xl border flex justify-between items-center font-bold ${
              cashDifference === 0 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              <span>Selisih Akhir:</span>
              <span>{formatRupiah(cashDifference)}</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Catatan Serah Terima Shift:</label>
              <Input
                placeholder="Misal: Uang receh 2000 habis, diganti di shift 2..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCloseShift} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Konfirmasi Tutup Shift & Cetak Berita Acara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
