"use client";

/**
 * components/ai-pharmacist/ai-pharmacist-widget.tsx
 * Floating Popup Window Chat — Asisten Apoteker Pintar (Google Gemini AI)
 *
 * Fitur:
 * - Tampilan popup window mengambang (non-intrusive, tidak menutup layar POS)
 * - Bebas dari backdrop gelap, kasir tetap leluasa scan barcode & transaksi
 * - Chat percakapan kasual interaktif dengan riwayat obrolan (multi-turn)
 * - Quick suggestion chips (Demam, Batuk, Maag, Alergi, Nyeri)
 * - Kartu obat elegan dengan sisa stok, harga, badge golongan, dan aturan pakai jelas
 * - Tombol "Masukkan ke Keranjang POS" langsung menambahkan item ke transaksi aktif
 * - Tombol minimize / maximize / close / bersihkan riwayat
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
  Package,
  ShieldAlert,
  Pill,
  RotateCcw,
  Minus,
  Maximize2,
  Sparkles,
  Info,
  KeyRound,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusinessStore } from "@/lib/business-store";
import {
  DRUG_CLASS_CONFIG,
  type AiPharmacistResponse,
  type AiRecommendedProduct,
  type DrugClass,
  type ChatMessage,
} from "@/lib/ai-pharmacist";
import { formatRupiah } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiPharmacistWidgetProps {
  onAddToCart?: (product: {
    productId: string;
    name: string;
    price: number;
    baseUnit: string;
  }) => void;
  page?: "pos" | "dashboard";
}

// ─── Quick Suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  { label: "Demam & Flu", query: "Pasien dewasa demam tinggi dan hidung tersumbat flu" },
  { label: "Batuk Berdahak", query: "Batuk berdahak dan tenggorokan gatal" },
  { label: "Sakit Kepala / Nyeri", query: "Sakit kepala berdenyut dan nyeri otot" },
  { label: "Maag & Asam Lambung", query: "Perut perih melilit mual maag kembung" },
  { label: "Alergi & Gatal", query: "Gatal-gatal bentol alergi biduran" },
];

// ─── Drug Class Badge ─────────────────────────────────────────────────────────

function DrugClassBadge({ drugClass }: { drugClass: DrugClass }) {
  const cfg = DRUG_CLASS_CONFIG[drugClass] ?? DRUG_CLASS_CONFIG.BEBAS;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-2xs shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Recommended Product Card ─────────────────────────────────────────────────

function RecommendedProductCard({
  product,
  onAddToCart,
}: {
  product: AiRecommendedProduct;
  onAddToCart?: AiPharmacistWidgetProps["onAddToCart"];
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!onAddToCart || product.stock <= 0) return;
    onAddToCart({
      productId: product.productId,
      name: product.name,
      price: product.price,
      baseUnit: product.baseUnit,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="border border-slate-200/90 rounded-xl p-2.5 bg-white shadow-xs hover:border-emerald-300 transition-all">
      {/* Baris Atas: Nama & Badge Golongan */}
      <div className="flex items-start justify-between gap-1.5 mb-1">
        <p className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
          {product.name}
        </p>
        <DrugClassBadge drugClass={product.drugClass} />
      </div>

      {/* Baris Harga & Stok */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">
          {formatRupiah(product.price)}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
          <Package size={11} className="text-slate-400" />
          Stok: <b className="text-slate-700">{product.stock} {product.baseUnit}</b>
        </span>
      </div>

      {/* Aturan Pakai & Dosis — Highlighted */}
      {product.dosageNote && (
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1.5 mb-2">
          <div className="flex items-start gap-1.5">
            <Pill size={12} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Aturan Pakai:
              </p>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                {product.dosageNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Peringatan Resep Obat Keras */}
      {product.requiresPrescription && (
        <div className="flex items-start gap-1.5 bg-rose-50 border border-rose-200/80 rounded-lg p-2 mb-2">
          <ShieldAlert className="text-rose-600 mt-0.5 shrink-0" size={13} />
          <p className="text-[11px] text-rose-800 font-medium leading-tight">
            Wajib Resep Dokter atau persetujuan Apoteker!
          </p>
        </div>
      )}

      {/* Tombol Add to Cart POS */}
      {onAddToCart && (
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className={`w-full text-xs h-7.5 font-bold transition-all ${
            added
              ? "bg-green-600 hover:bg-green-600 text-white shadow-xs"
              : product.stock <= 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow"
          }`}
        >
          {added ? (
            <>
              <CheckCircle2 size={13} className="mr-1 text-white animate-scale-in" />
              Masuk Keranjang!
            </>
          ) : product.stock <= 0 ? (
            "Stok Habis"
          ) : (
            <>
              <ShoppingCart size={13} className="mr-1.5" />
              + Masukkan ke Keranjang POS
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Format Jam Helper ────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiPharmacistWidget({
  onAddToCart,
  page = "pos",
}: AiPharmacistWidgetProps) {
  const { activeBusiness } = useBusinessStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const businessSlug = activeBusiness?.slug || "apotik-tamansari";
  const isPharmacy =
    activeBusiness?.type === "PHARMACY" ||
    businessSlug.includes("apotik") ||
    businessSlug.includes("apotek");

  // Inisialisasi pesan sambutan di awal
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          sender: "assistant",
          text: "Halo! Saya Asisten Apoteker Pintar Apotik Tamansari 🌿💊.\n\nAda keluhan atau gejala pasien yang ingin Anda tanyakan? Ketik keluhannya di bawah atau pilih saran cepat, saya akan carikan obat yang tersedia di stok apotek beserta aturan pakainya!",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus textarea saat popup dibuka
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  if (!isPharmacy) return null;

  // Handler kirim pesan
  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery || inputText).trim();
    if (!query || isLoading) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);
    setNeedsApiKey(false);

    try {
      // Ambil 6 pesan terakhir untuk multi-turn context
      const chatHistoryPayload = updatedHistory
        .filter((m) => !m.isError && m.id !== "welcome-msg")
        .slice(-6)
        .map((m) => ({
          role: m.sender,
          content: m.text,
        }));

      const res = await fetch(`/api/b/${businessSlug}/ai-pharmacist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: query,
          history: chatHistoryPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.needsApiKey) setNeedsApiKey(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            text: data.message || "Maaf, terjadi gangguan saat menghubungi AI. Coba periksa koneksi atau API key.",
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
        return;
      }

      const aiResponse = data.data as AiPharmacistResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: "assistant",
          text: aiResponse.medicalNote || "Berikut rekomendasi obat yang sesuai:",
          timestamp: new Date().toISOString(),
          data: aiResponse,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Koneksi terputus. Pastikan server aktif dan coba beberapa saat lagi.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Bersihkan seluruh riwayat obrolan?")) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: "assistant",
          text: "Riwayat obrolan dibersihkan. Ada keluhan pasien baru yang ingin dibantu rekomendasinya?",
          timestamp: new Date().toISOString(),
        },
      ]);
      setNeedsApiKey(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* ── 1. FLOATING LAUNCHER BUTTON (Hanya jika popup tertutup) ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-xl text-white font-bold text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
            page === "pos" ? "bottom-4 right-4" : "bottom-6 right-6"
          } bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 border border-white/20`}
          title="Buka Chat Asisten Apoteker AI"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot size={15} className="text-white" />
          </div>
          <span className="tracking-wide">Tanya Asisten Obat</span>
          {/* Online green indicator */}
          <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full border border-white animate-pulse" />
        </button>
      )}

      {/* ── 2. MINIMIZED FLOATING BAR (Jika jendela diminimalkan) ── */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className={`fixed z-40 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl text-white font-bold text-xs cursor-pointer transition-all hover:scale-102 ${
            page === "pos" ? "bottom-4 right-4" : "bottom-6 right-6"
          } bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 border border-emerald-500/50 w-72`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div>
              <p className="leading-tight text-white font-bold">Asisten Apoteker AI</p>
              <p className="text-[10px] text-emerald-200 font-normal">Klik untuk membuka obrolan</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 size={14} className="text-emerald-200 hover:text-white" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 hover:bg-white/20 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. FLOATING POPUP CHAT WINDOW (Non-modal, tidak mengganggu POS) ── */}
      {isOpen && !isMinimized && (
        <div
          className={`fixed z-40 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            page === "pos" ? "bottom-4 right-4" : "bottom-6 right-6"
          } w-[420px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100vh-80px)]`}
          style={{ boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25)" }}
        >
          {/* Header Popup Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Bot size={17} className="text-emerald-100" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-800" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                    Asisten Apoteker Pintar
                  </p>
                  <span className="bg-emerald-500/30 text-emerald-200 text-[9px] px-1.5 py-0.2 rounded-full font-semibold border border-emerald-400/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/90 truncate leading-tight">
                  Apotik Tamansari • Database Stok Aktif
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
                title="Hapus riwayat obrolan"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
                title="Perkecil ke pojok bawah"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-emerald-100 hover:text-white transition-colors"
                title="Tutup jendela chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips Bar */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-500 px-1 shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-600" /> Saran:
            </span>
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s.query)}
                disabled={isLoading}
                className="text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2 py-0.5 rounded-full border border-slate-200 hover:border-emerald-300 transition-all shrink-0 active:scale-95 shadow-2xs"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages Chat Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-slate-50 to-white">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar AI */}
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mb-1 border border-emerald-200">
                      <Bot size={13} />
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div
                    className={`max-w-[88%] text-xs space-y-2 ${
                      isUser
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl rounded-br-xs px-3.5 py-2.5 shadow-xs"
                        : msg.isError
                        ? "bg-red-50 border border-red-200 text-red-800 rounded-2xl rounded-bl-xs p-3 shadow-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-xs p-3 shadow-xs"
                    }`}
                  >
                    {/* User Text */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    ) : (
                      <>
                        {/* Assistant Conversational Note */}
                        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                          {msg.text}
                        </div>

                        {/* Setup API Key Help jika diperlukan */}
                        {needsApiKey && msg.isError && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <KeyRound size={12} className="text-amber-700" />
                              Pengaturan Kunci API Gemini:
                            </p>
                            <p>
                              Tambahkan <code>GEMINI_API_KEY</code> di file <code>.env</code> atau pada tab
                              Environment Variables di Vercel Dashboard, lalu lakukan Redeploy.
                            </p>
                          </div>
                        )}

                        {/* Data Hasil Rekomendasi Farmasi */}
                        {msg.data && (
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            {/* Hal yang Perlu Ditanyakan ke Pasien */}
                            {msg.data.contraindications && (
                              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 leading-snug">
                                <span className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                  Perlu Ditanyakan ke Pasien:
                                </span>
                                {msg.data.contraindications}
                              </div>
                            )}

                            {/* Peringatan Obat Keras Keseluruhan */}
                            {msg.data.requiresPrescriptionOverall && (
                              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-900 font-semibold flex items-start gap-1.5">
                                <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                                <span>
                                  Perhatian: Rekomendasi mengandung Obat Keras. Wajib dengan Resep Dokter / persetujuan Apoteker!
                                </span>
                              </div>
                            )}

                            {/* Daftar Kartu Obat */}
                            {msg.data.recommendedProducts && msg.data.recommendedProducts.length > 0 ? (
                              <div className="space-y-2 pt-1">
                                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <Pill size={12} className="text-emerald-600" />
                                  Obat Rekomendasi Apotik ({msg.data.recommendedProducts.length}):
                                </p>
                                {msg.data.recommendedProducts.map((p, idx) => (
                                  <RecommendedProductCard
                                    key={`${p.productId}-${idx}`}
                                    product={p}
                                    onAddToCart={onAddToCart}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-2 text-slate-500 text-[11px] italic">
                                Belum ada obat dengan stok mencukupi untuk keluhan ini di database apotek.
                              </div>
                            )}

                            {/* Disclaimer Edukasi */}
                            {msg.data.disclaimer && (
                              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 leading-tight">
                                ℹ️ {msg.data.disclaimer}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-[9px] flex items-center gap-1 pt-0.5 ${
                        isUser ? "text-emerald-100 justify-end" : "text-slate-400 justify-start"
                      }`}
                    >
                      <Clock size={9} />
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div className="flex items-end gap-1.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mb-1 border border-emerald-200">
                  <Bot size={13} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                  <span className="font-medium animate-pulse">
                    Menganalisis stok obat Apotik Tamansari...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis keluhan atau tanya obat... (Enter untuk kirim)"
                rows={1}
                disabled={isLoading}
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 placeholder:text-slate-400 max-h-20 leading-relaxed bg-slate-50/50 focus:bg-white transition-colors"
                style={{ minHeight: "36px" }}
              />

              <Button
                type="submit"
                size="sm"
                disabled={!inputText.trim() || isLoading}
                className="h-9 w-9 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 disabled:opacity-40 transition-all shadow-xs"
                title="Kirim pesan"
              >
                {isLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </Button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-1">
              <span>Shift+Enter untuk baris baru</span>
              <span className="text-emerald-700 font-medium">Auto-stok POS Apotik</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
