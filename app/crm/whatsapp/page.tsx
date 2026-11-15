"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Clock,
  CheckCheck,
  Sparkles,
  FileText,
  User,
  Copy,
} from "lucide-react";
import { useMasterDataStore } from "@/lib/master-data-store";
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

export default function WhatsAppMarketingPage() {
  const { customers, addCustomer } = useMasterDataStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("REFILL_REMINDER");
  const [selectedPhone, setSelectedPhone] = useState(customers[0]?.phone || "");
  const [patientName, setPatientName] = useState(customers[0]?.name || "");
  const [medicineName, setMedicineName] = useState("Amlodipine 10mg Dexa");
  const [customText, setCustomText] = useState("");

  // Modal Tambah Pasien Baru Langsung
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  const handleOpenAddPatient = (searchVal?: string) => {
    setNewPatientName(searchVal || "");
    setNewPatientPhone("");
    setIsAddPatientOpen(true);
  };

  const handleSaveNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    const created = addCustomer({
      name: newPatientName.trim(),
      phone: newPatientPhone.trim(),
    });
    setSelectedPhone(created.phone);
    setPatientName(created.name);
    setIsAddPatientOpen(false);
  };

  const templates = {
    RECEIPT: `Halo {nama_pasien}, terima kasih telah berbelanja di *Apotik Tamansari*. Berikut struk digital Anda untuk transaksi #{nomor_struk} total {total_belanja}. Semoga lekas sembuh!`,
    REFILL_REMINDER: `Yth. {nama_pasien}, pengingat dari *Apotik Tamansari*: Obat rutin Anda (*{nama_obat}*) diperkirakan habis dalam 3 hari ke depan. Silakan kunjungi apotek atau balas pesan ini untuk layanan antar obat ke rumah Anda. Sehat selalu!`,
    PROMO: `Kabar gembira untuk Member {nama_pasien}! Nikmati Promo Sehat Spesial Apotik Tamansari diskon hingga 15% untuk vitamin dan suplemen keluarga selama pekan ini. Tunjukkan pesan ini ke kasir.`,
  };

  const [messageLogs, setMessageLogs] = useState([
    {
      id: "LOG-WA-01",
      patient: "Budi Santoso",
      phone: "081234567890",
      type: "PENGINGAT TEBUS OBAT",
      message: "Pengingat obat rutin Amlodipine 10mg diperkirakan habis dalam 3 hari...",
      time: "Hari ini, 09:30",
      status: "DELIVERED",
    },
    {
      id: "LOG-WA-02",
      patient: "Ibu Ratna Dewi",
      phone: "081987654321",
      type: "STRUK DIGITAL POS",
      message: "Struk transaksi SL-TS-981240 total Rp 16.000 telah dikirim...",
      time: "Hari ini, 14:16",
      status: "DELIVERED",
    },
  ]);

  const activeTemplateText =
    templates[selectedTemplate as keyof typeof templates]
      .replace("{nama_pasien}", patientName)
      .replace("{nomor_struk}", "SL-TS-981240")
      .replace("{total_belanja}", "Rp 54.000")
      .replace("{nama_obat}", medicineName);

  const handleSendWA = () => {
    const newLog = {
      id: `LOG-WA-${Date.now().toString().slice(-4)}`,
      patient: patientName,
      phone: selectedPhone,
      type: selectedTemplate,
      message: activeTemplateText,
      time: "Baru saja",
      status: "DELIVERED",
    };
    setMessageLogs([newLog, ...messageLogs]);
    alert(`Pesan WhatsApp berhasil dikirim ke ${patientName} (${selectedPhone}) via Fonnte Gateway!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            WhatsApp Marketing & Pengingat Pasien (CRM)
          </h1>
          <p className="text-xs text-slate-500">
            Kirim struk digital, blast promo member, dan pengingat tebus obat kronis langsung ke nomor WA pasien.
          </p>
        </div>

        <Badge variant="success" className="text-xs px-3 py-1">
          Gateway Fonnte: Online &bull; Kuota: 1.450 Pesan
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Composer */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">
                Kirim Pesan WhatsApp Pasien
              </CardTitle>
              <CardDescription>
                Pilih jenis template dan sesuaikan data pasien tujuan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Template tabs */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Pilih Template Pesan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "REFILL_REMINDER", label: "Pengingat Obat" },
                    { id: "RECEIPT", label: "Struk Digital" },
                    { id: "PROMO", label: "Broadcast Promo" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        selectedTemplate === t.id
                          ? "bg-green-50 border-green-600 text-green-800 ring-1 ring-green-500"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 block">Pilih Pasien / Member:</label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddPatient()}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      + Tambah Pasien
                    </button>
                  </div>
                  <SearchableCombobox
                    iconType="user"
                    placeholder="-- Cari nama atau no HP pasien --"
                    searchPlaceholder="Cari nama atau nomor WhatsApp..."
                    emptyText="Pasien belum terdaftar"
                    addNewButtonText="Tambah Pasien Baru"
                    onAddNew={(q) => handleOpenAddPatient(q)}
                    value={selectedPhone}
                    onChange={(phone) => {
                      setSelectedPhone(phone);
                      const found = customers.find((c) => c.phone === phone);
                      if (found) setPatientName(found.name);
                    }}
                    options={customers.map((c) => ({
                      value: c.phone,
                      label: c.name,
                      description: `WA: ${c.phone} • Member ${c.tier}`,
                    }))}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Pasien di Pesan:</label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="Nama panggilan di pesan WA"
                  />
                </div>
              </div>

              {selectedTemplate === "REFILL_REMINDER" && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Obat Rutin / Kronis:
                  </label>
                  <Input
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="h-9 font-medium text-emerald-800"
                  />
                </div>
              )}

              {/* Preview Message */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Preview Teks Pesan WhatsApp:
                </label>
                <div className="p-3 bg-green-50/70 border border-green-200 rounded-xl text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                  {activeTemplateText}
                </div>
              </div>

              <Button
                onClick={handleSendWA}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-md"
              >
                <Send className="mr-2 h-4 w-4" />
                Kirim Pesan WhatsApp Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Log: Delivery History */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800">
                Log Riwayat Pesan WhatsApp Terkirim
              </CardTitle>
              <CardDescription>
                Pelacakan status pengiriman pesan otomatis ke pasien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messageLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{log.patient}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span>{log.phone}</span>
                      <Badge variant="cyan" className="text-[9px]">
                        {log.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                      &ldquo;{log.message}&rdquo;
                    </p>
                    <div className="pt-1 border-t flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Gateway: Fonnte Cloud</span>
                      <span className="text-green-700 font-bold flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5" />
                        Tersampaikan (Delivered)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: TAMBAH PASIEN LANGSUNG */}
      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent onClose={() => setIsAddPatientOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Tambah Kontak Pasien Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan kontak WhatsApp pasien untuk pengiriman pengingat obat atau promo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewPatient} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Pasien / Pelanggan *
              </label>
              <Input
                required
                placeholder="Contoh: Ibu Fatimah"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <Input
                required
                placeholder="0812-xxxx-xxxx"
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPatientOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                Simpan & Pilih Pasien
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
