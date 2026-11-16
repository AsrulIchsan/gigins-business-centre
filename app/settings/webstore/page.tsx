"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sliders,
  Save,
  Truck,
  CreditCard,
  QrCode,
  Phone,
  Clock,
  Sparkles,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Store,
  RefreshCw,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import {
  DEFAULT_WEBSTORE_SETTINGS,
  DEFAULT_QRIS_SVG,
  WebstoreSettings,
  getLocalStoreSettings,
  saveLocalStoreSettings,
} from "@/lib/store-settings";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/use-auth";

export default function WebstoreSettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [settings, setSettings] = useState<WebstoreSettings>(() => getLocalStoreSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"SHIPPING" | "PAYMENT" | "CONTACT" | "BANNER">("SHIPPING");

  // Load from API on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/store/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
          saveLocalStoreSettings(data.settings);
        }
      })
      .catch((err) => console.warn("Failed to load settings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Handle QRIS Photo Upload
  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih berkas foto / gambar (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setSettings((prev) => ({
        ...prev,
        payment: {
          ...prev.payment,
          qrisImageUrl: base64Data,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Reset QRIS
  const handleResetQris = () => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        qrisImageUrl: DEFAULT_QRIS_SVG,
      },
    }));
  };

  // Save changes to API & local storage
  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/store/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        saveLocalStoreSettings(settings);
        setSuccessMsg("Pengaturan Webstore berhasil disimpan dan langsung diterapkan ke seluruh etalase pelanggan!");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        alert(data.message || "Gagal menyimpan pengaturan.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" className="text-[10px] font-bold">
              MODUL KHUSUS OWNER
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Apotik Tamansari</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-emerald-600" />
            Pengaturan & Kontrol Webstore
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola tarif ongkos kirim, upload foto QRIS, rekening pembayaran, nomor WhatsApp, dan jam operasional webstore.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/store" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              <Store className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Buka Webstore (store.) <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={saving}
            onClick={handleSaveSettings}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            <Save className={`mr-1.5 h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: "SHIPPING", label: "Ongkir & Kurir Pengantaran", icon: Truck },
          { key: "PAYMENT", label: "Metode Pembayaran & QRIS", icon: QrCode },
          { key: "CONTACT", label: "WhatsApp & Jam Apotek", icon: Phone },
          { key: "BANNER", label: "Banner & Status Toko", icon: Sparkles },
        ].map((t) => {
          const isActive = activeTab === t.key;
          const TabIcon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ONGKIR & KURIR */}
      {activeTab === "SHIPPING" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-600" />
                Tarif Ongkos Kirim & Layanan Pengantaran
              </CardTitle>
              <CardDescription className="text-xs">
                Atur tarif yang dibebankan kepada pelanggan saat memilih metode pengiriman di checkout
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Kurir Instan */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Kurir Instan Apotik (1-2 Jam)</span>
                      <p className="text-[10px] text-slate-500">GoSend / GrabExpress langsung dari apotek</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shipping.instantEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, instantEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Aktifkan</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Label Layanan:</label>
                    <Input
                      type="text"
                      value={settings.shipping.instantLabel}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, instantLabel: e.target.value },
                        }))
                      }
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tarif Ongkir (Rp):</label>
                    <Input
                      type="number"
                      value={settings.shipping.instantRate}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, instantRate: Number(e.target.value) },
                        }))
                      }
                      className="h-9 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Kurir Reguler */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Ekspedisi Reguler (1-2 Hari)</span>
                      <p className="text-[10px] text-slate-500">J&T / SiCepat dengan nomor resi</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shipping.regularEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, regularEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Aktifkan</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Label Layanan:</label>
                    <Input
                      type="text"
                      value={settings.shipping.regularLabel}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, regularLabel: e.target.value },
                        }))
                      }
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tarif Ongkir (Rp):</label>
                    <Input
                      type="number"
                      value={settings.shipping.regularRate}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          shipping: { ...prev.shipping, regularRate: Number(e.target.value) },
                        }))
                      }
                      className="h-9 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Promo Gratis Ongkir */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Promo Gratis Ongkir Otomatis:
                </span>
                <p className="text-[11px] text-emerald-800">
                  Pelanggan akan otomatis mendapatkan gratis ongkir jika total keranjang belanjanya mencapai batas minimal:
                </p>
                <div className="max-w-xs pt-1">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Batas Minimal Belanja Gratis Ongkir (Rp):
                  </label>
                  <Input
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shipping: { ...prev.shipping, freeShippingThreshold: Number(e.target.value) },
                      }))
                    }
                    className="h-9 text-xs font-mono bg-white rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    (Masukkan 0 untuk menonaktifkan gratis ongkir)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: METODE PEMBAYARAN & UPLOAD FOTO QRIS */}
      {activeTab === "PAYMENT" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-purple-600" />
                Upload Foto QRIS & Rekening Pembayaran
              </CardTitle>
              <CardDescription className="text-xs">
                Upload foto barcode QRIS resmi apotek dan rekening bank yang akan ditampilkan ke pelanggan saat checkout
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-xs">
              {/* SECTION: QRIS UPLOADER */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm">Pembayaran QRIS Instan</span>
                      <p className="text-[10px] text-slate-500">Mendukung BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, Dana</p>
                    </div>
                  </div>
                  <Badge variant="cyan" className="text-[10px]">Aktif</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                  {/* Left: Preview QRIS */}
                  <div className="md:col-span-5 text-center">
                    <div className="p-3 bg-white rounded-2xl border border-purple-200 shadow-sm inline-block max-w-[220px]">
                      <img
                        src={settings.payment.qrisImageUrl}
                        alt="Preview QRIS Toko"
                        className="w-48 h-48 object-contain rounded-lg mx-auto"
                      />
                      <p className="text-[10px] text-slate-500 font-mono mt-2 truncate">
                        NMID: <b>{settings.payment.qrisNmid}</b>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Tampilan live yang dilihat customer di checkout
                    </span>
                  </div>

                  {/* Right: Upload Controls */}
                  <div className="md:col-span-7 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrisUpload}
                      className="hidden"
                    />

                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">
                        Ganti Foto Barcode QRIS Apotek:
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Anda dapat mengunggah file foto QRIS resmi dari bank atau aplikasi merchant apotek (BCA Merchant, Mandiri, GoBiz, dll).
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold"
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          Pilih File Foto QRIS Baru
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetQris}
                          className="text-xs text-slate-600 border-slate-300"
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          Kembali ke QRIS Default
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Nomor NMID QRIS (Nasional):
                      </label>
                      <Input
                        type="text"
                        value={settings.payment.qrisNmid}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            payment: { ...prev.payment, qrisNmid: e.target.value },
                          }))
                        }
                        placeholder="Contoh: ID1020039281726"
                        className="h-9 text-xs font-mono rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: TRANSFER BANK */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Transfer Bank Manual</span>
                      <p className="text-[10px] text-slate-500">Nomor rekening resmi penerimaan pembayaran apotek</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payment.bankTransferEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payment: { ...prev.payment, bankTransferEnabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Aktifkan</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nama Bank:</label>
                    <Input
                      type="text"
                      value={settings.payment.bankName}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payment: { ...prev.payment, bankName: e.target.value },
                        }))
                      }
                      placeholder="Contoh: BCA"
                      className="h-9 text-xs rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nomor Rekening:</label>
                    <Input
                      type="text"
                      value={settings.payment.bankAccountNumber}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payment: { ...prev.payment, bankAccountNumber: e.target.value },
                        }))
                      }
                      placeholder="Contoh: 777-089-1234"
                      className="h-9 text-xs font-mono rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Atas Nama (Pemilik):</label>
                    <Input
                      type="text"
                      value={settings.payment.bankAccountName}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payment: { ...prev.payment, bankAccountName: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Apotik Tamansari"
                      className="h-9 text-xs rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: COD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Bayar di Tempat (COD / Tunai)</span>
                  <p className="text-[10px] text-slate-500">
                    Pelanggan membayar secara tunai langsung ke kurir saat obat tiba di rumah
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.payment.codEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        payment: { ...prev.payment, codEnabled: e.target.checked },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Aktifkan</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: WHATSAPP & OPERASIONAL */}
      {activeTab === "CONTACT" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                Nomor WhatsApp & Jam Operasional Apotek
              </CardTitle>
              <CardDescription className="text-xs">
                Kontak yang dihubungi oleh pelanggan webstore untuk tebus resep dan tanya apoteker
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp Resmi Apotek:
                  </label>
                  <Input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    placeholder="Contoh: 08122334455"
                    className="h-9 text-xs font-mono rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nomor tujuan tombol "Konsultasi Apoteker" dan konfirmasi pesanan webstore.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jam Operasional Apotek:
                  </label>
                  <Input
                    type="text"
                    value={settings.operatingHours}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, operatingHours: e.target.value }))
                    }
                    placeholder="Contoh: 07.00 - 22.00 WIB"
                    className="h-9 text-xs rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ditampilkan di bagian atas header dan footer etalase webstore.
                  </p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Alamat Lengkap Apotek (Titik Pengambilan Pick-Up):
                </label>
                <Input
                  type="text"
                  value={settings.pharmacyAddress}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, pharmacyAddress: e.target.value }))
                  }
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor Izin Apoteker (SIPA):
                </label>
                <Input
                  type="text"
                  value={settings.sipaNumber}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, sipaNumber: e.target.value }))
                  }
                  className="h-9 text-xs font-mono rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: BANNER & STATUS */}
      {activeTab === "BANNER" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Banner Promo & Status Buka/Tutup Webstore
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Status Operasional Webstore</span>
                  <p className="text-[10px] text-slate-500">
                    Buka atau tutup sementara penerimaan pesanan online pelanggan
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isStoreOpen}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, isStoreOpen: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                  />
                  <span className="text-[11px] font-bold text-emerald-700">
                    {settings.isStoreOpen ? "Buka (Menerima Order)" : "Tutup Sementara"}
                  </span>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Teks Pengumuman Promo Berjalan:
                </label>
                <textarea
                  rows={3}
                  value={settings.banner.text}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      banner: { ...prev.banner, text: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
