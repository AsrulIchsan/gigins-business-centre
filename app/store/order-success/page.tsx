"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
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
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  PackageCheck,
  AlertCircle,
  MapPin,
  FileText,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "ORD-WEB-20261116-001";
  const initialTotal = Number(searchParams.get("total") || "21000");
  const initialName = searchParams.get("name") || "Pelanggan Terhormat";
  const initialPhone = searchParams.get("phone") || "-";
  const initialMethod = searchParams.get("method") || "QRIS";

  // Realtime order state synced with cashier
  const [order, setOrder] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("PENDING");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Payment proof upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState("");

  // Fetch live order status from server
  const fetchOrderStatus = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/online-orders?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setCurrentStatus(data.order.status || "PENDING");
        if (data.order.paymentProof) {
          setProofPreview(data.order.paymentProof);
        }
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn("Gagal polling status pesanan:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Poll every 3.5 seconds so customer sees live status change as cashier clicks
  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 3500);

    return () => clearInterval(interval);
  }, [orderNumber]);

  // Handle proof file selection
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih berkas foto / gambar bukti transfer (JPG, PNG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProofPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Upload proof to cashier API
  const handleUploadProof = async () => {
    if (!proofPreview) return;
    setIsUploadingProof(true);
    setProofSuccessMsg("");
    try {
      const res = await fetch("/api/online-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          paymentProof: proofPreview,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProofSuccessMsg("Bukti pembayaran berhasil dikirim! Kasir sedang memverifikasi.");
        fetchOrderStatus();
      } else {
        alert(data.message || "Gagal mengunggah bukti bayar.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const displayName = order?.customerName || initialName;
  const displayTotal = order?.totalAmount || initialTotal;
  const displayPhone = order?.phone || initialPhone;
  const displayMethod = order?.paymentMethod || initialMethod;

  // Status mapping
  const statusSteps = [
    { key: "PENDING", label: "Pending", desc: "Menunggu Konfirmasi Apotek", icon: Clock },
    { key: "PROCESSING", label: "Proses", desc: "Obat Diracik & Disiapkan FIFO", icon: Pill },
    { key: "SHIPPED", label: "Kirim / Siap Diambil", desc: "Sedang Diantar / Siap di Konter", icon: Truck },
    { key: "COMPLETED", label: "Selesai", desc: "Pesanan Telah Diterima", icon: CheckCircle },
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

  const currentStepIdx = getStepIndex(currentStatus);

  const waMessage = encodeURIComponent(
    `Halo Apotik Tamansari, saya telah membuat pesanan obat di Webstore dengan No. Pesanan ${orderNumber} atas nama ${displayName} total ${formatRupiah(
      displayTotal
    )}. Status saat ini: ${currentStatus}. Mohon info pengirimannya ya.`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <Card className="border-emerald-200 bg-white shadow-xl rounded-3xl overflow-hidden text-center">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-6 sm:p-8 text-white relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <Badge variant="cyan" className="mb-2 text-xs uppercase font-bold">
            Pesanan Berhasil Masuk
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Terima Kasih, {displayName}!
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
            Nomor Pesanan: <b className="font-mono bg-emerald-950/40 px-2 py-0.5 rounded text-white">{orderNumber}</b>
          </p>
        </div>

        <CardContent className="p-5 sm:p-8 space-y-6 text-xs text-left">
          {/* REALTIME STATUS TRACKER (OTOMATIS BERUBAH) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Status Pesanan Realtime:
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
                <span className="hidden sm:inline">Sinkron otomatis dengan kasir</span>
              </div>
            </div>

            {/* Stepper Display */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 font-bold ${
                        isCurrent
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100 scale-105"
                          : isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <p
                      className={`text-[11px] font-bold mt-1.5 leading-tight ${
                        isCurrent
                          ? "text-emerald-800"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[9px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current Status Highlight Banner */}
            <div className="p-3 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Status Saat Ini:</span>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-800">
                  {statusSteps[currentStepIdx]?.label}
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {statusSteps[currentStepIdx]?.desc}
                </p>
              </div>
              <Badge
                variant={
                  currentStatus === "COMPLETED"
                    ? "success"
                    : currentStatus === "SHIPPED"
                    ? "purple"
                    : currentStatus === "PROCESSING"
                    ? "cyan"
                    : "warning"
                }
                className="text-[10px] uppercase font-bold"
              >
                {currentStatus}
              </Badge>
            </div>
          </div>

          {/* UPLOAD BUKTI PEMBAYARAN OLEH CUSTOMER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-600" />
                Upload Bukti Pembayaran (Transfer / QRIS)
              </span>
              <span className="text-[10px] text-slate-400">Struk / Screenshot</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Unggah foto struk transfer atau bukti scan QRIS Anda agar apoteker dapat segera meracik dan mengirimkan pesanan.
            </p>

            {proofSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{proofSuccessMsg}</span>
              </div>
            )}

            {proofPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-center max-w-xs mx-auto">
                  <img
                    src={proofPreview}
                    alt="Bukti Bayar"
                    className="max-h-48 mx-auto rounded-lg object-contain shadow-xs"
                  />
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Bukti Bayar Terlampir</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 text-xs"
                  >
                    Ganti Foto
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUploadingProof}
                    onClick={handleUploadProof}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    {isUploadingProof ? "Mengirim..." : "Kirimkan ke Kasir Apotek"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors flex flex-col items-center justify-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-emerald-900 block">
                      Klik untuk Pilih / Foto Bukti Transfer
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Mendukung format JPG, PNG, atau Screenshot M-Banking
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Rincian Pesanan Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Total Tagihan Obat:</span>
              <span className="font-black text-sm sm:text-base text-emerald-800">
                {formatRupiah(displayTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Metode Pembayaran:</span>
              <span className="font-bold text-slate-800 uppercase">{displayMethod}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">No. WhatsApp Pemesan:</span>
              <span className="font-mono font-semibold text-slate-800">{displayPhone}</span>
            </div>
            {order?.shippingMethod && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Pilihan Pengantaran:</span>
                <span className="font-semibold text-slate-800">{order.shippingMethod}</span>
              </div>
            )}
          </div>

          {/* Action Buttons (Clean & No Leaks) */}
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
              <Link href="/store/orders" className="flex-1">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-5">
                  Daftar Pesanan Saya &rarr;
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
