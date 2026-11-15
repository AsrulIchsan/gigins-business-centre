"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/lib/business-store";
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Award,
  Percent,
  Gift,
  Phone,
  MessageSquare,
} from "lucide-react";
import { MOCK_CUSTOMERS, MockCustomer } from "@/lib/mock-data";
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

export default function MemberCrmPage() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isDynamic = pathname?.startsWith("/b/");
  const waHref = isDynamic ? `/b/${activeBusiness.slug}/crm/whatsapp` : "/crm/whatsapp";

  const [customers, setCustomers] = useState<MockCustomer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTier, setNewTier] = useState<"REGULAR" | "SILVER" | "GOLD" | "PLATINUM">("SILVER");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.memberCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = () => {
    if (!newName || !newPhone) {
      alert("Nama dan nomor WhatsApp wajib diisi!");
      return;
    }

    const discountMap = {
      REGULAR: 0,
      SILVER: 3,
      GOLD: 5,
      PLATINUM: 7,
    };

    const newCust: MockCustomer = {
      id: `c-${Date.now().toString().slice(-4)}`,
      name: newName,
      phone: newPhone,
      memberCode: `MBR-${(customers.length + 1).toString().padStart(3, "0")}`,
      tier: newTier,
      points: 50, // Welcome points
      discountPct: discountMap[newTier],
    };

    setCustomers([...customers, newCust]);
    setIsModalOpen(false);
    setNewName("");
    setNewPhone("");
    alert(`Member ${newCust.name} (${newCust.memberCode}) berhasil didaftarkan!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            CRM Pelanggan, Tier Member & Promo Diskon
          </h1>
          <p className="text-xs text-slate-500">
            Database member apotek, poin loyalitas, tier diskon otomatis saat transaksi di kasir.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Daftarkan Member Baru
        </Button>
      </div>

      {/* Member Tiers Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { tier: "REGULAR", discount: "0%", minPoints: "0 Poin", badgeColor: "secondary" },
          { tier: "SILVER", discount: "Diskon 3%", minPoints: "100 Poin", badgeColor: "cyan" },
          { tier: "GOLD", discount: "Diskon 5%", minPoints: "300 Poin", badgeColor: "warning" },
          { tier: "PLATINUM", discount: "Diskon 7%", minPoints: "1000 Poin", badgeColor: "purple" },
        ].map((t) => (
          <Card key={t.tier} className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <Badge variant={t.badgeColor as any} className="text-xs font-bold">
                  {t.tier}
                </Badge>
                <Award className="h-4 w-4 text-slate-400" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800 mt-2">
                {t.discount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-[11px] text-slate-500">Syarat: {t.minPoints}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member Directory */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Database Pasien & Member Terdaftar
            </CardTitle>
            <CardDescription>
              Daftar member aktif yang terhubung dengan diskon otomatis kasir POS
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, no HP, kode member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Kode Member</th>
                  <th className="p-3">Nama Pasien / Member</th>
                  <th className="p-3">No. WhatsApp</th>
                  <th className="p-3">Tier Member</th>
                  <th className="p-3 text-right">Saldo Poin</th>
                  <th className="p-3 text-right">Diskon Transaksi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-800">{cust.memberCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{cust.name}</td>
                    <td className="p-3 font-mono text-slate-600 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-green-600" />
                      {cust.phone}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          cust.tier === "PLATINUM"
                            ? "purple"
                            : cust.tier === "GOLD"
                            ? "warning"
                            : cust.tier === "SILVER"
                            ? "cyan"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {cust.tier}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {cust.points} Pts
                    </td>
                    <td className="p-3 text-right font-black text-slate-800">
                      {cust.discountPct}%
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Link href={waHref}>
                        <Button variant="outline" size="sm" className="h-7 text-xs text-green-700 border-green-200">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Kirim WA
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

      {/* CREATE MEMBER MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Daftarkan Member / Pasien Baru</DialogTitle>
            <DialogDescription>
              Member akan langsung mendapatkan kode member dan poin selamat datang
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Pasien:</label>
              <Input
                placeholder="Contoh: Ibu Siti Fatimah"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp (Aktif):
              </label>
              <Input
                placeholder="Contoh: 08123456789"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pilih Tier Awal:</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as any)}
                className="w-full text-xs p-2 rounded-lg border bg-slate-50 font-medium"
              >
                <option value="REGULAR">REGULAR (Diskon 0%)</option>
                <option value="SILVER">SILVER (Diskon 3%)</option>
                <option value="GOLD">GOLD (Diskon 5%)</option>
                <option value="PLATINUM">PLATINUM (Diskon 7%)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddMember} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              Simpan & Terbitkan Kartu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
