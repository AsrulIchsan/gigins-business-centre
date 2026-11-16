"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Receipt,
  Printer,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Pill,
  Globe,
  ShoppingBag,
  Filter,
  Phone,
  User,
  Calendar,
  Eye,
  Share2,
  Bell,
  BellOff,
  Volume2,
  Store,
  FileText,
  Check,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  X,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { printThermalReceipt, ThermalPaperWidth, ThermalReceiptData } from "@/lib/thermal-printer";
import {
  playNewOrderChime,
  playSuccessChime,
  isAudioNotificationEnabled,
  setAudioNotificationEnabled,
} from "@/lib/audio-notification";
import { PosSaleRecord } from "@/lib/pos-sales-data";

export interface UnifiedOrder {
  id: string;
  orderNumber: string;
  sourceType: "POS" | "ONLINE";
  channel: "POS_OFFLINE" | "WEBSTORE_INTERNAL" | "KLIKDOKTER" | "MARKETPLACE" | string;
  channelLabel: string;
  customerName: string;
  phone?: string;
  customerAddress?: string;
  doctorName?: string;
  prescriptionNumber?: string;
  cashierName?: string;
  items: Array<{
    productId?: string;
    productName: string;
    qty: number;
    unitName?: string;
    price: number;
    subtotal: number;
    batchNumber?: string;
  }>;
  subtotal: number;
  compoundingFee?: number;
  embalaseFee?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentNote?: string;
  cashGiven?: number;
  roundingAmount?: number;
  change?: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED" | string;
  paymentProof?: string;
  paymentProofUploadedAt?: string;
  shippingMethod?: string;
  notes?: string;
  createdAt: string;
  rawSale?: PosSaleRecord;
  rawOnline?: any;
}

interface PosOrderHistoryProps {
  businessSlug?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  currentCashier?: string;
  onLoadOrderToPOS?: (order: UnifiedOrder) => void;
  onSwitchToCashier?: () => void;
  initialChannelFilter?: string;
}

export default function PosOrderHistory({
  businessSlug = "apotik-tamansari",
  businessName = "Apotik Tamansari",
  businessAddress = "Jl. Tamansari No. 45, Bandung",
  businessPhone = "022-2501234",
  currentCashier = "Siti Rahma, A.Md.Farm",
  onLoadOrderToPOS,
  onSwitchToCashier,
  initialChannelFilter = "ALL",
}: PosOrderHistoryProps) {
  // State
  const [posSales, setPosSales] = useState<PosSaleRecord[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Audio Notification
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [newOrderAlert, setNewOrderAlert] = useState<UnifiedOrder | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>(initialChannelFilter);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Print & Receipt Modal
  const [selectedSaleForReprint, setSelectedSaleForReprint] = useState<UnifiedOrder | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [thermalWidth, setThermalWidth] = useState<ThermalPaperWidth>("58mm");

  // Payment Proof Modal
  const [selectedProofOrder, setSelectedProofOrder] = useState<UnifiedOrder | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Status Updating state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Ref to track known online orders to detect newly arrived ones
  const knownOnlineOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Initialize sound settings
  useEffect(() => {
    setSoundEnabled(isAudioNotificationEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioNotificationEnabled(next);
    if (next) {
      playNewOrderChime(0.25);
    }
  };

  // Fetch all orders (POS + Online)
  const fetchAllOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const cacheBust = `_t=${Date.now()}`;

      // 1. Fetch Online Orders
      const resOnline = await fetch(`/api/online-orders?businessSlug=${businessSlug}&${cacheBust}`, {
        cache: "no-store",
      });
      const dataOnline = await resOnline.json();
      const fetchedOnline: any[] = dataOnline.success && Array.isArray(dataOnline.orders) ? dataOnline.orders : [];

      // Check for incoming new orders
      if (!isInitialLoadRef.current) {
        const newArrivals = fetchedOnline.filter(
          (o) => !knownOnlineOrderIdsRef.current.has(o.id) && o.status === "PENDING"
        );

        if (newArrivals.length > 0) {
          const newest = newArrivals[0];
          if (soundEnabled) {
            playNewOrderChime(0.4);
          }

          // Map to UnifiedOrder for notification alert
          const alertObj: UnifiedOrder = {
            id: newest.id,
            orderNumber: newest.orderNumber,
            sourceType: "ONLINE",
            channel: newest.channel,
            channelLabel: newest.channelLabel || "Webstore Apotik",
            customerName: newest.customerName,
            phone: newest.phone,
            items: (newest.items || []).map((it: any) => ({
              productName: it.productName || it.name,
              qty: Number(it.qty || it.quantity || 1),
              unitName: it.unitName || "Pcs",
              price: Number(it.price || 0),
              subtotal: Number(it.subtotal || 0),
            })),
            subtotal: Number(newest.totalAmount || 0),
            totalAmount: Number(newest.totalAmount || 0),
            paymentMethod: newest.paymentMethod || "QRIS",
            status: newest.status || "PENDING",
            createdAt: newest.createdAt || new Date().toISOString(),
          };

          setNewOrderAlert(alertObj);
        }
      }

      // Update known IDs
      fetchedOnline.forEach((o) => knownOnlineOrderIdsRef.current.add(o.id));
      isInitialLoadRef.current = false;
      setOnlineOrders(fetchedOnline);

      // 2. Fetch POS Sales
      const resPos = await fetch(`/api/pos/sales?businessSlug=${businessSlug}&${cacheBust}`, {
        cache: "no-store",
      });
      const dataPos = await resPos.json();
      if (dataPos.success && Array.isArray(dataPos.sales)) {
        setPosSales(dataPos.sales);
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Gagal sinkronisasi data riwayat pesanan:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load & Polling interval (Live Update every 4 seconds)
  useEffect(() => {
    fetchAllOrders();

    const interval = setInterval(() => {
      fetchAllOrders(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [businessSlug, soundEnabled]);

  // Listen to cross-tab BroadcastChannel & localStorage events
  useEffect(() => {
    let orderSyncChannel: BroadcastChannel | null = null;
    let newOrderChannel: BroadcastChannel | null = null;

    try {
      orderSyncChannel = new BroadcastChannel("order_status_sync");
      orderSyncChannel.onmessage = (event) => {
        if (event.data?.orderId || event.data?.orderNumber) {
          fetchAllOrders(true);
        }
      };
    } catch {}

    try {
      newOrderChannel = new BroadcastChannel("new_online_order");
      newOrderChannel.onmessage = (event) => {
        if (event.data?.order) {
          if (soundEnabled) {
            playNewOrderChime(0.4);
          }
          fetchAllOrders(true);
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "last_order_status_sync" || e.key === "last_new_online_order") {
        if (e.key === "last_new_online_order" && soundEnabled) {
          playNewOrderChime(0.4);
        }
        fetchAllOrders(true);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (orderSyncChannel) orderSyncChannel.close();
      if (newOrderChannel) newOrderChannel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [soundEnabled]);

  // Combine POS sales and Online orders into a unified list
  const unifiedOrders: UnifiedOrder[] = useMemo(() => {
    const list: UnifiedOrder[] = [];

    // Map POS Sales
    for (const sale of posSales) {
      list.push({
        id: sale.id || `sale-${sale.saleNumber}`,
        orderNumber: sale.saleNumber,
        sourceType: "POS",
        channel: "POS_OFFLINE",
        channelLabel: "Kasir POS (Offline)",
        customerName: sale.customer?.name || "Pelanggan Umum",
        phone: sale.customer?.phone,
        doctorName: sale.doctor?.name,
        prescriptionNumber: sale.prescriptionNumber,
        cashierName: sale.cashier || currentCashier,
        items: (sale.items || []).map((it) => ({
          productId: it.productId,
          productName: it.name,
          qty: it.qty,
          unitName: it.unitName || "Pcs",
          price: it.sellPrice,
          subtotal: it.subtotal,
          batchNumber: it.batchNumber,
        })),
        subtotal: sale.subtotal,
        compoundingFee: sale.compoundingFee,
        embalaseFee: sale.embalaseFee,
        discountAmount: sale.discountAmount,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        paymentNote: sale.paymentNote,
        cashGiven: sale.cashGiven,
        roundingAmount: sale.roundingAmount,
        change: sale.change,
        status: sale.status || "COMPLETED",
        createdAt: sale.date || sale.createdAt || new Date().toISOString(),
        rawSale: sale,
      });
    }

    // Map Online Orders
    for (const ord of onlineOrders) {
      list.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        sourceType: "ONLINE",
        channel: ord.channel,
        channelLabel:
          ord.channel === "WEBSTORE_INTERNAL"
            ? "Webstore Apotik Tamansari"
            : ord.channel === "KLIKDOKTER"
            ? "KlikDokter Merchant"
            : ord.channel === "MARKETPLACE"
            ? "Marketplace (Shopee/Tokopedia)"
            : ord.channelLabel || "Pesanan Online",
        customerName: ord.customerName || "Pelanggan Online",
        phone: ord.phone,
        customerAddress: ord.customerAddress || ord.address,
        shippingMethod: ord.shippingMethod,
        items: (ord.items || []).map((it: any) => ({
          productId: it.productId,
          productName: it.productName || it.name,
          qty: Number(it.qty || it.quantity || 1),
          unitName: it.unitName || "Pcs",
          price: Number(it.price || 0),
          subtotal: Number(it.subtotal || 0),
        })),
        subtotal: Number(ord.totalAmount || 0),
        totalAmount: Number(ord.totalAmount || 0),
        paymentMethod: ord.paymentMethod || "QRIS",
        paymentProof: ord.paymentProof,
        paymentProofUploadedAt: ord.paymentProofUploadedAt,
        notes: ord.notes,
        status: ord.status || "PENDING",
        createdAt: ord.createdAt || new Date().toISOString(),
        rawOnline: ord,
      });
    }

    // Sort by createdAt desc
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [posSales, onlineOrders, currentCashier]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return unifiedOrders.filter((ord) => {
      // Channel filter
      if (channelFilter !== "ALL") {
        if (channelFilter === "POS" && ord.sourceType !== "POS") return false;
        if (channelFilter === "ONLINE" && ord.sourceType !== "ONLINE") return false;
        if (
          channelFilter !== "POS" &&
          channelFilter !== "ONLINE" &&
          ord.channel !== channelFilter
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "ALL" && ord.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = ord.orderNumber.toLowerCase().includes(q);
        const matchesCust = ord.customerName.toLowerCase().includes(q);
        const matchesPhone = ord.phone ? ord.phone.toLowerCase().includes(q) : false;
        const matchesItem = ord.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!matchesNum && !matchesCust && !matchesPhone && !matchesItem) return false;
      }

      return true;
    });
  }, [unifiedOrders, channelFilter, statusFilter, searchQuery]);

  // Counts for tabs/badges
  const countTotal = unifiedOrders.length;
  const countPOS = unifiedOrders.filter((o) => o.sourceType === "POS").length;
  const countInternal = unifiedOrders.filter((o) => o.channel === "WEBSTORE_INTERNAL").length;
  const countKlikDokter = unifiedOrders.filter((o) => o.channel === "KLIKDOKTER").length;
  const countMarketplace = unifiedOrders.filter((o) => o.channel === "MARKETPLACE").length;

  const countPendingOnline = unifiedOrders.filter(
    (o) => o.sourceType === "ONLINE" && o.status === "PENDING"
  ).length;
  const countProcessing = unifiedOrders.filter((o) => o.status === "PROCESSING").length;

  // Handle Online Order Status Update
  const handleUpdateOnlineStatus = async (order: UnifiedOrder, newStatus: string) => {
    setUpdatingOrderId(order.id);

    // Optimistic UI update
    setOnlineOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    // Broadcast immediately across tabs (0ms delay)
    if (typeof window !== "undefined") {
      try {
        const ch = new BroadcastChannel("order_status_sync");
        ch.postMessage({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: newStatus,
          timestamp: Date.now(),
        });
        ch.close();
      } catch {}
      try {
        localStorage.setItem(
          "last_order_status_sync",
          JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: newStatus,
            timestamp: Date.now(),
          })
        );
      } catch {}
    }

    try {
      await fetch(`/api/online-orders?_t=${Date.now()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: newStatus,
        }),
      });

      playSuccessChime(0.2);
    } catch (err) {
      console.error("Gagal update status pesanan:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Convert UnifiedOrder to ThermalReceiptData for thermal printing
  const buildReceiptData = (order: UnifiedOrder): ThermalReceiptData => {
    return {
      businessName,
      businessAddress,
      businessPhone,
      licenseNumber: "SIPA: 19850412/SIPA-32.73/2022",
      saleNumber: order.orderNumber,
      date: new Date(order.createdAt),
      cashier: order.cashierName || currentCashier,
      customerName: order.customerName,
      doctorName: order.doctorName,
      saleType: order.prescriptionNumber ? "RESEP DOKTER" : order.sourceType === "ONLINE" ? `ONLINE (${order.channelLabel})` : "OBAT BEBAS",
      items: order.items.map((it) => ({
        name: it.productName,
        qty: it.qty,
        unitName: it.unitName,
        sellPrice: it.price,
        subtotal: it.subtotal,
      })),
      subtotal: order.subtotal,
      compoundingFee: order.compoundingFee || 0,
      embalaseFee: order.embalaseFee || 0,
      discountAmount: order.discountAmount || 0,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentNote: order.paymentNote || (order.sourceType === "ONLINE" ? `Kanal: ${order.channelLabel}` : undefined),
      cashGiven: order.cashGiven !== undefined ? order.cashGiven : order.totalAmount,
      roundingAmount: order.roundingAmount || 0,
      change: order.change || 0,
      footerNote:
        order.sourceType === "ONLINE"
          ? `Pesanan Online Apotik Tamansari - Semoga Lekas Sembuh`
          : `Semoga Lekas Sembuh - Terima Kasih atas Kunjungan Anda`,
    };
  };

  // Trigger Thermal Reprint
  const handlePrintThermal = (order: UnifiedOrder, width: ThermalPaperWidth = thermalWidth) => {
    const data = buildReceiptData(order);
    printThermalReceipt(data, width);
    playSuccessChime(0.15);
  };

  // Open Detailed Modal
  const handleOpenReprintModal = (order: UnifiedOrder) => {
    setSelectedSaleForReprint(order);
    setIsReprintModalOpen(true);
  };

  // Share receipt via WhatsApp
  const handleShareWhatsApp = (order: UnifiedOrder) => {
    if (!order.phone) {
      alert("Nomor telepon/WhatsApp pelanggan tidak tersedia.");
      return;
    }
    const cleanPhone = order.phone.replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

    const itemsSummary = order.items
      .map((it) => `- ${it.productName} (${it.qty} ${it.unitName || "pcs"}): ${formatRupiah(it.subtotal)}`)
      .join("\n");

    const text = encodeURIComponent(
      `*STRUK TRANSAKSI APOTIK TAMANSARI*\n` +
      `No. Transaksi: ${order.orderNumber}\n` +
      `Tanggal: ${new Date(order.createdAt).toLocaleString("id-ID")}\n` +
      `Pelanggan: ${order.customerName}\n` +
      `--------------------------------\n` +
      `*Rincian Belanja:*\n${itemsSummary}\n` +
      `--------------------------------\n` +
      `*Total Bayar:* ${formatRupiah(order.totalAmount)}\n` +
      `Metode: ${order.paymentMethod}\n` +
      `Status: ${order.status}\n\n` +
      `Terima kasih telah mempercayakan kebutuhan kesehatan Anda di Apotik Tamansari.\n` +
      `Semoga Lekas Sembuh!`
    );

    window.open(`https://wa.me/${waPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* INCOMING ORDER ALERT BANNER (If a new online order arrives) */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white p-3.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse border-2 border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  PESANAN BARU MASUK
                </span>
                <span className="text-xs font-mono font-bold text-amber-100">
                  {newOrderAlert.orderNumber}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {newOrderAlert.customerName} &bull; {formatRupiah(newOrderAlert.totalAmount)}
              </p>
              <p className="text-[11px] text-amber-100">
                {newOrderAlert.channelLabel} ({newOrderAlert.items.length} item) &bull; Membutuhkan konfirmasi kasir!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              onClick={() => {
                setChannelFilter(newOrderAlert.channel);
                setStatusFilter("PENDING");
                setNewOrderAlert(null);
              }}
              className="bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs h-8 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 mr-1 text-rose-600" />
              Lihat Pesanan
            </Button>
            <Button
              size="sm"
              onClick={() => {
                handleUpdateOnlineStatus(newOrderAlert, "PROCESSING");
                setNewOrderAlert(null);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Langsung Proses
            </Button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="text-white hover:text-amber-200 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP CONTROL BAR: Stats, Live Sync Beacon, Audio Bell, & Back to Cashier */}
      <div className="bg-white p-4 rounded-xl border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Riwayat Pesanan Kasir POS & Semua Pesanan Online
              </h2>
              {/* LIVE SYNC PULSING BEACON */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync Aktif (4s)</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau seluruh transaksi kasir offline, pesanan webstore apotek, KlikDokter, & marketplace secara real-time.
            </p>
          </div>

          {/* Quick Actions Header: Sound Bell Toggle, Refresh, and Switch to Cashier */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Audio Notification Bell Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className={`h-9 text-xs font-semibold gap-1.5 transition-all ${
                soundEnabled
                  ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                  : "bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100"
              }`}
              title={soundEnabled ? "Notifikasi Suara Bel Aktif (Klik untuk Mute)" : "Notifikasi Suara Bel Mati (Klik untuk Aktifkan)"}
            >
              {soundEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                  <span>Dering Bel Aktif</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dering Bel: Mute</span>
                </>
              )}
            </Button>

            {/* Test Bell Audio Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playNewOrderChime(0.4);
              }}
              className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
              title="Uji coba nada dering lonceng notifikasi pesanan masuk"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Tes Nada Bel</span>
            </Button>

            {/* Manual Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllOrders(false)}
              disabled={refreshing}
              className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            {/* Switch to Cashier Register Button if passed */}
            {onSwitchToCashier && (
              <Button
                size="sm"
                onClick={onSwitchToCashier}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Buka Layar Kasir</span>
              </Button>
            )}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Semua Transaksi</span>
            <span className="text-lg font-black text-slate-800 font-mono">{countTotal}</span>
            <span className="text-[10px] text-slate-400 block">Riwayat terdata</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Kasir POS (Offline)</span>
            <span className="text-lg font-black text-emerald-800 font-mono">{countPOS}</span>
            <span className="text-[10px] text-emerald-600 block">Transaksi register</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Pesanan Online Baru</span>
              {countPendingOnline > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="text-lg font-black text-amber-900 font-mono">{countPendingOnline}</span>
            <span className="text-[10px] text-amber-700 block">Menunggu Konfirmasi</span>
          </div>

          <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200">
            <span className="text-[10px] font-bold text-sky-700 uppercase block">Sedang Diproses</span>
            <span className="text-lg font-black text-sky-800 font-mono">{countProcessing}</span>
            <span className="text-[10px] text-sky-600 block">Disiapkan / Dikemas</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 rounded-xl border shadow-xs space-y-3">
        {/* Channel Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setChannelFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              channelFilter === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Semua Kanal</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {countTotal}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("POS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              channelFilter === "POS"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kasir POS (Offline)</span>
            <span className="bg-emerald-800/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {countPOS}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("WEBSTORE_INTERNAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              channelFilter === "WEBSTORE_INTERNAL"
                ? "bg-cyan-700 text-white shadow-xs"
                : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Webstore Apotik</span>
            <span className="bg-cyan-800/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {countInternal}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("KLIKDOKTER")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              channelFilter === "KLIKDOKTER"
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>KlikDokter</span>
            <span className="bg-blue-800/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {countKlikDokter}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("MARKETPLACE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              channelFilter === "MARKETPLACE"
                ? "bg-orange-700 text-white shadow-xs"
                : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Marketplace</span>
            <span className="bg-orange-800/20 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {countMarketplace}
            </span>
          </button>
        </div>

        {/* Status Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-44"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">PENDING (Menunggu)</option>
              <option value="PROCESSING">PROCESSING (Diproses)</option>
              <option value="SHIPPED">SHIPPED (Dikirim/Siap)</option>
              <option value="COMPLETED">COMPLETED (Selesai)</option>
              <option value="CANCELLED">CANCELLED (Batal)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari No. Order/Invoice, Nama Pelanggan, No. Telp, atau Obat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Memuat riwayat transaksi kasir & pesanan online...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Tidak ada riwayat pesanan yang cocok</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan pesanan dengan filter kanal &quot;{channelFilter}&quot; dan status &quot;{statusFilter}&quot;.
              Coba sesuaikan pencarian Anda atau klik Refresh.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChannelFilter("ALL");
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs"
            >
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPOS = order.sourceType === "POS";
            const isUpdating = updatingOrderId === order.id;

            // Status color badge
            let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-300";
            if (order.status === "PENDING") {
              statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-300 animate-pulse";
            } else if (order.status === "PROCESSING") {
              statusBadgeClass = "bg-sky-100 text-sky-800 border-sky-300 font-bold";
            } else if (order.status === "SHIPPED") {
              statusBadgeClass = "bg-indigo-100 text-indigo-800 border-indigo-300 font-bold";
            } else if (order.status === "COMPLETED") {
              statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
            } else if (order.status === "CANCELLED") {
              statusBadgeClass = "bg-rose-100 text-rose-800 border-rose-300";
            }

            return (
              <Card
                key={order.id}
                className={`overflow-hidden border transition-all hover:shadow-md ${
                  order.status === "PENDING"
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Order Item Header */}
                <div className="p-3.5 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Origin Channel Badge */}
                    {isPOS ? (
                      <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] gap-1 py-0.5">
                        <Store className="w-3 h-3" />
                        KASIR POS OFFLINE
                      </Badge>
                    ) : order.channel === "WEBSTORE_INTERNAL" ? (
                      <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] gap-1 py-0.5">
                        <Globe className="w-3 h-3" />
                        WEBSTORE APOTIK
                      </Badge>
                    ) : order.channel === "KLIKDOKTER" ? (
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] gap-1 py-0.5">
                        <Pill className="w-3 h-3" />
                        KLIKDOKTER
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] gap-1 py-0.5">
                        <ShoppingBag className="w-3 h-3" />
                        MARKETPLACE
                      </Badge>
                    )}

                    {/* Order Number */}
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {order.orderNumber}
                    </span>

                    {/* Timestamp */}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(order.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Prescription Badge if applicable */}
                    {order.prescriptionNumber && (
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50 font-semibold">
                        Resep: {order.prescriptionNumber}
                      </Badge>
                    )}
                  </div>

                  {/* Status Badge & Total Amount Header */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] border font-bold ${statusBadgeClass}`}
                    >
                      {order.status === "PENDING"
                        ? "🟡 Menunggu Konfirmasi"
                        : order.status === "PROCESSING"
                        ? "🔵 Sedang Diproses"
                        : order.status === "SHIPPED"
                        ? "🟣 Dikirim / Siap Diambil"
                        : order.status === "COMPLETED"
                        ? "🟢 Selesai / Lunas"
                        : "🔴 Dibatalkan"}
                    </span>

                    <span className="text-base font-black font-mono text-emerald-700">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Order Details Body */}
                <CardContent className="p-3.5 space-y-3">
                  {/* Customer, Doctor, Notes Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pelanggan</span>
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {order.customerName}
                      </p>
                      {order.phone && order.phone !== "-" && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {order.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isPOS ? "Petugas Kasir" : "Opsi Pengiriman / Catatan"}
                      </span>
                      <p className="font-semibold text-slate-800">
                        {isPOS
                          ? order.cashierName || currentCashier
                          : order.shippingMethod || "Ambil di Apotek / Kurir"}
                      </p>
                      {order.doctorName && (
                        <p className="text-[11px] text-emerald-700">
                          Dokter: {order.doctorName}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-[11px] text-slate-500 italic truncate" title={order.notes}>
                          &quot;{order.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Metode Pembayaran</span>
                      <p className="font-semibold text-slate-800">
                        {order.paymentMethod}
                        {order.paymentNote && <span className="font-normal text-slate-500"> ({order.paymentNote})</span>}
                      </p>
                      {order.paymentProof && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProofOrder(order);
                            setIsProofModalOpen(true);
                          }}
                          className="mt-1 text-[11px] text-sky-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Lihat Bukti Transfer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100/80 text-slate-600 font-bold border-b text-left">
                        <tr>
                          <th className="py-1.5 px-3">Nama Produk / Obat</th>
                          <th className="py-1.5 px-3 text-center">Qty</th>
                          <th className="py-1.5 px-3 text-right">Harga Satuan</th>
                          <th className="py-1.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3 text-slate-800">
                              <span className="font-semibold">{item.productName}</span>
                              {item.batchNumber && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Batch: {item.batchNumber}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-center text-slate-600">
                              {item.qty} {item.unitName || "pcs"}
                            </td>
                            <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                              {formatRupiah(item.price)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-800 font-mono">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    {/* LEFT ACTIONS: PRINT & DETAIL */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* CETAK ULANG STRUK POS / INVOICE */}
                      <Button
                        size="sm"
                        onClick={() => handlePrintThermal(order, "58mm")}
                        className="h-8 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white gap-1.5 shadow-xs"
                        title="Cetak ulang struk thermal 58mm langsung ke printer kasir"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cetak Ulang Struk (58mm)</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReprintModal(order)}
                        className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                        title="Buka pratinjau invoice lengkap, format 80mm, atau kirim WhatsApp"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Detail & Invoice Lengkap</span>
                      </Button>

                      {order.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareWhatsApp(order)}
                          className="h-8 text-xs font-semibold border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kirim WA</span>
                        </Button>
                      )}
                    </div>

                    {/* RIGHT ACTIONS: ONLINE ORDER STATUS UPDATE & LOAD TO POS */}
                    {!isPOS ? (
                      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                        {/* UPDATE STATUS BUTTONS */}
                        {order.status === "PENDING" && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOnlineStatus(order, "PROCESSING")}
                            className="h-8 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terima & Proses</span>
                          </Button>
                        )}

                        {order.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOnlineStatus(order, "SHIPPED")}
                            className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Siap Diambil / Kirim</span>
                          </Button>
                        )}

                        {order.status === "SHIPPED" && (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateOnlineStatus(order, "COMPLETED")}
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tandai Selesai</span>
                          </Button>
                        )}

                        {/* Status dropdown for manual overrides */}
                        <div className="flex items-center gap-1">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateOnlineStatus(order, e.target.value)}
                            className="h-8 text-[11px] rounded-lg border border-slate-300 bg-white px-2 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Ubah status pesanan online"
                          >
                            <option value="PENDING">Status: PENDING</option>
                            <option value="PROCESSING">Status: PROCESSING</option>
                            <option value="SHIPPED">Status: SHIPPED</option>
                            <option value="COMPLETED">Status: COMPLETED</option>
                            <option value="CANCELLED">Status: CANCELLED (Batal)</option>
                          </select>
                        </div>

                        {/* LOAD INTO POS REGISTER BUTTON */}
                        {onLoadOrderToPOS && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLoadOrderToPOS(order)}
                            className="h-8 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-1"
                            title="Masukkan produk pesanan ini ke register kasir POS untuk dibayar/dihitung ulang"
                          >
                            <Store className="w-3 h-3 text-emerald-600" />
                            <span>Muat ke Kasir POS</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono italic">
                        Transaksi Kasir Offline Lunas
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL CETAK ULANG & PREVIEW INVOICE DIGITAL */}
      {selectedSaleForReprint && (
        <Dialog open={isReprintModalOpen} onOpenChange={setIsReprintModalOpen}>
          <DialogContent onClose={() => setIsReprintModalOpen(false)} className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <DialogTitle className="text-base font-bold text-slate-800">
                  Cetak Ulang Invoice / Struk Transaksi
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Pratinjau digital struk {selectedSaleForReprint.orderNumber} yang dapat dicetak ulang via thermal printer atau dikirim WhatsApp.
              </DialogDescription>
            </DialogHeader>

            {/* DIGITAL RECEIPT PREVIEW (Alfamart / Pharmacy Monospace Style) */}
            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl font-mono text-xs space-y-2 text-slate-800 max-h-[60vh] overflow-y-auto">
              {/* Header Apotek */}
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <p className="font-bold text-sm tracking-wide">{businessName}</p>
                <p className="text-[11px] text-slate-500">{businessAddress}</p>
                <p className="text-[11px] text-slate-500">Telp: {businessPhone}</p>
                <p className="text-[10px] text-slate-400">SIPA: 19850412/SIPA-32.73/2022</p>
              </div>

              {/* Info Transaksi */}
              <div className="text-[11px] space-y-1 py-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">{selectedSaleForReprint.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedSaleForReprint.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir / Petugas:</span>
                  <span>{selectedSaleForReprint.cashierName || currentCashier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{selectedSaleForReprint.customerName}</span>
                </div>
                {selectedSaleForReprint.doctorName && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Dokter:</span>
                    <span>{selectedSaleForReprint.doctorName}</span>
                  </div>
                )}
                {selectedSaleForReprint.prescriptionNumber && (
                  <div className="flex justify-between text-emerald-700">
                    <span>No. Resep:</span>
                    <span>{selectedSaleForReprint.prescriptionNumber}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                {selectedSaleForReprint.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>{it.productName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {it.qty} {it.unitName || "pcs"} &times; {formatRupiah(it.price)}
                      </span>
                      <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="text-[11px] space-y-1 py-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedSaleForReprint.subtotal)}</span>
                </div>

                {(selectedSaleForReprint.compoundingFee || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Jasa Racik:</span>
                    <span>{formatRupiah(selectedSaleForReprint.compoundingFee!)}</span>
                  </div>
                )}

                {(selectedSaleForReprint.embalaseFee || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Embalase/Pot:</span>
                    <span>{formatRupiah(selectedSaleForReprint.embalaseFee!)}</span>
                  </div>
                )}

                {(selectedSaleForReprint.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon Member:</span>
                    <span>-{formatRupiah(selectedSaleForReprint.discountAmount!)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(selectedSaleForReprint.totalAmount)}</span>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span>Metode Bayar:</span>
                  <span className="font-bold">{selectedSaleForReprint.paymentMethod}</span>
                </div>

                {selectedSaleForReprint.cashGiven !== undefined && selectedSaleForReprint.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span>Uang Diterima:</span>
                      <span>{formatRupiah(selectedSaleForReprint.cashGiven)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-emerald-800">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(selectedSaleForReprint.change || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                <p className="font-semibold text-slate-700">Semoga Lekas Sembuh</p>
                <p>Terima Kasih atas Kunjungan Anda</p>
                <p className="text-[9px] text-slate-400 mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
              </div>
            </div>

            {/* Paper Width Selection */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Format Ukuran Kertas:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setThermalWidth("58mm")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    thermalWidth === "58mm" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
                  }`}
                >
                  58mm (Kecil)
                </button>
                <button
                  type="button"
                  onClick={() => setThermalWidth("80mm")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    thermalWidth === "80mm" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
                  }`}
                >
                  80mm (Besar)
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReprintModalOpen(false)}
                className="text-xs"
              >
                Tutup
              </Button>

              {selectedSaleForReprint.phone && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareWhatsApp(selectedSaleForReprint)}
                  className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-1"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  Kirim WA
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={() => handlePrintThermal(selectedSaleForReprint, thermalWidth)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk Thermal ({thermalWidth})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL BUKTI TRANSFER PEMBAYARAN ONLINE */}
      {selectedProofOrder && (
        <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
          <DialogContent onClose={() => setIsProofModalOpen(false)} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Bukti Pembayaran Pelanggan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pesanan {selectedProofOrder.orderNumber} &bull; {selectedProofOrder.customerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {selectedProofOrder.paymentProof ? (
                <div className="rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProofOrder.paymentProof}
                    alt="Bukti Transfer"
                    className="max-h-80 w-auto rounded object-contain shadow-xs"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-400 text-xs">
                  Pelanggan belum mengunggah foto bukti transfer.
                </div>
              )}

              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border text-slate-600 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(selectedProofOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span>{selectedProofOrder.paymentMethod}</span>
                </div>
                {selectedProofOrder.paymentProofUploadedAt && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Diunggah pada:</span>
                    <span>{new Date(selectedProofOrder.paymentProofUploadedAt).toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProofModalOpen(false)}
                className="text-xs"
              >
                Tutup
              </Button>

              {selectedProofOrder.status === "PENDING" && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleUpdateOnlineStatus(selectedProofOrder, "PROCESSING");
                    setIsProofModalOpen(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Konfirmasi Lunas & Proses
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
