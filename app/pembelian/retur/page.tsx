"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Truck,
  Plus,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle2,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { useMasterDataStore } from "@/lib/master-data-store";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { PbfNavTabs } from "@/components/pembelian/pbf-nav-tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ReturPembelianPage() {
  const [returnList, setReturnList] = useState([
    {
      id: "RET-PUR-202611-01",
      supplierName: "PT Kimia Farma Trading & Distribution",
      date: "2026-11-13",
      productName: "Antasida Doen Tablet Kunyah",
      batchNumber: "ATD-2024-K1",
      qty: 10,
      unit: "Tablet",
      totalAmount: 3000,
      reason: "Kemasan blister sobek saat kurir tiba",
      status: "POSTED",
    },
  ]);

  const { suppliers, addSupplier } = useMasterDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[3].id);
  const [returnQty, setReturnQty] = useState(5);
  const [reason, setReason] = useState("Kedaluwarsa dekat / kemasan rusak");

  // Modal Tambah Supplier Langsung
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCode, setNewSupCode] = useState("");

  const handleOpenAddSupplier = (searchVal?: string) => {
    setNewSupName(searchVal || "");
    setNewSupCode("");
    setIsAddSupplierModalOpen(true);
  };

  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    const created = addSupplier({
      name: newSupName.trim(),
      code: newSupCode.trim(),
    });
    setSupplierId(created.id);
    setIsAddSupplierModalOpen(false);
  };

  const product = INITIAL_PRODUCTS.find((p) => p.id === selectedProductId) || INITIAL_PRODUCTS[0];
  const batch = product.batches[0];

  const handleCreateReturn = () => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const newRet = {
      id: `RET-PUR-${Date.now().toString().slice(-4)}`,
      supplierName: supplier?.name || "PBF",
      date: new Date().toISOString().split("T")[0],
      productName: product.name,
      batchNumber: batch ? batch.batchNumber : "GEN-01",
      qty: returnQty,
      unit: product.baseUnit,
      totalAmount: returnQty * (batch?.buyPrice || 1000),
      reason,
      status: "POSTED",
    };

    setReturnList([newRet, ...returnList]);
    setIsModalOpen(false);
    alert(`Retur Pembelian ${newRet.id} berhasil diposting!\nStok batch ${newRet.batchNumber} otomatis dipotong dan hutang ke PBF dikurangi.`);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <PbfNavTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-600" />
            Retur Pembelian ke PBF (Pengembalian Barang)
          </h1>
          <p className="text-xs text-slate-500">
            Pengembalian obat rusak atau mendekati expired ke PBF dengan pemotongan stok batch & pengurangan hutang.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-xs text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Buat Retur ke PBF Baru
        </Button>
      </div>

      {/* Return List Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Daftar Nota Retur Pembelian PBF
          </CardTitle>
          <CardDescription>
            Dokumen sah pengurangan hutang usaha apotek ke PBF distributor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">No. Retur</th>
                  <th className="p-3">Nama PBF</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Obat & Batch Dipotong</th>
                  <th className="p-3">Qty Retur</th>
                  <th className="p-3 text-right">Nilai Potong Hutang</th>
                  <th className="p-3">Alasan Retur</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {returnList.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">{ret.id}</td>
                    <td className="p-3 font-semibold text-slate-800">{ret.supplierName}</td>
                    <td className="p-3 text-slate-500">{ret.date}</td>
                    <td className="p-3">
                      <div>{ret.productName}</div>
                      <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-rose-700 font-bold">
                        Batch: {ret.batchNumber}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      -{ret.qty} {ret.unit}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      {formatRupiah(ret.totalAmount)}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs">{ret.reason}</td>
                    <td className="p-3 text-center">
                      <Badge variant="destructive" className="text-[10px]">
                        {ret.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE RETURN MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Form Retur Pembelian ke PBF</DialogTitle>
            <DialogDescription>
              Pilih obat dan batch yang akan dikembalikan ke distributor PBF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 block">PBF Penerima Retur:</label>
                <button
                  type="button"
                  onClick={() => handleOpenAddSupplier()}
                  className="text-[10px] text-emerald-700 font-bold hover:underline"
                >
                  + Tambah PBF
                </button>
              </div>
              <SearchableCombobox
                iconType="supplier"
                placeholder="-- Pilih atau cari nama PBF --"
                searchPlaceholder="Cari nama PBF, kode, kontak..."
                emptyText="PBF tidak ditemukan"
                addNewButtonText="Tambah PBF Baru"
                onAddNew={(q) => handleOpenAddSupplier(q)}
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                options={suppliers
                  .filter((s) => !s.isConsignment)
                  .map((s) => ({
                    value: s.id,
                    label: s.name,
                    badge: s.code,
                    description: `Kontak: ${s.contact} (${s.phone})`,
                  }))}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Obat yang Diretur:</label>
              <SearchableCombobox
                iconType="tag"
                placeholder="-- Cari nama obat / barcode --"
                searchPlaceholder="Ketik nama obat atau barcode..."
                emptyText="Obat tidak ditemukan"
                value={selectedProductId}
                onChange={(val) => setSelectedProductId(val)}
                options={INITIAL_PRODUCTS.map((p) => ({
                  value: p.id,
                  label: p.name,
                  badge: `${p.totalStock} ${p.baseUnit}`,
                  description: `Kategori: ${p.category} • Barcode: ${p.barcode}`,
                }))}
              />
            </div>

            {batch && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <span className="font-bold text-[11px] block">Batch Terpotong Otomatis:</span>
                <span className="font-mono text-xs">{batch.batchNumber}</span> &bull; ED: {batch.expiredDate.split("T")[0]}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jumlah Qty Retur ({product.baseUnit}):
              </label>
              <Input
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="h-9"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Alasan Pengembalian:</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateReturn} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Konfirmasi & Potong Stok Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: TAMBAH PBF BARU LANGSUNG */}
      <Dialog open={isAddSupplierModalOpen} onOpenChange={setIsAddSupplierModalOpen}>
        <DialogContent onClose={() => setIsAddSupplierModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-600" />
              Tambah PBF / Distributor Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan data distributor rekanan untuk retur pembelian.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewSupplier} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama PBF / Distributor *
              </label>
              <Input
                required
                placeholder="Contoh: PT Anugrah Farma Distribusi"
                value={newSupName}
                onChange={(e) => setNewSupName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Kode Singkat PBF
              </label>
              <Input
                placeholder="Contoh: PBF-AFD"
                value={newSupCode}
                onChange={(e) => setNewSupCode(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddSupplierModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Simpan & Pilih PBF
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
