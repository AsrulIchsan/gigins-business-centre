"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  Truck,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  Printer,
  ChevronRight,
} from "lucide-react";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import { useMasterDataStore } from "@/lib/master-data-store";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
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

interface POItem {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  estimatedPrice: number;
  subtotal: number;
}

export default function PurchaseOrderPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const fakturHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/faktur` : "/pembelian/faktur";

  const [poList, setPoList] = useState([
    {
      id: "PO-KF-202611-001",
      supplierName: "PT Kimia Farma Trading & Distribution",
      orderDate: "2026-11-14",
      expectedDate: "2026-11-16",
      status: "SENT", // DRAFT, SENT, RECEIVED, CANCELLED
      totalAmount: 1840000,
      itemCount: 3,
      notes: "Pengiriman via kurir PBF - Prioritaskan Paracetamol dan Antasida",
    },
    {
      id: "PO-AAM-202611-002",
      supplierName: "PT Anugrah Argon Medica",
      orderDate: "2026-11-12",
      expectedDate: "2026-11-14",
      status: "RECEIVED",
      totalAmount: 2350000,
      itemCount: 2,
      notes: "Faktur telah diterima & stok batch diperbarui",
    },
  ]);

  const { suppliers, addSupplier } = useMasterDataStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");

  // Modal Tambah Supplier Langsung
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupCode, setNewSupCode] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupTerm, setNewSupTerm] = useState(30);

  const handleOpenAddSupplier = (searchVal?: string) => {
    setNewSupName(searchVal || "");
    setNewSupCode("");
    setNewSupContact("");
    setNewSupPhone("");
    setNewSupTerm(30);
    setIsAddSupplierModalOpen(true);
  };

  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    const created = addSupplier({
      name: newSupName.trim(),
      code: newSupCode.trim(),
      contact: newSupContact.trim(),
      phone: newSupPhone.trim(),
      termDays: newSupTerm,
    });
    setSelectedSupplierId(created.id);
    setIsAddSupplierModalOpen(false);
  };

  const [newPoItems, setNewPoItems] = useState<POItem[]>([
    {
      productId: INITIAL_PRODUCTS[0].id,
      name: INITIAL_PRODUCTS[0].name,
      unit: "Box",
      qty: 10,
      estimatedPrice: 38000,
      subtotal: 380000,
    },
    {
      productId: INITIAL_PRODUCTS[3].id,
      name: INITIAL_PRODUCTS[3].name,
      unit: "Box",
      qty: 5,
      estimatedPrice: 28000,
      subtotal: 140000,
    },
  ]);

  const handleCreatePO = () => {
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const total = newPoItems.reduce((sum, item) => sum + item.subtotal, 0);

    const newPO = {
      id: `PO-${supplier?.code.split("-")[1] || "PBF"}-${Date.now().toString().slice(-4)}`,
      supplierName: supplier?.name || "PBF",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "2026-11-18",
      status: "SENT",
      totalAmount: total,
      itemCount: newPoItems.length,
      notes: "PO Digital dibuat otomatis & dikirim via email/WA ke PBF",
    };

    setPoList([newPO, ...poList]);
    setIsCreateOpen(false);
    alert(`Purchase Order ${newPO.id} berhasil diterbitkan ke PBF!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            Belanja ke PBF Online (Purchase Order Digital)
          </h1>
          <p className="text-xs text-slate-500">
            Pembuatan & pelacakan Purchase Order (PO) resmi ke Pedagang Besar Farmasi (PBF).
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Buat PO Baru ke PBF
        </Button>
      </div>

      {/* PO List Table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Riwayat Surat Pesanan (PO) ke PBF
          </CardTitle>
          <CardDescription>
            Monitoring status PO mulai dari Draft, Terkirim ke PBF, hingga Penerimaan Faktur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Nomor PO</th>
                  <th className="p-3">Nama PBF (Distributor)</th>
                  <th className="p-3">Tanggal Pesan</th>
                  <th className="p-3">Est. Tiba</th>
                  <th className="p-3">Jumlah Item</th>
                  <th className="p-3 text-right">Perkiraan Nilai</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {poList.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">{po.id}</td>
                    <td className="p-3 font-semibold text-slate-800">{po.supplierName}</td>
                    <td className="p-3 text-slate-500">{po.orderDate}</td>
                    <td className="p-3 text-slate-500">{po.expectedDate}</td>
                    <td className="p-3 font-medium">{po.itemCount} Macam Obat</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatRupiah(po.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          po.status === "RECEIVED"
                            ? "success"
                            : po.status === "SENT"
                            ? "cyan"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {po.status === "RECEIVED"
                          ? "Faktur Diterima"
                          : po.status === "SENT"
                          ? "Terkirim ke PBF"
                          : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-7 text-xs"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Cetak Surat Pesanan
                      </Button>
                      {po.status === "SENT" && (
                        <Link href={fakturHref}>
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                            Terima Faktur
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE PO MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buat Surat Pesanan (PO) Baru ke PBF</DialogTitle>
            <DialogDescription>
              Pilih PBF resmi rekanan dan susun daftar obat yang akan dipesan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Supplier selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 block">
                  Pilih PBF (Pedagang Besar Farmasi):
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenAddSupplier()}
                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Tambah PBF Baru
                </button>
              </div>

              <SearchableCombobox
                iconType="supplier"
                placeholder="-- Pilih atau cari nama PBF distributor --"
                searchPlaceholder="Cari nama PBF, kode, atau kontak..."
                emptyText="PBF tidak ditemukan"
                addNewButtonText="Tambah PBF / Supplier Baru"
                onAddNew={(q) => handleOpenAddSupplier(q)}
                value={selectedSupplierId}
                onChange={(val) => setSelectedSupplierId(val)}
                options={suppliers
                  .filter((s) => !s.isConsignment)
                  .map((s) => ({
                    value: s.id,
                    label: s.name,
                    badge: s.code,
                    description: `Kontak: ${s.contact} (${s.phone}) • Termin: ${s.termDays} Hari`,
                  }))}
              />
            </div>

            {/* Items Table */}
            <div className="border rounded-xl p-3 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-700 block">Daftar Obat Pesanan:</span>
              <div className="space-y-2">
                {newPoItems.map((item, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {item.qty} {item.unit} @ {formatRupiah(item.estimatedPrice)}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
              <span>Estimasi Total Nilai PO:</span>
              <span className="text-emerald-700 font-black">
                {formatRupiah(newPoItems.reduce((s, i) => s + i.subtotal, 0))}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreatePO} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              <Send className="mr-1.5 h-4 w-4" />
              Kirim Surat Pesanan ke PBF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: TAMBAH PBF / DISTRIBUTOR BARU LANGSUNG */}
      <Dialog open={isAddSupplierModalOpen} onOpenChange={setIsAddSupplierModalOpen}>
        <DialogContent onClose={() => setIsAddSupplierModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Tambah PBF / Supplier Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan data distributor farmasi rekanan. Otomatis tersimpan dan dapat dipilih untuk pemesanan berikutnya.
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

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Termin Hutang (Hari)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={newSupTerm}
                  onChange={(e) => setNewSupTerm(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kontak Person / Sales
                </label>
                <Input
                  placeholder="Contoh: Pak Herman"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nomor Telepon / WA
                </label>
                <Input
                  placeholder="0812-xxxx-xxxx"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                />
              </div>
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
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Simpan & Pilih PBF
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
