"use client";

import React, { useState } from "react";
import {
  Globe,
  RefreshCw,
  Search,
  CheckCircle,
  Truck,
  Clock,
  Printer,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { MOCK_ONLINE_ORDERS } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState(MOCK_ONLINE_ORDERS);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    alert(`Status pesanan ${orderId} diubah menjadi ${newStatus}!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Integrasi Pesanan Kanal Online (Omnichannel Apotek)
          </h1>
          <p className="text-xs text-slate-500">
            Sinkronisasi otomatis order masuk dari VmedisMart, KlikDokter, dan Webstore Apotik Tamansari.
          </p>
        </div>

        <Button
          onClick={() => alert("Sinkronisasi Webhook & API Kanal Online selesai! Semua pesanan terbaru telah ditarik.")}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Tarik Pesanan Online Terbaru
        </Button>
      </div>

      {/* Channel Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { name: "VmedisMart API", status: "ONLINE", badge: "cyan", orders: "1 Pesanan Aktif" },
          { name: "KlikDokter Merchant", status: "ONLINE", badge: "success", orders: "1 Pesanan Aktif" },
          { name: "Webstore Tamansari", status: "ONLINE", badge: "purple", orders: "1 Pesanan Siap" },
        ].map((ch, i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">{ch.name}</CardTitle>
              <Badge variant={ch.badge as any} className="text-[9px]">
                {ch.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-bold text-slate-700">{ch.orders}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Daftar Pesanan Masuk dari Kanal Digital
          </CardTitle>
          <CardDescription>
            Siapkan obat sesuai pesanan, potong stok batch FIFO, dan serahkan ke kurir pengiriman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">No. Order</th>
                  <th className="p-3">Kanal Penjualan</th>
                  <th className="p-3">Nama Pembeli & Kontak</th>
                  <th className="p-3">Rincian Obat Dipesan</th>
                  <th className="p-3 text-right">Total Tagihan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          ord.channel === "VMEDISMART"
                            ? "cyan"
                            : ord.channel === "KLIKDOKTER"
                            ? "success"
                            : "purple"
                        }
                        className="text-[10px]"
                      >
                        {ord.channel}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{ord.customerName}</div>
                      <span className="text-[10px] text-slate-400">{ord.phone}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            {it.name} &bull; <span className="font-semibold">{it.qty} {it.unit}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      {formatRupiah(ord.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          ord.status === "COMPLETED"
                            ? "success"
                            : ord.status === "PROCESSING"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {ord.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, "PROCESSING")}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold"
                        >
                          Siapkan Obat
                        </Button>
                      )}
                      {ord.status === "PROCESSING" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, "COMPLETED")}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 font-semibold"
                        >
                          Kirim ke Kurir
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-7 text-xs"
                        title="Cetak Label Resep & Pengiriman"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </td>
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
