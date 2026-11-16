"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Pill,
  ShieldCheck,
  Clock,
  Truck,
  Sparkles,
  Phone,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Eye,
  Plus,
  Minus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Heart,
  Star,
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import {
  STORE_PRODUCTS,
  STORE_CATEGORIES,
  StoreProduct,
} from "@/lib/store-data";
import { formatRupiah } from "@/lib/utils";
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
} from "@/components/ui/dialog";

export default function StoreHomePage() {
  const { addToCart, cartCount, cartTotal } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProductForModal, setSelectedProductForModal] =
    useState<StoreProduct | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return STORE_PRODUCTS.filter((prod) => {
      // Category filter
      if (selectedCategory !== "ALL" && prod.categoryKey !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesGeneric = prod.genericName.toLowerCase().includes(q);
        const matchesCategory = prod.category.toLowerCase().includes(q);
        const matchesIndication = prod.indication.toLowerCase().includes(q);
        return matchesName || matchesGeneric || matchesCategory || matchesIndication;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = (prod: StoreProduct) => {
    addToCart(prod, 1);
    setJustAddedId(prod.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === prod.id ? null : curr));
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white relative overflow-hidden py-10 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-emerald-900/60 border border-emerald-400/30 text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Webstore Resmi Apotik Tamansari &bull; Siap Antar Hari Ini</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Apotek Online Terpercaya, <br className="hidden sm:inline" />
              <span className="text-emerald-300">Obat 100% Asli</span> dari PBF Resmi.
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-xl">
              Pesan obat bebas, vitamin, suplemen, dan tebus resep dokter dengan pengantaran cepat 1-2 jam langsung sampai di rumah Anda. Dibimbing oleh apoteker berizin (SIPA).
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <a
                href="https://wa.me/628122334455?text=Halo%20Apotik%20Tamansari,%20saya%20ingin%20konsultasi%20obat%20dan%20kirim%20foto%20resep"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs py-5 shadow-lg">
                  <Phone className="mr-2 h-4 w-4 text-emerald-600" />
                  Konsultasi / Kirim Resep (WA)
                </Button>
              </a>

              <Link href="/store/register">
                <Button
                  variant="outline"
                  className="border-emerald-400/50 bg-emerald-900/40 text-white hover:bg-emerald-800 text-xs py-5 font-semibold"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                  Daftar Member (Bonus 50 Poin)
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Value Pillars Card */}
          <div className="w-full md:w-auto shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-xs space-y-3 shadow-xl">
            <p className="font-bold text-emerald-200 uppercase tracking-wider text-[11px]">
              Keunggulan Layanan Apotek:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-white">
                  <Truck className="h-4 w-4 text-emerald-300" />
                </div>
                <span>Antar Cepat Instan (GoSend / Grab)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                </div>
                <span>Jaminan Produk BPOM & FIFO Terjamin</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-white">
                  <Clock className="h-4 w-4 text-emerald-300" />
                </div>
                <span>Buka Setiap Hari 07.00 - 22.00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Search Bar & Stats Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama obat, kandungan aktif (contoh: Paracetamol, Maag, Madu, Vitamin C)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500">
            <span>
              Menampilkan <b>{filteredProducts.length}</b> produk obat
            </span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs text-rose-600 h-8 px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STORE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Pill className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">Obat yang Anda cari tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Coba kata kunci lain atau hubungi apoteker kami langsung via WhatsApp untuk ketersediaan obat langka.
            </p>
            <a
              href="https://wa.me/628122334455?text=Halo%20Apotek%20Tamansari,%20saya%20mencari%20obat:%20"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block"
            >
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Phone className="mr-1.5 h-3.5 w-3.5" /> Tanya Apoteker di WhatsApp
              </Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const isAdded = justAddedId === prod.id;
              return (
                <div
                  key={prod.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top: Badges & Visual */}
                  <div>
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-1 mb-2">
                        {prod.prescriptionRequired ? (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1.5 font-bold">
                            Resep Dokter
                          </Badge>
                        ) : (
                          <Badge variant="cyan" className="text-[9px] py-0 px-1.5 font-bold">
                            Obat Bebas
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          Stok: {prod.stock}
                        </span>
                      </div>

                      {/* Icon Banner */}
                      <div className="h-28 rounded-xl bg-gradient-to-tr from-slate-50 to-emerald-50/60 border border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <Pill className="h-7 w-7 rotate-45" />
                        </div>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-amber-600 font-bold">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{prod.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-1 space-y-1">
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                        {prod.category}
                      </p>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono italic truncate">
                        {prod.genericName}
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                        {prod.indication}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Price & Add to Cart */}
                  <div className="p-4 pt-2 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block text-[10px]">
                          Harga Resmi / {prod.unit}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-800">
                          {formatRupiah(prod.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProductForModal(prod)}
                        className="text-[11px] text-slate-400 hover:text-emerald-700 flex items-center gap-0.5"
                      >
                        <Eye className="h-3 w-3" /> Info
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(prod)}
                        className={`flex-1 text-xs font-bold transition-all ${
                          isAdded
                            ? "bg-teal-600 hover:bg-teal-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Masuk Keranjang
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-1 h-3.5 w-3.5" /> + Keranjang
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={!!selectedProductForModal}
        onOpenChange={(open) => !open && setSelectedProductForModal(null)}
      >
        {selectedProductForModal && (
          <DialogContent
            onClose={() => setSelectedProductForModal(null)}
            className="max-w-lg"
          >
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    selectedProductForModal.prescriptionRequired ? "destructive" : "cyan"
                  }
                  className="text-[10px]"
                >
                  {selectedProductForModal.prescriptionRequired
                    ? "Wajib Resep Dokter"
                    : "Obat Bebas Terdaftar"}
                </Badge>
                <span className="text-[11px] text-slate-500 font-mono">
                  BPOM: {selectedProductForModal.bpom}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {selectedProductForModal.name}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-emerald-700 font-medium">
                Komposisi: {selectedProductForModal.genericName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">
                  Khasiat & Indikasi Medis:
                </span>
                <p className="leading-relaxed text-slate-600">
                  {selectedProductForModal.indication}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  Dosis & Aturan Minum:
                </span>
                <p className="leading-relaxed text-emerald-800">
                  {selectedProductForModal.dosage}
                </p>
              </div>

              {selectedProductForModal.sideEffects && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Perhatian / Efek Samping:</span>
                  <p className="leading-relaxed text-[11px]">
                    {selectedProductForModal.sideEffects}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Satuan: {selectedProductForModal.unit}
                  </span>
                  <span className="text-lg font-black text-emerald-800">
                    {formatRupiah(selectedProductForModal.price)}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    addToCart(selectedProductForModal, 1);
                    setSelectedProductForModal(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                >
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Tambahkan ke Keranjang
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Floating Bottom Cart Bar (appears when cart is not empty) */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-rose-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Total Keranjang ({cartCount} Item):
                </p>
                <p className="font-black text-sm sm:text-base text-emerald-400">
                  {formatRupiah(cartTotal)}
                </p>
              </div>
            </div>

            <Link href="/store/checkout">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md">
                Checkout Sekarang <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
