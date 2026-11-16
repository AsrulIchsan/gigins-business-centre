"use client";

import React, { useState } from "react";
import {
  Boxes,
  Clock,
  Filter,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertCircle,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Tag,
} from "lucide-react";
import { INITIAL_PRODUCTS, MockBatch, MockProduct } from "@/lib/mock-data";
import { useMasterDataStore } from "@/lib/master-data-store";
import { formatRupiah, formatDateIndo, getExpirationBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { InventoryNavTabs } from "@/components/inventory/inventory-nav-tabs";

interface StockMutationItem {
  id: string;
  date: string;
  type: string;
  ref: string;
  batch: string;
  exp: string;
  qtyIn: number;
  qtyOut: number;
  balanceBefore: number;
  balanceAfter: number;
  unit: string;
  notes: string;
  user: string;
}

const INITIAL_MUTATIONS: StockMutationItem[] = [
  {
    id: "mut-1",
    date: "2026-11-14 14:15",
    type: "SALE",
    ref: "SL-TS-981240",
    batch: "BCH-SNM-24A",
    exp: "2026-12-10",
    qtyIn: 0,
    qtyOut: 10,
    balanceBefore: 420,
    balanceAfter: 410,
    unit: "Tablet",
    notes: "Penjualan Kasir POS Shift 1 (FIFO Earliest Batch)",
    user: "Siti Rahma (Kasir)",
  },
  {
    id: "mut-2",
    date: "2026-11-14 10:30",
    type: "SALE",
    ref: "SL-TS-981232",
    batch: "BCH-SNM-24A",
    exp: "2026-12-10",
    qtyIn: 0,
    qtyOut: 20,
    balanceBefore: 440,
    balanceAfter: 420,
    unit: "Tablet",
    notes: "Penjualan Resep dr. Hendra Gunawan",
    user: "Siti Rahma (Kasir)",
  },
  {
    id: "mut-3",
    date: "2026-11-13 16:00",
    type: "SALE_RETURN",
    ref: "RET-SL-004",
    batch: "BCH-SNM-24A",
    exp: "2026-12-10",
    qtyIn: 10,
    qtyOut: 0,
    balanceBefore: 430,
    balanceAfter: 440,
    unit: "Tablet",
    notes: "Retur Penjualan: Pasien kelebihan tebus obat",
    user: "apt. Nurul Aulia",
  },
  {
    id: "mut-4",
    date: "2026-11-10 11:20",
    type: "PURCHASE",
    ref: "FAK-KF-89211",
    batch: "BCH-SNM-26C",
    exp: "2027-11-20",
    qtyIn: 200,
    qtyOut: 0,
    balanceBefore: 230,
    balanceAfter: 430,
    unit: "Tablet",
    notes: "Penerimaan Faktur Pembelian PBF Kimia Farma (Batch Baru)",
    user: "apt. Nurul Aulia",
  },
  {
    id: "mut-5",
    date: "2026-11-01 08:00",
    type: "OPNAME",
    ref: "OPN-20261101",
    batch: "BCH-SNM-24A",
    exp: "2026-12-10",
    qtyIn: 0,
    qtyOut: 2,
    balanceBefore: 232,
    balanceAfter: 230,
    unit: "Tablet",
    notes: "Penyesuaian Selisih Fisik Opname Awal Bulan",
    user: "Siti Rahma (Kasir)",
  },
];

export default function KartuStokPage() {
  const { products, updateProductBatches, addBatchToProduct, updateProductStock } = useMasterDataStore();
  const productList: MockProduct[] = products && products.length > 0 ? products : INITIAL_PRODUCTS;

  const [selectedProductId, setSelectedProductId] = useState<string>(productList[0]?.id || "prod-1");
  const [productSearch, setProductSearch] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [mutations, setMutations] = useState<StockMutationItem[]>(INITIAL_MUTATIONS);

  // Modal States
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<MockBatch | null>(null);
  const [editBatchForm, setEditBatchForm] = useState({
    batchNumber: "",
    expiredDate: "",
    quantity: 0,
    buyPrice: 0,
    reason: "Penyesuaian stok & batch fisik",
  });

  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [addBatchForm, setAddBatchForm] = useState({
    batchNumber: "",
    expiredDate: "2027-12-31",
    quantity: 50,
    buyPrice: 1000,
    reason: "Penambahan batch baru dari gudang/opname",
  });

  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustStockForm, setAdjustStockForm] = useState({
    newTotalStock: 0,
    reason: "Penyesuaian stok fisik kartu stok",
  });

  const product = productList.find((p) => p.id === selectedProductId) || productList[0];

  const filteredProducts = productList.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      (p.genericName && p.genericName.toLowerCase().includes(q))
    );
  });

  const filteredMutations = mutations.filter((m) => {
    if (filterType === "ALL") return true;
    return m.type === filterType;
  });

  // Handler: Open Edit Batch Modal
  const handleOpenEditBatch = (batch: MockBatch) => {
    setEditingBatch(batch);
    setEditBatchForm({
      batchNumber: batch.batchNumber,
      expiredDate: batch.expiredDate ? batch.expiredDate.slice(0, 10) : "",
      quantity: batch.quantity,
      buyPrice: batch.buyPrice || product.units[0]?.buyPrice || 1000,
      reason: "Koreksi data batch / stok fisik rak apotek",
    });
    setIsEditBatchOpen(true);
  };

  // Handler: Save Edit Batch
  const handleSaveEditBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !product) return;

    const oldQty = editingBatch.quantity;
    const newQty = Number(editBatchForm.quantity);
    const diff = newQty - oldQty;
    const prevTotal = product.totalStock;
    const newTotal = prevTotal + diff;

    const updatedBatches = product.batches.map((b) => {
      if (b.id === editingBatch.id) {
        return {
          ...b,
          batchNumber: editBatchForm.batchNumber.trim().toUpperCase(),
          expiredDate: editBatchForm.expiredDate,
          quantity: newQty,
          buyPrice: Number(editBatchForm.buyPrice),
        };
      }
      return b;
    });

    updateProductBatches(product.id, updatedBatches, editBatchForm.reason);

    // Record Mutation
    const newMut: StockMutationItem = {
      id: `mut-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: "OPNAME",
      ref: `EDT-${editBatchForm.batchNumber.slice(0, 8)}`,
      batch: editBatchForm.batchNumber.trim().toUpperCase(),
      exp: editBatchForm.expiredDate,
      qtyIn: diff > 0 ? diff : 0,
      qtyOut: diff < 0 ? Math.abs(diff) : 0,
      balanceBefore: prevTotal,
      balanceAfter: newTotal,
      unit: product.baseUnit,
      notes: `${editBatchForm.reason} (Batch ${editingBatch.batchNumber} -> ${editBatchForm.batchNumber})`,
      user: "Owner / Pengelola Stok",
    };
    setMutations([newMut, ...mutations]);

    setIsEditBatchOpen(false);
    alert(`Batch "${editBatchForm.batchNumber}" berhasil diperbarui! Stok obat kini: ${newTotal} ${product.baseUnit}.`);
  };

  // Handler: Open Add Batch Modal
  const handleOpenAddBatch = () => {
    const randomBatch = `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setAddBatchForm({
      batchNumber: randomBatch,
      expiredDate: "2027-12-31",
      quantity: 50,
      buyPrice: product.units[0]?.buyPrice || 1000,
      reason: "Penambahan batch baru fisik apotek",
    });
    setIsAddBatchOpen(true);
  };

  // Handler: Save Add Batch
  const handleSaveAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const addedQty = Number(addBatchForm.quantity);
    const prevTotal = product.totalStock;
    const newTotal = prevTotal + addedQty;

    addBatchToProduct(product.id, {
      batchNumber: addBatchForm.batchNumber.trim().toUpperCase(),
      expiredDate: addBatchForm.expiredDate,
      quantity: addedQty,
      buyPrice: Number(addBatchForm.buyPrice),
    });

    // Record Mutation
    const newMut: StockMutationItem = {
      id: `mut-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: "PURCHASE",
      ref: `NEW-BCH-${Date.now().toString().slice(-4)}`,
      batch: addBatchForm.batchNumber.trim().toUpperCase(),
      exp: addBatchForm.expiredDate,
      qtyIn: addedQty,
      qtyOut: 0,
      balanceBefore: prevTotal,
      balanceAfter: newTotal,
      unit: product.baseUnit,
      notes: `${addBatchForm.reason} (Input Batch Baru)`,
      user: "Owner / Pengelola Stok",
    };
    setMutations([newMut, ...mutations]);

    setIsAddBatchOpen(false);
    alert(`Batch baru "${addBatchForm.batchNumber}" (+${addedQty} ${product.baseUnit}) berhasil ditambahkan!`);
  };

  // Handler: Open Quick Total Stock Adjustment
  const handleOpenAdjustStock = () => {
    setAdjustStockForm({
      newTotalStock: product.totalStock,
      reason: "Penyesuaian stok fisik langsung",
    });
    setIsAdjustStockOpen(true);
  };

  // Handler: Save Quick Total Stock Adjustment
  const handleSaveAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const newStock = Number(adjustStockForm.newTotalStock);
    const prevStock = product.totalStock;
    const diff = newStock - prevStock;

    updateProductStock(product.id, newStock, adjustStockForm.reason);

    const newMut: StockMutationItem = {
      id: `mut-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: "OPNAME",
      ref: `OPN-${Date.now().toString().slice(-6)}`,
      batch: product.batches[0]?.batchNumber || "FIFO-MAIN",
      exp: product.batches[0]?.expiredDate || "2027-12-31",
      qtyIn: diff > 0 ? diff : 0,
      qtyOut: diff < 0 ? Math.abs(diff) : 0,
      balanceBefore: prevStock,
      balanceAfter: newStock,
      unit: product.baseUnit,
      notes: adjustStockForm.reason,
      user: "Owner / Pengelola Stok",
    };
    setMutations([newMut, ...mutations]);

    setIsAdjustStockOpen(false);
    alert(`Stok total "${product.name}" berhasil diubah menjadi ${newStock} ${product.baseUnit}!`);
  };

  // Handler: Delete Batch
  const handleDeleteBatch = (batchId: string) => {
    if (!product) return;
    if (product.batches.length <= 1) {
      alert("Produk minimal harus memiliki 1 batch aktif!");
      return;
    }
    const targetBatch = product.batches.find((b) => b.id === batchId);
    if (!targetBatch) return;

    if (
      !confirm(
        `Yakin ingin menghapus batch "${targetBatch.batchNumber}" (Stok: ${targetBatch.quantity} ${product.baseUnit})?\nStok total produk akan otomatis berkurang.`
      )
    ) {
      return;
    }

    const prevTotal = product.totalStock;
    const newTotal = prevTotal - targetBatch.quantity;
    const updatedBatches = product.batches.filter((b) => b.id !== batchId);
    updateProductBatches(product.id, updatedBatches, "Hapus batch kedaluwarsa/kosong");

    const newMut: StockMutationItem = {
      id: `mut-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      type: "OPNAME",
      ref: `DEL-${targetBatch.batchNumber.slice(0, 8)}`,
      batch: targetBatch.batchNumber,
      exp: targetBatch.expiredDate,
      qtyIn: 0,
      qtyOut: targetBatch.quantity,
      balanceBefore: prevTotal,
      balanceAfter: newTotal,
      unit: product.baseUnit,
      notes: `Penghapusan batch "${targetBatch.batchNumber}" dari sistem`,
      user: "Owner / Pengelola Stok",
    };
    setMutations([newMut, ...mutations]);

    alert(`Batch "${targetBatch.batchNumber}" berhasil dihapus.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-600" />
            Kartu Stok & Manajemen Batch FIFO (Editable)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola, edit stok fisik, ubah nomor batch & tanggal kedaluwarsa, serta audit trail mutasi real-time.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => alert("Mengunduh Kartu Stok & Laporan Mutasi FIFO (Format Excel & PDF)...")}
          className="text-xs border-slate-300"
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-700" />
          Export Excel / PDF
        </Button>
      </div>

      {/* Navigation Sub-Tabs */}
      <InventoryNavTabs />

      {/* Select Product & Batch Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Product Selector Card */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Pilih Obat / Produk ({filteredProducts.length})
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {productList.length} Total
              </Badge>
            </div>
            {/* Search Input */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari nama, generik, barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5 max-h-[460px] overflow-y-auto">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex justify-between items-center ${
                  p.id === selectedProductId
                    ? "border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950 ring-1 ring-emerald-500 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="truncate pr-2">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal truncate">
                    {p.barcode || "No Barcode"} &bull; {p.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold block ${
                      p.totalStock <= p.minStock ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {p.totalStock} {p.baseUnit}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {p.batches.length} Batch
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Batches of Selected Product (FIFO Priority & Editable) */}
        <Card className="border-slate-200 bg-white lg:col-span-2 shadow-xs">
          <CardHeader className="pb-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  {product.name}
                </CardTitle>
                <Badge variant="cyan" className="text-xs font-bold">
                  Total Stok: {product.totalStock} {product.baseUnit}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Daftar batch FIFO aktif. Klik <b>Edit</b> pada batch untuk ubah stok, nomor batch, atau tanggal ED.
              </CardDescription>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenAdjustStock}
                className="text-xs h-8 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1"
                title="Sesuaikan Total Stok Fisik Cepat"
              >
                <Boxes className="h-3.5 w-3.5 text-amber-700" />
                Sesuaikan Stok Total
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddBatch}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Batch
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="space-y-3">
              {product.batches.map((batch, idx) => {
                const badge = getExpirationBadge(batch.expiredDate);
                const isFirstFifo = idx === 0;

                return (
                  <div
                    key={batch.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                      isFirstFifo
                        ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-300"
                        : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isFirstFifo && (
                          <Badge variant="success" className="text-[9px] font-bold">
                            PRIORITAS FIFO #1
                          </Badge>
                        )}
                        <span className="font-mono font-bold text-sm text-slate-800">
                          {batch.batchNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeColor}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kedaluwarsa: <b>{formatDateIndo(batch.expiredDate)}</b> &bull; Harga Beli:{" "}
                        {formatRupiah(batch.buyPrice || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">
                          {batch.quantity}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{product.baseUnit}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {Math.round((batch.quantity / (product.totalStock || 1)) * 100)}% dari total
                        </span>
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1.5 border-l pl-3 border-slate-200">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditBatch(batch)}
                          className="h-8 px-2.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 font-semibold flex items-center gap-1"
                          title="Edit Nomor Batch, Tanggal Kedaluwarsa, atau Stok Batch ini"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        {product.batches.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBatch(batch.id)}
                            className="h-8 px-2 text-xs text-rose-600 bg-white hover:bg-rose-50 border-rose-200"
                            title="Hapus Batch Ini"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Mutation Log (Kartu Stok) */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Riwayat Mutasi Kartu Stok (Audit Trail Saldo)
            </CardTitle>
            <CardDescription className="text-xs">
              Audit trail otomatis untuk mutasi keluar/masuk, opname, koreksi batch, dan retur.
            </CardDescription>
          </div>

          {/* Filter Types */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {["ALL", "SALE", "PURCHASE", "SALE_RETURN", "OPNAME"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === f ? "bg-white text-emerald-800 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                {f === "ALL"
                  ? "Semua"
                  : f === "SALE"
                  ? "Keluar (Jual)"
                  : f === "PURCHASE"
                  ? "Masuk (Beli)"
                  : f === "SALE_RETURN"
                  ? "Retur Jual"
                  : "Opname / Koreksi"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Waktu & User</th>
                  <th className="p-3">Jenis Transaksi</th>
                  <th className="p-3">No. Referensi</th>
                  <th className="p-3">Batch & Expired</th>
                  <th className="p-3 text-right">Masuk</th>
                  <th className="p-3 text-right">Keluar</th>
                  <th className="p-3 text-right">Saldo Akhir</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredMutations.map((mut) => (
                  <tr key={mut.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{mut.date}</div>
                      <div className="text-[10px] text-slate-400">{mut.user}</div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          mut.type === "PURCHASE" || mut.type === "SALE_RETURN"
                            ? "success"
                            : mut.type === "SALE"
                            ? "secondary"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {mut.type}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-800">{mut.ref}</td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {mut.batch}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {mut.qtyIn > 0 ? `+${mut.qtyIn}` : "-"}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      {mut.qtyOut > 0 ? `-${mut.qtyOut}` : "-"}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      {mut.balanceAfter} <span className="text-[10px] text-slate-400 font-normal">{mut.unit}</span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500 max-w-xs">{mut.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── MODAL 1: EDIT BATCH & STOK SPESIFIK ─── */}
      {editingBatch && (
        <Dialog open={isEditBatchOpen} onOpenChange={setIsEditBatchOpen}>
          <DialogContent onClose={() => setIsEditBatchOpen(false)} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Pencil className="h-5 w-5 text-amber-600" />
                Edit Batch & Stok Fisik
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ubah nomor batch, tanggal kedaluwarsa, atau jumlah stok fisik untuk <b>{product.name}</b>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEditBatch} className="space-y-4 text-xs pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nomor Batch *
                </label>
                <Input
                  required
                  value={editBatchForm.batchNumber}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, batchNumber: e.target.value })}
                  placeholder="Contoh: BCH-2026-01"
                  className="h-9 font-mono font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tanggal Kedaluwarsa (ED) *
                  </label>
                  <Input
                    required
                    type="date"
                    value={editBatchForm.expiredDate}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, expiredDate: e.target.value })}
                    className="h-9 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-emerald-800 block mb-1">
                    Stok Batch Ini ({product.baseUnit}) *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={editBatchForm.quantity}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, quantity: Number(e.target.value) })}
                    className="h-9 font-bold text-base text-emerald-800 bg-emerald-50/50 border-emerald-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Harga Beli / HPP Satuan (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={editBatchForm.buyPrice}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, buyPrice: Number(e.target.value) })}
                  className="h-9 font-mono bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alasan Penyesuaian (Audit Log)
                </label>
                <Input
                  value={editBatchForm.reason}
                  onChange={(e) => setEditBatchForm({ ...editBatchForm, reason: e.target.value })}
                  placeholder="Contoh: Koreksi selisih opname fisik rak apotek"
                  className="h-9 bg-white text-xs"
                />
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditBatchOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── MODAL 2: TAMBAH BATCH BARU ─── */}
      <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <DialogContent onClose={() => setIsAddBatchOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Plus className="h-5 w-5 text-emerald-600" />
              Tambah Batch Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftarkan nomor batch baru untuk <b>{product.name}</b>. Batch ini akan otomatis masuk ke antrean FIFO.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAddBatch} className="space-y-4 text-xs pt-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Batch Baru *
              </label>
              <Input
                required
                value={addBatchForm.batchNumber}
                onChange={(e) => setAddBatchForm({ ...addBatchForm, batchNumber: e.target.value })}
                placeholder="Contoh: BCH-2027-01A"
                className="h-9 font-mono font-bold bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tanggal Kedaluwarsa *
                </label>
                <Input
                  required
                  type="date"
                  value={addBatchForm.expiredDate}
                  onChange={(e) => setAddBatchForm({ ...addBatchForm, expiredDate: e.target.value })}
                  className="h-9 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-emerald-800 block mb-1">
                  Stok Masuk ({product.baseUnit}) *
                </label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={addBatchForm.quantity}
                  onChange={(e) => setAddBatchForm({ ...addBatchForm, quantity: Number(e.target.value) })}
                  className="h-9 font-bold text-base text-emerald-800 bg-emerald-50/50 border-emerald-300"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Harga Beli Satuan (Rp)
              </label>
              <Input
                type="number"
                min="0"
                value={addBatchForm.buyPrice}
                onChange={(e) => setAddBatchForm({ ...addBatchForm, buyPrice: Number(e.target.value) })}
                className="h-9 font-mono bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alasan / Referensi Masuk
              </label>
              <Input
                value={addBatchForm.reason}
                onChange={(e) => setAddBatchForm({ ...addBatchForm, reason: e.target.value })}
                placeholder="Contoh: Penerimaan barang baru / sisa stok gudang"
                className="h-9 bg-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBatchOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Tambahkan Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: SESUAIKAN STOK TOTAL LANGSUNG ─── */}
      <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
        <DialogContent onClose={() => setIsAdjustStockOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Boxes className="h-5 w-5 text-amber-600" />
              Sesuaikan Total Stok Fisik Cepat
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ubah total stok fisik obat <b>{product.name}</b> secara langsung (Stok saat ini: {product.totalStock} {product.baseUnit}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdjustStock} className="space-y-4 text-xs pt-1">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <label className="font-bold text-amber-900 block mb-1 text-xs">
                Jumlah Total Stok Fisik Baru ({product.baseUnit}) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={adjustStockForm.newTotalStock}
                onChange={(e) => setAdjustStockForm({ ...adjustStockForm, newTotalStock: Number(e.target.value) })}
                className="h-10 text-lg font-black text-amber-950 bg-white border-amber-300"
              />
              <p className="text-[10px] text-amber-800 mt-1">
                Selisih:{" "}
                <strong>
                  {adjustStockForm.newTotalStock - product.totalStock > 0
                    ? `+${adjustStockForm.newTotalStock - product.totalStock}`
                    : adjustStockForm.newTotalStock - product.totalStock}{" "}
                  {product.baseUnit}
                </strong>{" "}
                (Otomatis disinkronkan ke batch FIFO aktif).
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alasan Penyesuaian Fisik (Audit Log) *
              </label>
              <Input
                required
                value={adjustStockForm.reason}
                onChange={(e) => setAdjustStockForm({ ...adjustStockForm, reason: e.target.value })}
                placeholder="Contoh: Stok opname fisik rak kasir"
                className="h-9 bg-white"
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustStockOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Simpan Penyesuaian
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
