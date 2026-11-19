"use client";

/**
 * components/ai-pharmacist/ai-pharmacist-widget.tsx
 * Floating Widget — Asisten Apoteker Pintar (Gemini AI)
 *
 * Fitur:
 * - Floating action button di pojok kanan bawah
 * - Drawer/panel chat yang slide-in dari kanan
 * - Input keluhan bebas teks
 * - Kartu produk rekomendasi dengan badge golongan obat
 * - Tombol "Masukkan ke Keranjang POS" langsung memanggil callback
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Package,
  Info,
  ShieldAlert,
  Pill,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusinessStore } from "@/lib/business-store";
import {
  DRUG_CLASS_CONFIG,
  type AiPharmacistResponse,
  type AiRecommendedProduct,
  type DrugClass,
} from "@/lib/ai-pharmacist";
import { formatRupiah } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiPharmacistWidgetProps {
  /**
   * Callback dipanggil saat user klik "Masukkan ke Keranjang POS"
   * Product ID, nama, harga, unit dikirim ke POS
   */
  onAddToCart?: (product: {
    productId: string;
    name: string;
    price: number;
    baseUnit: string;
  }) => void;
  /** Halaman: "pos" | "dashboard" — atur posisi & gaya */
  page?: "pos" | "dashboard";
}

// ─── Drug Class Badge ─────────────────────────────────────────────────────────

function DrugClassBadge({ drugClass }: { drugClass: DrugClass }) {
  const cfg = DRUG_CLASS_CONFIG[drugClass] ?? DRUG_CLASS_CONFIG.BEBAS;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Prescription Warning ─────────────────────────────────────────────────────

function PrescriptionWarning() {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-1">
      <ShieldAlert className="text-red-600 mt-0.5 flex-shrink-0" size={14} />
      <p className="text-xs text-red-700 font-medium">
        Obat Keras — Penyerahan wajib dengan Resep Dokter atau persetujuan Apoteker.
      </p>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function RecommendedProductCard({
  product,
  onAddToCart,
}: {
  product: AiRecommendedProduct;
  onAddToCart?: AiPharmacistWidgetProps["onAddToCart"];
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!onAddToCart) return;
    onAddToCart({
      productId: product.productId,
      name: product.name,
      price: product.price,
      baseUnit: product.baseUnit,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{product.name}</p>
        </div>
        <DrugClassBadge drugClass={product.drugClass} />
      </div>

      {/* Harga & Stok */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <span className="font-bold text-emerald-700 text-sm">{formatRupiah(product.price)}</span>
        <span className="flex items-center gap-1">
          <Package size={11} />
          Stok: <span className="font-medium text-slate-700">{product.stock} {product.baseUnit}</span>
        </span>
      </div>

      {/* Dosis */}
      {product.dosageNote && (
        <div className="flex items-start gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5 mb-2">
          <Pill size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 leading-snug">{product.dosageNote}</p>
        </div>
      )}

      {/* Resep warning */}
      {product.requiresPrescription && <PrescriptionWarning />}

      {/* Action */}
      {onAddToCart && (
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className={`w-full mt-2 text-xs h-8 transition-all ${
            added
              ? "bg-green-500 hover:bg-green-500 text-white"
              : product.stock <= 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {added ? (
            <>
              <CheckCircle2 size={13} className="mr-1" />
              Ditambahkan!
            </>
          ) : product.stock <= 0 ? (
            "Stok Habis"
          ) : (
            <>
              <ShoppingCart size={13} className="mr-1" />
              Masukkan ke Keranjang POS
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function AiPharmacistWidget({
  onAddToCart,
  page = "pos",
}: AiPharmacistWidgetProps) {
  const { activeBusiness } = useBusinessStore();
  const [isOpen, setIsOpen] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiPharmacistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus input saat drawer terbuka
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const businessSlug = activeBusiness?.slug || "apotik-tamansari";

  // Hanya tampilkan untuk PHARMACY
  const isPharmacy =
    activeBusiness?.type === "PHARMACY" ||
    businessSlug.includes("apotik") ||
    businessSlug.includes("apotek");

  if (!isPharmacy) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!complaint.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setError(null);
    setNeedsApiKey(false);

    try {
      const res = await fetch(`/api/b/${businessSlug}/ai-pharmacist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: complaint.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Gagal menghubungi Asisten AI.");
        if (data.needsApiKey) setNeedsApiKey(true);
        return;
      }

      setResult(data.data as AiPharmacistResponse);
    } catch (err) {
      setError("Koneksi gagal. Periksa koneksi internet dan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setComplaint("");
    setResult(null);
    setError(null);
    setNeedsApiKey(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-100 ${
          page === "pos" ? "bottom-6 right-6" : "bottom-8 right-8"
        } bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700`}
        title="Tanya Asisten Obat AI"
      >
        <Bot size={18} className="flex-shrink-0" />
        <span className="hidden sm:block">Tanya Asisten Obat</span>
        {/* Pulse indicator */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* ── Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Drawer Panel ── */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Asisten Apoteker Pintar</p>
              <p className="text-xs text-emerald-100">Powered by Google Gemini AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Panduan */}
          {!result && !isLoading && !error && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Stethoscope size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Cara Penggunaan</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Ketik keluhan atau gejala pasien, misalnya:{" "}
                    <span className="italic font-medium">
                      "demam dan sakit kepala"
                    </span>{" "}
                    atau{" "}
                    <span className="italic font-medium">
                      "batuk berdahak dan pilek"
                    </span>
                    . AI akan merekomendasikan obat dari stok Apotik Tamansari.
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">Tekan Ctrl+Enter untuk kirim</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800 mb-1">Terjadi Kesalahan</p>
                  <p className="text-xs text-red-700">{error}</p>
                  {needsApiKey && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <KeyRound size={12} className="text-amber-600" />
                        <p className="text-xs font-semibold text-amber-800">Setup API Key</p>
                      </div>
                      <p className="text-xs text-amber-700">
                        1. Buka{" "}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          aistudio.google.com
                        </a>
                        {" "}→ buat API key<br />
                        2. Paste di file <code className="bg-amber-100 px-1 rounded">.env</code>:<br />
                        <code className="bg-amber-100 px-1 rounded text-xs">GEMINI_API_KEY=&quot;AI...&quot;</code><br />
                        3. Restart server: <code className="bg-amber-100 px-1 rounded">npm run dev</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="mt-2 w-full text-xs h-7 border-red-200 text-red-700 hover:bg-red-50"
              >
                <RefreshCw size={12} className="mr-1" />
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="relative">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <Bot size={14} className="absolute inset-0 m-auto text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Menganalisis Keluhan...</p>
                <p className="text-xs text-slate-400 mt-1">Gemini AI sedang mencari rekomendasi obat</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div className="space-y-3">
              {/* Medical Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info size={13} className="text-blue-600" />
                  <p className="text-xs font-semibold text-blue-800">Analisis Medis</p>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">{result.medicalNote}</p>
              </div>

              {/* Contraindications */}
              {result.contraindications && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <p className="text-xs font-semibold text-amber-800">Perlu Ditanyakan ke Pasien</p>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">{result.contraindications}</p>
                </div>
              )}

              {/* Overall prescription warning */}
              {result.requiresPrescriptionOverall && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-start gap-2">
                  <ShieldAlert size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-800">
                    ⚠️ Satu atau lebih obat di bawah ini termasuk OBAT KERAS — Wajib ada Resep Dokter atau persetujuan Apoteker sebelum penyerahan!
                  </p>
                </div>
              )}

              {/* Recommended Products */}
              {result.recommendedProducts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Pill size={12} />
                    Rekomendasi Obat ({result.recommendedProducts.length} produk)
                  </p>
                  {result.recommendedProducts.map((product, idx) => (
                    <RecommendedProductCard
                      key={`${product.productId}-${idx}`}
                      product={product}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Tidak ada produk yang cocok di stok saat ini.</p>
                </div>
              )}

              {/* Disclaimer */}
              {result.disclaimer && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500 italic leading-relaxed">⚕️ {result.disclaimer}</p>
                </div>
              )}

              {/* Reset button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full text-xs h-8 mt-1"
              >
                <RefreshCw size={12} className="mr-1" />
                Tanya Keluhan Lain
              </Button>
            </div>
          )}
        </div>

        {/* Input Area — always visible at bottom */}
        {!result && (
          <div className="border-t border-slate-200 p-3 flex-shrink-0 bg-white">
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                ref={textareaRef}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Contoh: pasien demam 38°C, sakit kepala, dan hidung tersumbat..."
                rows={3}
                disabled={isLoading}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 placeholder:text-slate-400"
              />
              <Button
                type="submit"
                disabled={!complaint.trim() || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9 rounded-xl font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" />
                    Cari Rekomendasi Obat
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
