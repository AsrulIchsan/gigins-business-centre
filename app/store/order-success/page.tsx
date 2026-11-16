"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Phone,
  ArrowRight,
  Pill,
  Clock,
  Truck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "ORD-WEB-20261116-001";
  const total = Number(searchParams.get("total") || "21000");
  const name = searchParams.get("name") || "Pelanggan Terhormat";
  const phone = searchParams.get("phone") || "-";
  const method = searchParams.get("method") || "QRIS";

  const waMessage = encodeURIComponent(
    `Halo Apotik Tamansari, saya telah membuat pesanan obat di Webstore dengan No. Pesanan ${orderNumber} atas nama ${name} total ${formatRupiah(
      total
    )}. Mohon diproses ya.`
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="border-emerald-200 bg-white shadow-xl rounded-3xl overflow-hidden text-center">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-8 text-white">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <Badge variant="cyan" className="mb-2 text-xs uppercase font-bold">
            Pesanan Berhasil Dikirim
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Terima Kasih, {name}!
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
            Pesanan Anda telah masuk secara realtime ke sistem komputer kasir Apotik Tamansari.
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6 text-xs text-left">
          {/* Order Details Receipt Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Nomor Pesanan Webstore:</span>
              <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {orderNumber}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Status Pesanan:</span>
              <Badge variant="destructive" className="text-[10px] bg-amber-500 hover:bg-amber-500">
                PENDING (Menunggu Diracik Apoteker)
              </Badge>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Metode Pembayaran:</span>
              <span className="font-bold text-slate-800 uppercase">{method}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">No. WhatsApp Pemesan:</span>
              <span className="font-mono font-semibold text-slate-800">{phone}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Total Tagihan:</span>
              <span className="text-lg font-black text-emerald-700">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          {/* Sync Information Alert */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
            <Truck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700">
              <p className="font-bold text-emerald-950">
                Terhubung Langsung ke Kasir POS Apotik Tamansari:
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Petugas apotek sedang memeriksa stok fisik dan tanggal kedaluwarsa (FIFO). Setelah dikonfirmasi, kurir akan segera diberangkatkan ke alamat Anda.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <a
              href={`https://wa.me/628122334455?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 text-xs shadow-md shadow-green-600/20">
                <Phone className="mr-2 h-4 w-4" />
                Konfirmasi Pesanan ke WhatsApp Apoteker
              </Button>
            </a>

            <div className="flex gap-2">
              <Link href="/store" className="flex-1">
                <Button variant="outline" className="w-full text-xs font-semibold py-5">
                  Kembali ke Etalase Toko
                </Button>
              </Link>
              <Link href="/online-orders" className="flex-1">
                <Button variant="ghost" className="w-full text-xs text-slate-600 py-5 flex items-center justify-center gap-1">
                  Lihat di Layar Kasir <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StoreOrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-12 text-center text-xs text-slate-500">
          Memuat rincian pesanan...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
