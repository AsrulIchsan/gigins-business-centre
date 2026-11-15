"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  FileText,
  Plus,
  Truck,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Save,
  Boxes,
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

interface PurchaseInvoiceItem {
  productId: string;
  name: string;
  unit: string;
  batchNumber: string;
  expiredDate: string;
  qty: number;
  buyPrice: number;
  subtotal: number;
}

export default function FakturPembelianPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const mobileHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/mobile` : "/pembelian/mobile";
  const returHref = isDynamic ? `/b/${activeBusiness.slug}/pembelian/retur` : "/pembelian/retur";

  const [invoices, setInvoices] = useState([
    {
      id: "PUR-202611-001",
      invoiceNumber: "FAK-KF-99812",
      supplierName: "PT Kimia Farma Trading & Distribution",
      invoiceDate: "2026-11-14",
      dueDate: "2026-12-14", // 30 days term
      totalAmount: 1840000,
      paidAmount: 0,
      status: "POSTED", // DRAFT, POSTED, PAID
      itemCount: 2,
    },
    {
      id: "PUR-202611-002",
      invoiceNumber: "FAK-AAM-55410",
      supplierName: "PT Anugrah Argon Medica",
      invoiceDate: "2026-11-10",
      dueDate: "2026-12-01",
      totalAmount: 2350000,
      paidAmount: 2350000,
      status: "PAID",
      itemCount: 1,
    },
  ]);

  const { suppliers, addSupplier } = useMasterDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-11-14");
  const [dueDate, setDueDate] = useState("2026-12-14");
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

  // Invoice Items being inputted
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    {
      productId: INITIAL_PRODUCTS[0].id,
      name: INITIAL_PRODUCTS[0].name,
      unit: "Box",
      batchNumber: "BCH-SNM-27X",
      expiredDate: "2028-04-30",
      qty: 20,
      buyPrice: 38000,
      subtotal: 760000,
    },
    {
      productId: INITIAL_PRODUCTS[1].id,
      name: INITIAL_PRODUCTS[1].name,
      unit: "Box",
      batchNumber: "AMX-2026-N2",
      expiredDate: "2028-08-15",
      qty: 15,
      buyPrice: 58000,
      subtotal: 870000,
    },
  ]);

  const totalInvoice = items.reduce((sum, it) => sum + it.subtotal, 0);

  const handleSaveInvoice = () => {
    if (!invoiceNumber) {
      alert("Mohon masukkan nomor faktur fisik dari PBF!");
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const newInv = {
      id: `PUR-202611-${Date.now().toString().slice(-3)}`,
      invoiceNumber,
      supplierName: supplier?.name || "PBF",
      invoiceDate,
      dueDate,
      totalAmount: totalInvoice,
      paidAmount: 0,
      status: "POSTED",
      itemCount: items.length,
    };

    setInvoices([newInv, ...invoices]);
    setIsModalOpen(false);
    alert(`Faktur ${invoiceNumber} berhasil diposting!\nStok batch FIFO & Hutang Usaha ke PBF otomatis diperbarui.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Penerimaan Faktur Pembelian PBF & Update Batch
          </h1>
          <p className="text-xs text-slate-500">
            Pencatatan faktur resmi, pembaruan nomor batch & ED barang datang, serta pencatatan hutang dagang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={mobileHref}>
            <Button variant="outline" size="sm" className="text-xs text-emerald-700 border-emerald-300">
              <Smartphone className="mr-1.5 h-4 w-4" />
              Mode Input Faktur HP
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Input Faktur Baru
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800">
            Daftar Faktur Pembelian PBF Terbuku
          </CardTitle>
          <CardDescription>
            Rekap faktur yang masuk ke persediaan apotek dan jadwal jatuh tempo pelunasan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">No. Faktur PBF</th>
                  <th className="p-3">Nama PBF (Distributor)</th>
                  <th className="p-3">Tanggal Faktur</th>
                  <th className="p-3">Jatuh Tempo Hutang</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 text-right">Total Faktur</th>
                  <th className="p-3 text-center">Status Hutang</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{inv.supplierName}</td>
                    <td className="p-3 text-slate-500">{inv.invoiceDate}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{inv.dueDate}</div>
                      <span className="text-[10px] text-amber-700">Hutang Jatuh Tempo</span>
                    </td>
                    <td className="p-3">{inv.itemCount} Batch Obat</td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={inv.status === "PAID" ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {inv.status === "PAID" ? "Lunas" : "Belum Lunas (Hutang)"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Link href={returHref}>
                        <Button variant="outline" size="sm" className="h-7 text-xs text-rose-600 border-rose-200">
                          Retur ke PBF
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: INPUT PENERIMAAN FAKTUR PBF */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Input Penerimaan Faktur PBF</DialogTitle>
            <DialogDescription>
              Masukkan rincian nomor batch, tanggal expired, dan harga beli terbaru dari faktur fisik
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Top Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor Faktur PBF:</label>
                <Input
                  placeholder="Contoh: FAK-KF-202611"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="bg-white h-8"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">PBF Rekanan:</label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddSupplier()}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Tambah PBF
                  </button>
                </div>
                <SearchableCombobox
                  iconType="supplier"
                  placeholder="-- Pilih atau cari nama PBF --"
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
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tgl Jatuh Tempo:</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white h-8"
                />
              </div>
            </div>

            {/* Batch & Expiration input table */}
            <div className="border rounded-xl p-3 bg-white space-y-2">
              <span className="font-bold text-slate-800 block">Rincian Obat & Batch Fisik Datang:</span>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border space-y-2">
                    <div className="flex justify-between items-center font-semibold text-slate-800">
                      <span>{it.name} ({it.unit})</span>
                      <span className="text-emerald-700 font-bold">{formatRupiah(it.subtotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">
                          No. Batch Kemasan:
                        </label>
                        <Input
                          value={it.batchNumber}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].batchNumber = e.target.value;
                            setItems(updated);
                          }}
                          className="h-8 bg-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">
                          Expired Date (ED):
                        </label>
                        <Input
                          type="date"
                          value={it.expiredDate}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].expiredDate = e.target.value;
                            setItems(updated);
                          }}
                          className="h-8 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">
                          Qty Diterima:
                        </label>
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...items];
                            updated[idx].qty = val;
                            updated[idx].subtotal = val * updated[idx].buyPrice;
                            setItems(updated);
                          }}
                          className="h-8 bg-white text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">
                          Harga Beli (HPP):
                        </label>
                        <Input
                          type="number"
                          value={it.buyPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...items];
                            updated[idx].buyPrice = val;
                            updated[idx].subtotal = updated[idx].qty * val;
                            setItems(updated);
                          }}
                          className="h-8 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
              <span>Total Nilai Faktur (Hutang PBF):</span>
              <span className="text-xl font-black text-emerald-700">{formatRupiah(totalInvoice)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveInvoice} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              <Save className="mr-1.5 h-4 w-4" />
              Posting Faktur & Tambah Stok Batch FIFO
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
              Tambahkan data distributor farmasi rekanan. Otomatis tersimpan dan dapat dipilih untuk penerimaan faktur.
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
