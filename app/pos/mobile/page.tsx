"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";
import {
  Camera,
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ChevronDown,
} from "lucide-react";
import { INITIAL_PRODUCTS, MockProduct, getUnitsForProduct, ResolvedProductUnit } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MobilePosPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const { user } = useAuth();
  const isDynamic = pathname?.startsWith("/b/");
  const isPharmacy = activeBusiness.type === "PHARMACY";
  const backHref = isDynamic ? `/b/${activeBusiness.slug}/dashboard` : "/";

  const [cart, setCart] = useState<{ product: MockProduct; qty: number; unitName: string; price: number }[]>([]);
  const [search, setSearch] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  // Filter products
  const filtered = INITIAL_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const addItem = (product: MockProduct, unitInput?: ResolvedProductUnit) => {
    const available = getUnitsForProduct(product);
    const selectedUnit = unitInput || available[0];
    const existing = cart.findIndex(
      (i) => i.product.id === product.id && i.unitName.toLowerCase() === selectedUnit.unitName.toLowerCase()
    );
    if (existing > -1) {
      const updated = [...cart];
      updated[existing].qty += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        { product, qty: 1, unitName: selectedUnit.unitName, price: selectedUnit.sellPrice },
      ]);
    }
  };

  const handleUnitChange = (index: number, newUnitName: string) => {
    const current = cart[index];
    if (!current || current.unitName.toLowerCase() === newUnitName.toLowerCase()) return;

    const availableUnits = getUnitsForProduct(current.product, current.unitName);
    const target =
      availableUnits.find((u) => u.unitName.toLowerCase() === newUnitName.toLowerCase()) ||
      availableUnits.find((u) => u.unitName === newUnitName);

    if (!target) return;

    const existingIndex = cart.findIndex(
      (it, idx) =>
        idx !== index &&
        it.product.id === current.product.id &&
        it.unitName.toLowerCase() === target.unitName.toLowerCase()
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += current.qty;
      setCart(updated.filter((_, idx) => idx !== index));
    } else {
      const updated = [...cart];
      updated[index] = {
        ...current,
        unitName: target.unitName,
        price: target.sellPrice,
      };
      setCart(updated);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      updated[index].qty = newQty;
      setCart(updated);
    }
  };

  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

  // Simulated barcode camera scan trigger
  const handleSimulateScan = (code: string) => {
    setScannedCode(code);
    const found = INITIAL_PRODUCTS.find((p) => p.barcode === code);
    if (found) {
      addItem(found);
      setIsCameraActive(false);
    } else {
      alert(`Barcode ${code} tidak terdaftar di sistem Apotik Tamansari.`);
    }
  };

  const handleMobileCheckout = async (paymentMethod: string) => {
    try {
      await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleNumber: `SL-MOB-${Date.now().toString().slice(-6)}`,
          businessId: activeBusiness?.id || "biz-apotik-tamansari",
          items: cart.map((it) => ({
            productId: it.product.id,
            name: it.product.name,
            unitName: it.unitName,
            qty: it.qty,
            sellPrice: it.price,
            selectedBatchNumber: it.product.batches?.[0]?.batchNumber,
          })),
          subtotal: total,
          totalAmount: total,
          paymentMethod,
          cashGiven: total,
          change: 0,
          userId: user?.id || "usr-mobile",
          cashier: user?.name || "Kasir HP",
          businessName: activeBusiness?.name || "Apotik Tamansari",
        }),
      });
    } catch {}
    setIsSuccessModal(true);
  };

  return (
    <div className="max-w-md mx-auto min-h-[90vh] flex flex-col justify-between pb-20">
      {/* Mobile Header */}
      <div className={`${isPharmacy ? "bg-emerald-700" : "bg-gradient-to-r from-amber-600 to-orange-600"} text-white p-4 rounded-b-2xl shadow-md sticky top-0 z-20`}>
        <div className="flex items-center justify-between mb-3">
          <Link href={backHref} className="p-1 rounded-full hover:bg-black/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="font-bold text-sm">POS Kasir Mobile</h1>
            <p className="text-[10px] text-white/90">
              Kasir: <b>{user?.name || "Kasir HP"}</b> &bull; {isPharmacy ? "Apotik" : "Toko Mainan"}
            </p>
          </div>
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-500 shadow-xs relative"
          >
            <Camera className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
          </button>
        </div>

        {/* Search Bar on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-200" />
          <Input
            placeholder="Scan barcode / ketik nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-emerald-800/80 border-emerald-600 text-white placeholder:text-emerald-300 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Simulated Live Camera Viewfinder Modal */}
      {isCameraActive && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl m-3 border border-emerald-500/50 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">Scanner Kamera Barcode Aktif</span>
            </div>
            <button onClick={() => setIsCameraActive(false)}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Viewfinder simulation box */}
          <div className="relative h-44 bg-black/80 rounded-xl border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-rose-500 animate-bounce shadow-glow" />
            <Barcode className="h-14 w-14 text-emerald-400 opacity-60 mb-1" />
            <p className="text-[11px] text-slate-300">Arahkan kamera HP ke barcode kemasan obat</p>
          </div>

          {/* Preset test barcode clicks */}
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 mb-1">Simulasi scan cepat barcode kemasan:</p>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_PRODUCTS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p.barcode)}
                  className="px-2 py-1 bg-slate-800 hover:bg-emerald-800 rounded text-[10px] border border-slate-700 text-emerald-300 font-mono"
                >
                  {p.barcode} ({p.name.split(" ")[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Body: Cart (if has items) or Fast Product Tiles */}
      <div className="p-3 space-y-4 flex-1">
        {cart.length > 0 && (
          <div className="bg-white rounded-xl border p-3 shadow-xs space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                Daftar Belanja ({cart.length} Item)
              </span>
              <button
                onClick={() => setCart([])}
                className="text-[10px] text-rose-600 font-medium"
              >
                Reset
              </button>
            </div>

            <div className="divide-y max-h-56 overflow-y-auto">
              {cart.map((item, idx) => {
                const availableUnits = getUnitsForProduct(item.product, item.unitName);
                return (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-slate-800 leading-tight">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {availableUnits.length > 1 ? (
                          <div className="relative inline-flex items-center">
                            <select
                              value={item.unitName}
                              onChange={(e) => handleUnitChange(idx, e.target.value)}
                              aria-label={`Ubah satuan ${item.product.name}`}
                              className="appearance-none bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded px-1.5 py-0.5 pr-4 focus:outline-none"
                            >
                              {availableUnits.map((u) => (
                                <option key={u.unitName} value={u.unitName}>
                                  {u.unitName} ({formatRupiah(u.sellPrice)})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-2.5 w-2.5 text-emerald-700 pointer-events-none absolute right-1" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {item.unitName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 font-medium">
                          {formatRupiah(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 active:bg-slate-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold active:bg-emerald-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Add Product List */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Sentuh Obat untuk Tambahkan
          </h2>
          <div className="space-y-2">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addItem(prod)}
                className="p-3 bg-white rounded-xl border border-slate-200 active:border-emerald-500 active:bg-emerald-50/40 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-800">{prod.name}</p>
                  <p className="text-[10px] text-slate-400">
                    Stok: {prod.totalStock} {prod.baseUnit} &bull; Barcode: {prod.barcode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs text-emerald-700">
                    {formatRupiah(prod.units[0].sellPrice)}
                  </p>
                  <span className="text-[10px] text-slate-400">/{prod.units[0].unitName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout Action */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto p-3 bg-white border-t shadow-2xl z-30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500">Total Pembayaran:</span>
            <span className="text-lg font-black text-emerald-700">{formatRupiah(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleMobileCheckout("CASH")}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-11 flex items-center justify-center gap-1 col-span-2"
            >
              <Banknote className="h-4 w-4" />
              Bayar Tunai Pas
            </Button>
            <Button
              onClick={() => handleMobileCheckout("QRIS")}
              variant="outline"
              className="border-emerald-600 text-emerald-700 font-bold text-xs h-11 flex items-center justify-center gap-1"
            >
              <QrCode className="h-4 w-4" />
              QRIS
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Success Modal */}
      {isSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Transaksi Selesai!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Total {formatRupiah(total)} telah diterima & stok FIFO otomatis terpotong.
              </p>
            </div>
            <Button
              onClick={() => {
                setCart([]);
                setIsSuccessModal(false);
              }}
              className="w-full bg-emerald-600 text-white font-bold"
            >
              Transaksi Baru (HP)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
