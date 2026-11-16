"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  Boxes,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Barcode,
  Save,
  Check,
  RefreshCw,
} from "lucide-react";
import { INITIAL_PRODUCTS, MockProduct } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InventoryNavTabs } from "@/components/inventory/inventory-nav-tabs";

interface OpnameEntry {
  productId: string;
  name: string;
  batchNumber: string;
  expiredDate: string;
  systemQty: number;
  physicalQty: number;
  difference: number;
  unit: string;
  notes: string;
}

export default function StokOpnameMobilePage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const backHref = isDynamic ? `/b/${activeBusiness.slug}/dashboard` : "/";

  const [opnameList, setOpnameList] = useState<OpnameEntry[]>(
    INITIAL_PRODUCTS.map((p) => {
      const batch = p.batches[0];
      return {
        productId: p.id,
        name: p.name,
        batchNumber: batch ? batch.batchNumber : "GEN-01",
        expiredDate: batch ? batch.expiredDate : "2027-12-31",
        systemQty: p.totalStock,
        physicalQty: p.totalStock, // default matches
        difference: 0,
        unit: p.baseUnit,
        notes: "",
      };
    })
  );

  const [search, setSearch] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updatePhysicalQty = (index: number, val: number) => {
    const updated = [...opnameList];
    updated[index].physicalQty = val;
    updated[index].difference = val - updated[index].systemQty;
    setOpnameList(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...opnameList];
    updated[index].notes = notes;
    setOpnameList(updated);
  };

  const filtered = opnameList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Summary
  const totalItems = opnameList.length;
  const matchCount = opnameList.filter((i) => i.difference === 0).length;
  const mismatchCount = opnameList.filter((i) => i.difference !== 0).length;

  const handleSubmit = () => {
    setSubmitted(true);

    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType: "ACTIVITY",
        module: "STOCK",
        action: "UPDATE",
        entityId: `OPN-${Date.now().toString().slice(-6)}`,
        entityName: "Stok Opname Fisik",
        description: `Penyelesaian Stok Opname Fisik Apotek: ${totalItems} item dihitung (${matchCount} cocok rak, ${mismatchCount} terdapat selisih fisik). Status: DRAFT / Menunggu Approval Apoteker`,
        newData: { totalItems, matchCount, mismatchCount },
      }),
    }).catch((err) => console.warn("Failed to push audit log:", err));

    setTimeout(() => {
      alert("Stok Opname berhasil disimpan sebagai DRAFT & diteruskan ke Apoteker untuk Approval!");
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* Navigation Sub-Tabs */}
      <InventoryNavTabs />

      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={backHref} className="lg:hidden p-1 rounded-full hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="h-5 w-5 text-emerald-600" />
              Stok Opname Mobile (HP)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Input hitungan fisik obat langsung di rak apotek menggunakan HP & barcode scanner
          </p>
        </div>

        <button
          onClick={() => setIsCameraActive(!isCameraActive)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Camera className="h-4 w-4" />
          Scan Rak Kamera
        </button>
      </div>

      {/* Opname Statistics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Obat</span>
          <p className="text-lg font-bold text-slate-800">{totalItems}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
          <span className="text-[10px] text-emerald-700 font-bold uppercase">Sesuai (Cocok)</span>
          <p className="text-lg font-bold text-emerald-800">{matchCount}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
          <span className="text-[10px] text-rose-700 font-bold uppercase">Ada Selisih</span>
          <p className="text-lg font-bold text-rose-700">{mismatchCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cari obat di rak atau scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Simulated Camera Viewfinder */}
      {isCameraActive && (
        <div className="p-3 bg-slate-900 rounded-xl text-white border border-emerald-500 space-y-2 animate-in zoom-in-95">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Camera className="h-4 w-4 animate-pulse" /> Scanner Kamera Aktif
            </span>
            <button onClick={() => setIsCameraActive(false)} className="text-slate-400 text-xs">
              Tutup
            </button>
          </div>
          <div className="h-28 bg-black rounded-lg border border-dashed border-emerald-400 flex items-center justify-center text-xs text-slate-400">
            Arahkan kamera ke barcode kemasan di rak obat
          </div>
        </div>
      )}

      {/* Opname Items Cards List (Optimized for Mobile Touch) */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isDifference = item.difference !== 0;

          return (
            <div
              key={item.productId}
              className={`p-4 bg-white rounded-xl border transition-all ${
                isDifference
                  ? "border-amber-300 bg-amber-50/20 ring-1 ring-amber-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono bg-slate-100 px-1 rounded">Batch: {item.batchNumber}</span>
                    <span>Satuan: {item.unit}</span>
                  </div>
                </div>

                <Badge
                  variant={isDifference ? "warning" : "success"}
                  className="text-[10px]"
                >
                  {isDifference
                    ? `Selisih: ${item.difference > 0 ? `+${item.difference}` : item.difference} ${item.unit}`
                    : "Sesuai"}
                </Badge>
              </div>

              {/* Counts comparison */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t">
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Stok Sistem</span>
                  <span className="text-base font-extrabold text-slate-700">
                    {item.systemQty}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                    Hitungan Fisik Nyata:
                  </label>
                  <Input
                    type="number"
                    value={item.physicalQty}
                    onChange={(e) => updatePhysicalQty(idx, Number(e.target.value))}
                    className="h-10 text-base font-bold text-center bg-white border-emerald-500"
                  />
                </div>
              </div>

              {/* Note input if mismatch */}
              {isDifference && (
                <div className="mt-2.5">
                  <Input
                    placeholder="Alasan selisih (contoh: tablet rusak / salah hitung)..."
                    value={item.notes}
                    onChange={(e) => updateNotes(idx, e.target.value)}
                    className="h-8 text-[11px] bg-white border-amber-300 text-amber-900 placeholder:text-amber-400"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Action */}
      <div className="sticky bottom-14 left-0 right-0 p-3 bg-white border-t rounded-xl shadow-lg">
        <Button
          onClick={handleSubmit}
          disabled={submitted}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm shadow-md"
        >
          <Save className="mr-2 h-4 w-4" />
          {submitted ? "Opname Berhasil Dikirim!" : "Simpan & Kirim Persetujuan Opname"}
        </Button>
      </div>
    </div>
  );
}
