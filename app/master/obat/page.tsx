"use client";

import React, { useState } from "react";
import {
  Pill,
  Plus,
  Search,
  Edit,
  History,
  Layers,
  Percent,
  TrendingUp,
  Boxes,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { INITIAL_PRODUCTS, MockProduct } from "@/lib/mock-data";
import { useMasterDataStore } from "@/lib/master-data-store";
import { formatRupiah, calculateSellPrice, calculateMarginPercentage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function MasterObatPage() {
  const { categories, addCategory } = useMasterDataStore();
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);

  // Edit Margin / Price Modal
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [targetUnitIndex, setTargetUnitIndex] = useState(0);
  const [newMarginPct, setNewMarginPct] = useState<number>(25);
  const [newSellPrice, setNewSellPrice] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState("");

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGenericName, setNewGenericName] = useState("");
  const [newCategory, setNewCategory] = useState("Analgesik & Antipiretik");
  const [newDrugClass, setNewDrugClass] = useState("OBAT_BEBAS");
  const [newBarcode, setNewBarcode] = useState("");
  const [newRack, setNewRack] = useState("Rak A-01");
  const [newBaseUnit, setNewBaseUnit] = useState("Tablet");
  const [newHpp, setNewHpp] = useState(1000);
  const [newMargin, setNewMargin] = useState(25);
  const [newStock, setNewStock] = useState(100);
  const [newMinStock, setNewMinStock] = useState(20);

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    if (newCategory) addCategory(newCategory);
    const sellPrice = Math.round(newHpp * (1 + newMargin / 100));
    const newProd: MockProduct = {
      id: `prod-${Date.now()}`,
      name: newName,
      genericName: newGenericName || newName,
      category: newCategory,
      barcode: newBarcode || `899${Date.now().toString().slice(-9)}`,
      isConsignment: false,
      supplierName: "PBF Rekanan Apotek",
      minStock: newMinStock,
      maxStock: newStock * 3,
      baseUnit: newBaseUnit,
      units: [
        {
          id: `u-${Date.now()}`,
          unitName: newBaseUnit,
          conversionFactor: 1,
          buyPrice: newHpp,
          sellPrice: sellPrice,
          isBaseUnit: true,
        },
      ],
      batches: [
        {
          id: `bch-${Date.now()}`,
          batchNumber: `BCH-${Date.now().toString().slice(-6)}`,
          expiredDate: "2027-12-31",
          quantity: newStock,
          buyPrice: newHpp,
        },
      ],
      totalStock: newStock,
      defaultMarginPct: newMargin,
    };
    setProducts([newProd, ...products]);

    // Push to Centralized Audit Log
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType: "ACTIVITY",
        module: "PRODUCT",
        action: "CREATE",
        entityId: newProd.id,
        entityName: newName,
        description: `Penambahan master obat baru "${newName}" (Kategori: ${newCategory}, Satuan: ${newBaseUnit}, Stok awal: ${newStock}, Harga Jual: Rp ${sellPrice.toLocaleString("id-ID")})`,
        newData: { name: newName, totalStock: newStock, sellPrice, buyPrice: newHpp },
      }),
    }).catch((err) => console.warn("Failed to push audit log:", err));
    setIsAddModalOpen(false);
    setNewName("");
    setNewGenericName("");
    setNewBarcode("");
    alert(`Produk "${newName}" berhasil ditambahkan ke katalog master dengan harga jual Rp ${sellPrice.toLocaleString("id-ID")}!`);
  };

  // Price Change History Log Mock
  const [priceLogs, setPriceLogs] = useState<any[]>([
    {
      date: "2026-11-10 14:20",
      product: "Sanmol 500mg (Paracetamol)",
      unit: "Tablet",
      oldPrice: 450,
      newPrice: 500,
      oldMargin: 12.5,
      newMargin: 25.0,
      user: "apt. Nurul Aulia, S.Farm",
      reason: "Penyesuaian kenaikan HPP dari PBF Kimia Farma",
    },
    {
      date: "2026-11-05 09:15",
      product: "Amoxicillin 500mg Hexpharm",
      unit: "Strip",
      oldPrice: 7500,
      newPrice: 8000,
      oldMargin: 25.0,
      newMargin: 33.3,
      user: "Siti Rahma (TTK)",
      reason: "Penetapan margin standar HET retail",
    },
  ]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.genericName.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const openPriceModal = (product: MockProduct, unitIdx = 0) => {
    setSelectedProduct(product);
    setTargetUnitIndex(unitIdx);
    const unit = product.units[unitIdx];
    const margin = calculateMarginPercentage(unit.buyPrice, unit.sellPrice);
    setNewMarginPct(margin);
    setNewSellPrice(unit.sellPrice);
    setPriceChangeReason("");
    setIsPriceModalOpen(true);
  };

  const handleMarginChange = (margin: number) => {
    setNewMarginPct(margin);
    if (selectedProduct) {
      const buyPrice = selectedProduct.units[targetUnitIndex].buyPrice;
      setNewSellPrice(calculateSellPrice(buyPrice, margin));
    }
  };

  const handleSellPriceChange = (price: number) => {
    setNewSellPrice(price);
    if (selectedProduct) {
      const buyPrice = selectedProduct.units[targetUnitIndex].buyPrice;
      setNewMarginPct(calculateMarginPercentage(buyPrice, price));
    }
  };

  const savePriceChange = () => {
    if (!selectedProduct) return;

    const oldPrice = selectedProduct.units[targetUnitIndex].sellPrice;
    const buyPrice = selectedProduct.units[targetUnitIndex].buyPrice;
    const oldMargin = calculateMarginPercentage(buyPrice, oldPrice);

    // Update product state
    const updatedProducts = products.map((p) => {
      if (p.id === selectedProduct.id) {
        const updatedUnits = [...p.units];
        updatedUnits[targetUnitIndex] = {
          ...updatedUnits[targetUnitIndex],
          sellPrice: newSellPrice,
        };
        return { ...p, units: updatedUnits };
      }
      return p;
    });

    setProducts(updatedProducts);

    // Append to audit log
    const newLog = {
      date: new Date().toLocaleString("id-ID"),
      product: selectedProduct.name,
      unit: selectedProduct.units[targetUnitIndex].unitName,
      oldPrice,
      newPrice: newSellPrice,
      oldMargin,
      newMargin: newMarginPct,
      user: "apt. Nurul Aulia, S.Farm (Apoteker)",
      reason: priceChangeReason || "Penyesuaian margin berkala",
    };

    setPriceLogs([newLog, ...priceLogs]);

    // Push to Centralized Audit Log
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType: "ACTIVITY",
        module: "PRODUCT",
        action: "UPDATE",
        entityId: selectedProduct.id,
        entityName: selectedProduct.name,
        description: `Perubahan harga jual obat "${selectedProduct.name}" (${selectedProduct.units[targetUnitIndex].unitName}): Rp ${oldPrice.toLocaleString("id-ID")} -> Rp ${newSellPrice.toLocaleString("id-ID")}. Alasan: ${priceChangeReason || "Penyesuaian margin berkala"}`,
        oldData: { sellPrice: oldPrice, margin: oldMargin },
        newData: { sellPrice: newSellPrice, margin: newMarginPct, reason: priceChangeReason },
      }),
    }).catch((err) => console.warn("Failed to push audit log:", err));
    setIsPriceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="h-5 w-5 text-emerald-600" />
            Master Data Obat & Konversi Satuan Bertingkat
          </h1>
          <p className="text-xs text-slate-500">
            Kelola katalog obat, satuan bertingkat (Box &rarr; Strip &rarr; Tablet), margin HPP, dan flag konsinyasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs"
          >
            <History className="mr-1.5 h-4 w-4 text-slate-500" />
            Log Riwayat Perubahan Harga
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Obat Baru
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari berdasarkan nama obat, zat aktif, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Obat & Zat Aktif</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Barcode</th>
                <th className="p-3">Satuan Bertingkat (Konversi)</th>
                <th className="p-3">HPP & Harga Jual</th>
                <th className="p-3">Total Stok</th>
                <th className="p-3">Supplier / Konsinyasi</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">
                    <div>{product.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal italic">
                      {product.genericName}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {product.category}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">
                    {product.barcode}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {product.units.map((u, i) => (
                        <div key={i} className="text-[11px] flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{u.unitName}</span>
                          <span className="text-[10px] text-slate-400">
                            (x{u.conversionFactor} {product.baseUnit})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {product.units.map((u, i) => {
                        const margin = calculateMarginPercentage(u.buyPrice, u.sellPrice);
                        return (
                          <div key={i} className="text-[11px] flex items-center justify-between gap-3">
                            <span className="text-slate-400">
                              HPP: {formatRupiah(u.buyPrice)} &rarr;{" "}
                              <b className="text-emerald-700">{formatRupiah(u.sellPrice)}</b>
                            </span>
                            <Badge variant="success" className="text-[9px] px-1 py-0">
                              +{margin}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">
                      {product.totalStock} {product.baseUnit}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Min: {product.minStock} | Max: {product.maxStock}
                    </div>
                  </td>
                  <td className="p-3">
                    {product.isConsignment ? (
                      <Badge variant="purple" className="text-[10px]">
                        Konsinyasi: {product.supplierName}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">{product.supplierName}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPriceModal(product, 0)}
                      className="text-xs h-7 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      <Percent className="h-3.5 w-3.5 mr-1" />
                      Ubah Margin
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PENGATURAN MARGIN & UBAH HARGA JUAL OTOMATIS */}
      {selectedProduct && (
        <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
          <DialogContent onClose={() => setIsPriceModalOpen(false)} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Kalkulasi Harga Jual & Margin
              </DialogTitle>
              <DialogDescription>
                {selectedProduct.name} &bull; Satuan: {selectedProduct.units[targetUnitIndex].unitName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {/* Select Unit Tab */}
              <div className="flex gap-2 border-b pb-2">
                {selectedProduct.units.map((u, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetUnitIndex(idx);
                      const margin = calculateMarginPercentage(u.buyPrice, u.sellPrice);
                      setNewMarginPct(margin);
                      setNewSellPrice(u.sellPrice);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      targetUnitIndex === idx
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.unitName}
                  </button>
                ))}
              </div>

              {/* HPP (Fixed cost base from Purchase / PBF) */}
              <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="text-slate-600 font-medium">HPP Beli Terakhir (PBF):</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatRupiah(selectedProduct.units[targetUnitIndex].buyPrice)}
                </span>
              </div>

              {/* Auto margin calculator */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Margin Keuntungan (%):
                  </label>
                  <Input
                    type="number"
                    value={newMarginPct}
                    onChange={(e) => handleMarginChange(Number(e.target.value))}
                    className="h-10 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Harga Jual Hasil Kalkulasi (Rp):
                  </label>
                  <Input
                    type="number"
                    value={newSellPrice}
                    onChange={(e) => handleSellPriceChange(Number(e.target.value))}
                    className="h-10 text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Margin Shortcuts */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1">Pilihan Cepat Standar Margin Apotek:</p>
                <div className="flex gap-1.5">
                  {[15, 20, 25, 30, 35, 50].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMarginChange(m)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-emerald-100 rounded text-[11px] font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason for change (Mandatory for audit trail) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Perubahan Harga (Wajib Log Audit):
                </label>
                <Input
                  placeholder="Misal: Kenaikan harga faktur PBF / HET regulasi..."
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPriceModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={savePriceChange} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                Simpan & Rekam Log Riwayat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: LOG RIWAYAT PERUBAHAN HARGA */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent onClose={() => setIsHistoryOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-700" />
              Log Riwayat Perubahan Harga Jual & Margin
            </DialogTitle>
            <DialogDescription>
              Catatan audit trail lengkap siapa yang mengubah harga, kapan, dan alasannya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {priceLogs.map((log, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{log.product} ({log.unit})</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="line-through text-slate-400">{formatRupiah(log.oldPrice)} ({log.oldMargin}%)</span>
                  <ArrowRight className="h-3 w-3 text-emerald-600" />
                  <span className="font-bold text-emerald-700">{formatRupiah(log.newPrice)} ({log.newMargin}%)</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t flex justify-between">
                  <span>Alasan: <i>&ldquo;{log.reason}&rdquo;</i></span>
                  <span className="font-medium text-slate-700">&bull; Oleh: {log.user}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* MODAL: TAMBAH OBAT BARU */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Tambah Produk / Obat Baru
            </DialogTitle>
            <DialogDescription>
              Input nama produk, satuan bertingkat, HPP, margin target, dan stok awal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700">Nama Obat / Produk *</label>
                <Input
                  required
                  placeholder="Contoh: Amoxicillin 500mg Kapsul"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Zat Aktif / Komposisi</label>
                <Input
                  placeholder="Contoh: Amoxicillin Trihydrate"
                  value={newGenericName}
                  onChange={(e) => setNewGenericName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Golongan Obat</label>
                <select
                  value={newDrugClass}
                  onChange={(e) => setNewDrugClass(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 px-3 bg-white text-xs"
                >
                  <option value="OBAT_BEBAS">Obat Bebas (Hijau)</option>
                  <option value="OBAT_BEBAS_TERBATAS">Obat Bebas Terbatas (Biru)</option>
                  <option value="OBAT_KERAS">Obat Keras (Merah / K)</option>
                  <option value="ALKES">Alat Kesehatan & Medis</option>
                  <option value="SUPLEMEN">Vitamin & Suplemen</option>
                  <option value="MAINAN">Mainan / Non-Obat</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold block text-slate-700">Kategori Obat</label>
                  <span className="text-[10px] text-slate-400">Pilih / Ketik Baru</span>
                </div>
                <SearchableCombobox
                  iconType="tag"
                  placeholder="-- Pilih atau cari kategori --"
                  searchPlaceholder="Cari atau ketik kategori baru..."
                  emptyText="Kategori belum ada di daftar"
                  addNewButtonText="Tambah Kategori Baru"
                  onAddNew={(q) => {
                    const added = addCategory(q);
                    setNewCategory(added);
                  }}
                  value={newCategory}
                  onChange={(val) => setNewCategory(val)}
                  options={categories.map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Kode Barcode</label>
                <Input
                  placeholder="Scan atau kosongkan"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Lokasi Rak / Lemari</label>
                <Input
                  placeholder="Contoh: Rak Kapsul B-02"
                  value={newRack}
                  onChange={(e) => setNewRack(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Satuan Terkecil (Jual)</label>
                <Input
                  placeholder="Contoh: Tablet / Kapsul / Pcs"
                  value={newBaseUnit}
                  onChange={(e) => setNewBaseUnit(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">HPP / Harga Beli (Rp) *</label>
                <Input
                  type="number"
                  required
                  value={newHpp}
                  onChange={(e) => setNewHpp(Number(e.target.value))}
                  className="bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Margin Target (%) *</label>
                <Input
                  type="number"
                  required
                  value={newMargin}
                  onChange={(e) => setNewMargin(Number(e.target.value))}
                  className="bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Stok Awal Fisik</label>
                <Input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">Batas Alert Stok Menipis</label>
                <Input
                  type="number"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Number(e.target.value))}
                  className="bg-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold block">Estimasi Harga Jual:</span>
                <span className="text-[10px] text-emerald-700">HPP Rp {newHpp.toLocaleString("id-ID")} + Margin {newMargin}%</span>
              </div>
              <span className="text-base font-black text-emerald-800">
                Rp {Math.round(newHpp * (1 + newMargin / 100)).toLocaleString("id-ID")}
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                Simpan Produk Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
