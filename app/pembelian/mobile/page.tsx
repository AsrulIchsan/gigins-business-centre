"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  Truck,
  Camera,
  ArrowLeft,
  Barcode,
  Save,
  CheckCircle,
  Plus,
  Calendar,
} from "lucide-react";
import { INITIAL_PRODUCTS, MOCK_SUPPLIERS } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MobilePembelianPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const isPharmacy = activeBusiness.type === "PHARMACY";
  const backHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/faktur` : "/pembelian/faktur";

  const [supplierId, setSupplierId] = useState(MOCK_SUPPLIERS[0].id);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("BCH-NEW-01");
  const [expiredDate, setExpiredDate] = useState("2028-06-30");
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[0].id);
  const [qty, setQty] = useState(10);
  const [buyPrice, setBuyPrice] = useState(38000);
  const [isSuccess, setIsSuccess] = useState(false);

  const product = INITIAL_PRODUCTS.find((p) => p.id === selectedProductId) || INITIAL_PRODUCTS[0];
  const total = qty * buyPrice;

  const handleSave = () => {
    if (!invoiceNumber) {
      alert("Masukkan nomor faktur fisik!");
      return;
    }
    setIsSuccess(true);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Mobile Header */}
      <div className={`${isPharmacy ? "bg-emerald-700" : "bg-gradient-to-r from-amber-600 to-orange-600"} text-white p-4 rounded-b-2xl shadow-md sticky top-0 z-20`}>
        <div className="flex items-center justify-between">
          <Link href={backHref} className="p-1 rounded-full hover:bg-black/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="font-bold text-sm">Penerimaan Faktur HP</h1>
            <p className="text-[10px] text-white/80">
              {isPharmacy ? "Input Barang Datang Kurir PBF via HP" : "Input Penerimaan Barang Masuk via HP"}
            </p>
          </div>
          <div className="w-6" />
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Step 1: Supplier & Invoice Number */}
        <div className="bg-white p-4 rounded-xl border space-y-3">
          <span className="text-xs font-bold text-slate-800 block">1. Info Faktur Distributor</span>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold block mb-1">
              Pilih PBF Pengirim:
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border bg-slate-50 font-medium"
            >
              {MOCK_SUPPLIERS.filter((s) => !s.isConsignment).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold block mb-1">
              Nomor Faktur Fisik:
            </label>
            <Input
              placeholder="Contoh: FAK-KF-202611"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-10 text-xs font-bold"
            />
          </div>
        </div>

        {/* Step 2: Unpacking Barang Datang & Batch */}
        <div className="bg-white p-4 rounded-xl border space-y-3">
          <span className="text-xs font-bold text-slate-800 block">
            2. Scan & Input Batch Kemasan Baru
          </span>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold block mb-1">
              Pilih Obat yang Diterima:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border bg-slate-50 font-medium"
            >
              {INITIAL_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                Nomor Batch Kemasan:
              </label>
              <Input
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                Expired Date:
              </label>
              <Input
                type="date"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                Qty Diterima ({product.units[0].unitName}):
              </label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="h-9 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                Harga Beli Satuan (Rp):
              </label>
              <Input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t flex justify-between items-center text-xs font-bold">
            <span>Subtotal Item Ini:</span>
            <span className="text-emerald-700 text-sm">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm shadow-md"
        >
          <Save className="mr-2 h-4 w-4" />
          Simpan Faktur & Update Stok Batch
        </Button>
      </div>

      {/* Success Dialog */}
      {isSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Faktur Berhasil Disimpan!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Stok batch {batchNumber} ({product.name}) telah masuk ke inventori FIFO apotek.
              </p>
            </div>
            <Button
              onClick={() => {
                setIsSuccess(false);
                setInvoiceNumber("");
              }}
              className="w-full bg-emerald-600 text-white font-bold"
            >
              Input Faktur Lainnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
