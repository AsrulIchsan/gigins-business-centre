"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  ShoppingCart,
  Store,
  Filter,
  Check,
  PackageCheck,
  AlertCircle,
  ArrowRight,
  Phone,
  User,
  Calendar,
  Eye,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
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
import { useBusinessStore } from "@/lib/business-store";

interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  unitName: string;
  price: number;
  subtotal: number;
}

interface OnlineOrder {
  id: string;
  orderNumber: string;
  channel: "WEBSTORE_INTERNAL" | "KLIKDOKTER" | "MARKETPLACE" | string;
  channelLabel: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED" | string;
  paymentProof?: string;
  paymentProofUploadedAt?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export default function BusinessOnlineOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = (params?.businessSlug as string) || "apotik-tamansari";
  const { activeBusiness } = useBusinessStore();

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForPOS, setSelectedOrderForPOS] = useState<OnlineOrder | null>(null);
  const [isPOSDialogOpen, setIsPOSDialogOpen] = useState(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<OnlineOrder | null>(null);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);

  // Fetch orders from API
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/online-orders?businessSlug=${businessSlug}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Gagal memuat pesanan online:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [businessSlug]);

  // Update status handler
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      await fetch("/api/online-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Proses ke POS handler
  const handleOpenProcessPOSModal = (order: OnlineOrder) => {
    setSelectedOrderForPOS(order);
    setIsPOSDialogOpen(true);
  };

  const handleConfirmProcessToPOS = async () => {
    if (!selectedOrderForPOS) return;
    const orderId = selectedOrderForPOS.id;
    await handleUpdateStatus(orderId, "PROCESSING");
    setIsPOSDialogOpen(false);
    router.push(`/b/${businessSlug}/pos?fromOnlineOrder=${encodeURIComponent(selectedOrderForPOS.orderNumber)}`);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Channel filter
      if (selectedChannel !== "ALL" && ord.channel !== selectedChannel) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "ALL" && ord.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = ord.orderNumber.toLowerCase().includes(q);
        const matchesCustomer = ord.customerName.toLowerCase().includes(q);
        const matchesPhone = ord.phone.toLowerCase().includes(q);
        const matchesItems = ord.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!matchesNumber && !matchesCustomer && !matchesPhone && !matchesItems) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedChannel, selectedStatus, searchQuery]);

  // Counts for channel badges
  const internalCount = orders.filter((o) => o.channel === "WEBSTORE_INTERNAL" && o.status !== "COMPLETED").length;
  const klikCount = orders.filter((o) => o.channel === "KLIKDOKTER" && o.status !== "COMPLETED").length;
  const mktCount = orders.filter((o) => o.channel === "MARKETPLACE" && o.status !== "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            Integrasi Pesanan Kanal Online ({activeBusiness.name})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sinkronisasi otomatis order masuk dari Webstore Apotik Tamansari, KlikDokter, dan Marketplace Internal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/store" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
              <Store className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Buka Webstore (store.)
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="text-xs bg-slate-50 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Menyinkronkan..." : "Tarik Order Terbaru"}
          </Button>

          <Link href={`/b/${businessSlug}/pos`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              Buka Kasir POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Channel Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Internal Webstore */}
        <Card
          onClick={() => setSelectedChannel(selectedChannel === "WEBSTORE_INTERNAL" ? "ALL" : "WEBSTORE_INTERNAL")}
          className={`cursor-pointer transition-all border ${
            selectedChannel === "WEBSTORE_INTERNAL"
              ? "ring-2 ring-blue-500 border-blue-300 bg-blue-50/50"
              : "border-slate-200 bg-white hover:border-blue-200"
          }`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                WS
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-slate-800">
                  Webstore Apotik Tamansari
                </CardTitle>
                <p className="text-[10px] text-slate-500">Katalog Online & Delivery Mandiri</p>
              </div>
            </div>
            <Badge variant="cyan" className="text-[9px]">ONLINE</Badge>
          </CardHeader>
          <CardContent className="pt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">
              {internalCount} Pesanan Aktif
            </span>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
              Filter <ArrowRight className="h-3 w-3" />
            </span>
          </CardContent>
        </Card>

        {/* Card 2: KlikDokter */}
        <Card
          onClick={() => setSelectedChannel(selectedChannel === "KLIKDOKTER" ? "ALL" : "KLIKDOKTER")}
          className={`cursor-pointer transition-all border ${
            selectedChannel === "KLIKDOKTER"
              ? "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/50"
              : "border-slate-200 bg-white hover:border-emerald-200"
          }`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                KD
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-slate-800">
                  KlikDokter Merchant
                </CardTitle>
                <p className="text-[10px] text-slate-500">Tebus Resep Dokter Digital</p>
              </div>
            </div>
            <Badge variant="success" className="text-[9px]">ONLINE</Badge>
          </CardHeader>
          <CardContent className="pt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">
              {klikCount} Pesanan Aktif
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              Filter <ArrowRight className="h-3 w-3" />
            </span>
          </CardContent>
        </Card>

        {/* Card 3: Marketplace */}
        <Card
          onClick={() => setSelectedChannel(selectedChannel === "MARKETPLACE" ? "ALL" : "MARKETPLACE")}
          className={`cursor-pointer transition-all border ${
            selectedChannel === "MARKETPLACE"
              ? "ring-2 ring-purple-500 border-purple-300 bg-purple-50/50"
              : "border-slate-200 bg-white hover:border-purple-200"
          }`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                MP
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-slate-800">
                  Marketplace Online
                </CardTitle>
                <p className="text-[10px] text-slate-500">Shopee / Tokopedia Terpadu</p>
              </div>
            </div>
            <Badge variant="purple" className="text-[9px]">TERHUBUNG</Badge>
          </CardHeader>
          <CardContent className="pt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900">
              {mktCount} Pesanan Aktif
            </span>
            <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
              Filter <ArrowRight className="h-3 w-3" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Channel Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Kanal:
            </span>
            {[
              { id: "ALL", label: "Semua Kanal" },
              { id: "WEBSTORE_INTERNAL", label: "Webstore Apotek" },
              { id: "KLIKDOKTER", label: "KlikDokter" },
              { id: "MARKETPLACE", label: "Marketplace" },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                  selectedChannel === ch.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
            {[
              { id: "ALL", label: "Semua" },
              { id: "PENDING", label: "Pending" },
              { id: "PROCESSING", label: "Proses" },
              { id: "SHIPPED", label: "Kirim / Siap Diambil" },
              { id: "COMPLETED", label: "Selesai" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedStatus === st.id
                    ? "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan No. Order, Nama Pasien/Pembeli, No. WhatsApp, atau Nama Obat..."
            className="pl-9 text-xs bg-slate-50/70"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Daftar Pesanan Masuk ({filteredOrders.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Proses pesanan ke kasir POS, siapkan obat dengan batch FIFO terdekat, dan serahkan ke kurir pengiriman.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Cetak Label Rekap
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
              Memuat data pesanan online dari sistem...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada pesanan online yang sesuai dengan filter yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="p-3">No. Order & Kanal</th>
                    <th className="p-3">Pelanggan & Kontak</th>
                    <th className="p-3">Rincian Obat Dipesan</th>
                    <th className="p-3 text-right">Total Tagihan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi Kasir & POS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {filteredOrders.map((ord) => {
                    const isInternal = ord.channel === "WEBSTORE_INTERNAL";
                    const isKlik = ord.channel === "KLIKDOKTER";
                    const isMkt = ord.channel === "MARKETPLACE";

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* No Order & Channel */}
                        <td className="p-3 align-top">
                          <span className="font-mono font-bold text-slate-900 block">
                            {ord.orderNumber}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge
                              variant={isInternal ? "cyan" : isKlik ? "success" : "purple"}
                              className="text-[9px] font-semibold"
                            >
                              {ord.channelLabel || ord.channel}
                            </Badge>
                          </div>
                          {ord.notes && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                              Catatan: {ord.notes}
                            </p>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="p-3 align-top">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {ord.customerName}
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {ord.phone}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="p-3 align-top">
                          <div className="space-y-1">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="text-[11px] flex items-center justify-between gap-4">
                                <span className="font-medium text-slate-700">
                                  {it.productName}
                                </span>
                                <span className="text-slate-500 font-bold shrink-0">
                                  {it.qty} {it.unitName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="p-3 text-right align-top">
                          <span className="font-black text-emerald-700 text-sm block">
                            {formatRupiah(ord.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Non-tunai / Web Payment
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center align-top">
                          {ord.status === "PENDING" && (
                            <Badge variant="warning" className="text-[10px] bg-amber-500 hover:bg-amber-500 text-white font-bold">
                              Pending
                            </Badge>
                          )}
                          {ord.status === "PROCESSING" && (
                            <Badge variant="cyan" className="text-[10px] bg-blue-600 hover:bg-blue-600 text-white font-bold">
                              Proses
                            </Badge>
                          )}
                          {ord.status === "SHIPPED" && (
                            <Badge variant="purple" className="text-[10px] bg-purple-600 hover:bg-purple-600 text-white font-bold">
                              Kirim / Siap Diambil
                            </Badge>
                          )}
                          {ord.status === "COMPLETED" && (
                            <Badge variant="success" className="text-[10px] bg-emerald-600 hover:bg-emerald-600 text-white font-bold">
                              Selesai
                            </Badge>
                          )}
                          {ord.status === "CANCELLED" && (
                            <Badge variant="destructive" className="text-[10px] font-bold">
                              Dibatalkan
                            </Badge>
                          )}

                          {ord.paymentProof && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProofOrder(ord);
                                  setIsProofDialogOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-2 py-0.5 rounded-full font-semibold transition-colors"
                              >
                                <Eye className="h-3 w-3 text-emerald-600" />
                                Bukti Bayar Ada
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right align-top space-y-1.5">
                          {/* Tombol Utama: Proses ke POS */}
                          <Button
                            size="sm"
                            onClick={() => handleOpenProcessPOSModal(ord)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold w-full flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Proses ke POS
                          </Button>

                          {/* Quick Step Advance Buttons */}
                          {ord.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ord.id, "PROCESSING")}
                              className="h-6 text-[10px] px-2 w-full text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                            >
                              &rarr; Mulai Proses / Racik
                            </Button>
                          )}

                          {ord.status === "PROCESSING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ord.id, "SHIPPED")}
                              className="h-6 text-[10px] px-2 w-full text-purple-700 border-purple-200 hover:bg-purple-50 font-bold"
                            >
                              &rarr; Kirim / Siap Diambil
                            </Button>
                          )}

                          {ord.status === "SHIPPED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ord.id, "COMPLETED")}
                              className="h-6 text-[10px] px-2 w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold"
                            >
                              &rarr; Tandai Selesai
                            </Button>
                          )}

                          {/* Direct Status Selector */}
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                              className="text-[10px] h-6 px-1.5 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 focus:outline-none"
                              title="Ubah status pesanan"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PROCESSING">Proses</option>
                              <option value="SHIPPED">Kirim / Siap Diambil</option>
                              <option value="COMPLETED">Selesai</option>
                              <option value="CANCELLED">Batal</option>
                            </select>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.print()}
                              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800"
                              title="Cetak Label Resep & Alamat"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Konfirmasi Proses ke POS */}
      <Dialog open={isPOSDialogOpen} onOpenChange={setIsPOSDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              Proses Pesanan ke Kasir POS
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pesanan online akan diteruskan ke keranjang kasir POS untuk validasi stok batch FIFO fisik dan pencetakan struk penjualan.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForPOS && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedOrderForPOS.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kanal Penjualan:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrderForPOS.channelLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrderForPOS.customerName} ({selectedOrderForPOS.phone})
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-slate-500">Total Transaksi:</span>
                  <span className="font-black text-emerald-700">
                    {formatRupiah(selectedOrderForPOS.totalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Rincian Obat:</p>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 border rounded-lg">
                  {selectedOrderForPOS.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.productName}</span>
                      <span className="font-bold text-slate-800">
                        {it.qty} {it.unitName} &bull; {formatRupiah(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPOSDialogOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmProcessToPOS}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
            >
              Lanjutkan ke Kasir POS &rarr;
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview Bukti Pembayaran dari Customer */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent onClose={() => setIsProofDialogOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Eye className="h-5 w-5 text-emerald-600" />
              Bukti Pembayaran Pelanggan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verifikasi transfer atau scan QRIS yang diunggah oleh pelanggan webstore
            </DialogDescription>
          </DialogHeader>

          {selectedProofOrder && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedProofOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pelanggan:</span>
                  <span className="font-bold text-slate-800">{selectedProofOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-black text-emerald-700">{formatRupiah(selectedProofOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Bukti Bayar Image Display */}
              <div className="rounded-xl border border-slate-200 p-2 bg-slate-100 text-center">
                {selectedProofOrder.paymentProof ? (
                  <img
                    src={selectedProofOrder.paymentProof}
                    alt="Bukti Transfer Pelanggan"
                    className="max-h-72 mx-auto rounded-lg object-contain shadow-sm"
                  />
                ) : (
                  <p className="py-8 text-slate-400">Belum ada file bukti bayar.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Status saat ini: <b>{selectedProofOrder.status}</b>
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    handleUpdateStatus(selectedProofOrder.id, "PROCESSING");
                    setIsProofDialogOpen(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Verifikasi & Setujui Pesanan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
