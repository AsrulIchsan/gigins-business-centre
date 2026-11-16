"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Clock,
  Pill,
  Truck,
  CheckCircle,
  Phone,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StoreCustomerOrdersPage() {
  const { customer } = useStore();

  const [searchKey, setSearchKey] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Keep track of the active query currently being polled
  const activeTrackedQueryRef = useRef<string>("");

  const statusSteps = [
    { key: "PENDING", label: "Pending", icon: Clock },
    { key: "PROCESSING", label: "Proses", icon: Pill },
    { key: "SHIPPED", label: "Kirim / Siap Diambil", icon: Truck },
    { key: "COMPLETED", label: "Selesai", icon: CheckCircle },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case "PENDING":
        return 0;
      case "PROCESSING":
        return 1;
      case "SHIPPED":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return 0;
    }
  };

  // Fetch orders based on customer phone or search query
  const loadOrders = async (query?: string, silent = false) => {
    const q = (
      query !== undefined
        ? query
        : searchKey || customer?.phone || activeTrackedQueryRef.current || ""
    ).trim();

    if (!q) {
      if (!silent) {
        setOrders([]);
        setSearched(false);
      }
      return;
    }

    activeTrackedQueryRef.current = q;

    if (!silent) {
      setLoading(true);
      setErrorMsg("");
      setSearched(true);
    } else {
      setIsSyncing(true);
    }

    try {
      const isOrderNum = q.toUpperCase().includes("ORD-");
      const cacheBuster = `_t=${Date.now()}`;
      const url = isOrderNum
        ? `/api/online-orders?orderNumber=${encodeURIComponent(q)}&${cacheBuster}`
        : `/api/online-orders?phone=${encodeURIComponent(q)}&${cacheBuster}`;

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const data = await res.json();
      if (data.success) {
        let fetched: any[] = [];
        if (data.order) {
          fetched = [data.order];
        } else if (Array.isArray(data.orders)) {
          fetched = data.orders;
        }

        setOrders(fetched);
        setLastSyncTime(new Date());
      } else if (!silent) {
        setOrders([]);
      }
    } catch {
      if (!silent) {
        setErrorMsg("Gagal memuat status pesanan. Pastikan koneksi internet stabil.");
      }
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  };

  // Mount effect: check URL params and customer info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlOrder = params.get("orderNumber") || params.get("order");
      const urlPhone = params.get("phone");

      if (urlOrder) {
        setSearchKey(urlOrder);
        activeTrackedQueryRef.current = urlOrder;
        loadOrders(urlOrder, false);
        return;
      } else if (urlPhone) {
        setSearchKey(urlPhone);
        activeTrackedQueryRef.current = urlPhone;
        loadOrders(urlPhone, false);
        return;
      }
    }

    if (customer?.phone) {
      activeTrackedQueryRef.current = customer.phone;
      loadOrders(customer.phone, false);
    }
  }, [customer?.phone]);

  // Real-time synchronization:
  // 1. Background silent polling (every 2.5s)
  // 2. BroadcastChannel (0ms delay for same-browser cashier actions)
  // 3. Storage event listener (fallback cross-tab)
  // 4. Tab visibility change (instantly refresh when customer tab is focused)
  useEffect(() => {
    // 1. Silent polling interval
    const interval = setInterval(() => {
      if (activeTrackedQueryRef.current) {
        loadOrders(activeTrackedQueryRef.current, true);
      }
    }, 2500);

    // 2. BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("order_status_sync");
      channel.onmessage = (event) => {
        const { orderId, orderNumber, status } = event.data || {};
        if (orderNumber || orderId) {
          setOrders((prev) =>
            prev.map((ord) => {
              const match =
                (orderId && ord.id === orderId) ||
                (orderNumber && ord.orderNumber?.toLowerCase() === orderNumber.toLowerCase());
              if (match && status) {
                return { ...ord, status };
              }
              return ord;
            })
          );
          setLastSyncTime(new Date());
          if (activeTrackedQueryRef.current) {
            loadOrders(activeTrackedQueryRef.current, true);
          }
        }
      };
    } catch {
      // BroadcastChannel not available
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "last_order_status_sync" && e.newValue) {
        try {
          const { orderId, orderNumber, status } = JSON.parse(e.newValue);
          if (orderNumber || orderId) {
            setOrders((prev) =>
              prev.map((ord) => {
                const match =
                  (orderId && ord.id === orderId) ||
                  (orderNumber && ord.orderNumber?.toLowerCase() === orderNumber.toLowerCase());
                if (match && status) {
                  return { ...ord, status };
                }
                return ord;
              })
            );
            setLastSyncTime(new Date());
            if (activeTrackedQueryRef.current) {
              loadOrders(activeTrackedQueryRef.current, true);
            }
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activeTrackedQueryRef.current) {
        loadOrders(activeTrackedQueryRef.current, true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-semibold mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Etalase Toko
          </Link>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-600" />
            Lacak Pesanan Saya
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-1">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Sync Aktif
            </span>
            <span className="text-slate-500">
              Status terupdate otomatis tanpa perlu refresh halaman.
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                &bull; Sinkronisasi: {lastSyncTime.toLocaleTimeString("id-ID")}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadOrders(undefined, false)}
          disabled={loading}
          className="text-xs shrink-0"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading || isSyncing ? "animate-spin text-emerald-600" : ""}`} />
          {isSyncing ? "Menyelaraskan..." : "Segarkan Status"}
        </Button>
      </div>

      {/* Search Order Card */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadOrders(searchKey, false);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Masukkan Nomor Pesanan (ORD-WEB-...) atau No. WhatsApp Anda..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 rounded-xl"
            >
              {loading ? "Mencari..." : "Lacak Pesanan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          <p>Memeriksa status pesanan langsung ke sistem Apotik Tamansari...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">
            {searched ? "Pesanan Tidak Ditemukan" : "Masukkan Nomor Pesanan Anda"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searched
              ? "Pastikan nomor pesanan (ORD-WEB-...) atau nomor WhatsApp yang Anda masukkan sesuai dengan saat checkout."
              : "Masukkan nomor pesanan atau nomor WhatsApp untuk melihat status peracikan obat Anda."}
          </p>
          <div className="pt-2">
            <Link href="/store">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                Mulai Belanja di Webstore
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const currentIdx = getStepIndex(ord.status);
            const waText = encodeURIComponent(
              `Halo Apotik Tamansari, saya ingin bertanya status pesanan saya ${ord.orderNumber}. Terima kasih.`
            );

            return (
              <Card
                key={ord.id}
                className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden"
              >
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {ord.orderNumber}
                        </span>
                        <Badge
                          variant={
                            ord.status === "COMPLETED"
                              ? "success"
                              : ord.status === "SHIPPED"
                              ? "purple"
                              : ord.status === "PROCESSING"
                              ? "cyan"
                              : "warning"
                          }
                          className="text-[10px] font-bold uppercase transition-all duration-300"
                        >
                          {ord.status === "PENDING"
                            ? "Pending"
                            : ord.status === "PROCESSING"
                            ? "Proses"
                            : ord.status === "SHIPPED"
                            ? "Kirim / Siap Diambil"
                            : ord.status === "COMPLETED"
                            ? "Selesai"
                            : ord.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dipesan pada: {formatDateIndo(ord.createdAt, true)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Tagihan:</span>
                      <span className="font-black text-base text-emerald-800">
                        {formatRupiah(ord.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Status Tracker Stepper with Live Auto-Update */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Progres Pesanan Farmasi:
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600 animate-pulse" />
                        Live Auto-Update
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {statusSteps.map((step, idx) => {
                        const isPassed = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                                isCurrent
                                  ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100 scale-105"
                                  : isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200/80 text-slate-400"
                              }`}
                            >
                              <StepIcon className="h-4 w-4" />
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-1.5 leading-tight transition-colors duration-300 ${
                                isCurrent
                                  ? "text-emerald-800 font-black"
                                  : isPassed
                                  ? "text-slate-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Rincian Obat:</span>
                    <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                      {ord.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-0.5">
                          <span className="text-slate-700 font-medium">
                            {it.productName} ({it.qty} {it.unitName})
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatRupiah(it.subtotal || it.price * it.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery & Payment Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Tujuan & Pengantaran:</span>
                      <span className="font-bold text-slate-800 block">{ord.customerName}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ord.notes || "-"}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Status Pembayaran:</span>
                        <span className="font-bold text-slate-800 block">
                          {ord.paymentProof ? "Bukti Bayar Terunggah (Verifikasi)" : "Menunggu Pembayaran"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/store/order-success?orderNumber=${encodeURIComponent(
                            ord.orderNumber
                          )}&total=${ord.totalAmount}&name=${encodeURIComponent(
                            ord.customerName
                          )}&phone=${encodeURIComponent(ord.phone)}`}
                          className="text-[10px] text-emerald-700 font-bold hover:underline"
                        >
                          &rarr; Buka Halaman Upload Bukti Bayar
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      No. WhatsApp Terdaftar: <b className="font-mono text-slate-700">{ord.phone}</b>
                    </span>
                    <a
                      href={`https://wa.me/628122334455?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="text-xs text-green-700 border-green-200 hover:bg-green-50">
                        <Phone className="mr-1 h-3.5 w-3.5 text-green-600" /> Tanya Apoteker
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
