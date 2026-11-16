"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  MapPin,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Pill,
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StoreRegisterPage() {
  const router = useRouter();
  const { registerCustomer, isLoggedIn, customer, cartCount } = useStore();

  // Form states — ONLY VITAL DATA + Password
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState(""); // Opsional (tidak wajib)
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{
    name: string;
    memberCode: string;
    points: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi data vital
    if (!name.trim()) {
      setErrorMsg("Nama Lengkap wajib diisi.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Nomor HP / WhatsApp aktif wajib diisi.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Alamat lengkap pengiriman wajib diisi.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg("Kata sandi minimal 4 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim() || undefined, // Opsional
        password: password.trim(),
      });

      if (res.success && res.customer) {
        setSuccessData({
          name: res.customer.name,
          memberCode: res.customer.memberCode,
          points: res.customer.points,
        });
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  // Jika sudah terdaftar / sukses
  if (successData || (isLoggedIn && customer)) {
    const activeCust = successData || customer!;
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="border-emerald-200 bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">Pendaftaran Berhasil!</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Akun Member Apotik Tamansari Anda telah aktif
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Nama Pasien:</span>
                <span className="font-bold text-slate-800">{activeCust.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Nomor Kartu Member:</span>
                <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {activeCust.memberCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Saldo Poin Selamat Datang:</span>
                <span className="font-bold text-teal-700">+{activeCust.points} Poin</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Keuntungan Member Anda:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
                <li>Alamat pengantaran otomatis terisi saat pesan obat.</li>
                <li>Poin belanja dapat ditukarkan potongan harga.</li>
                <li>Riwayat pembelian dan resep tersimpan aman.</li>
              </ul>
            </div>

            <div className="pt-2 space-y-2">
              {cartCount > 0 ? (
                <Link href="/store/checkout" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs py-5">
                    Lanjutkan ke Checkout ({cartCount} Obat) <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/store" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs py-5">
                    Mulai Belanja Obat di Etalase <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Page Title Card */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Pill className="h-3.5 w-3.5 text-emerald-600" />
          Registrasi Pasien & Member Webstore
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Buat Akun Pelanggan Baru
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Cukup isi data vital yang diperlukan untuk pengantaran obat dan notifikasi pesanan dari apoteker kami.
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Formulir Pendaftaran Cepat
              </CardTitle>
              <CardDescription className="text-xs">
                Data vital pengiriman & kontak apotek
              </CardDescription>
            </div>
            <Badge variant="cyan" className="text-[10px]">
              Instan & Tanpa Ribet
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Field 1: Nama Lengkap (Wajib) */}
            <div>
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  Nama Lengkap Pasien / Pemesan
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
              </label>
              <Input
                type="text"
                required
                placeholder="Contoh: Ibu Rina Marlina"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-xs rounded-xl focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nama yang akan dicetak pada label etiket resep dan paket pengiriman.
              </p>
            </div>

            {/* Field 2: Nomor Handphone / WhatsApp (Wajib) */}
            <div>
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  Nomor HP / WhatsApp Aktif
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
              </label>
              <Input
                type="tel"
                required
                placeholder="Contoh: 08122334455"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs font-mono rounded-xl focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Krusial untuk konfirmasi ketersediaan obat, aturan pakai oleh apoteker, dan koordinasi kurir.
              </p>
            </div>

            {/* Field 3: Alamat Lengkap Pengiriman (Wajib) */}
            <div>
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Alamat Lengkap Pengiriman Obat
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, patokan lokasi..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Tujuan pengantaran kurir instan / reguler ke rumah Anda.
              </p>
            </div>

            {/* Field 4: Email (Opsional - Tidak Wajib) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  Alamat Email
                </span>
                <Badge variant="secondary" className="text-[9px] bg-slate-200 text-slate-700 font-semibold">
                  (Opsional / Tidak Wajib)
                </Badge>
              </label>
              <Input
                type="email"
                placeholder="nama@email.com (boleh dikosongkan)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs rounded-xl bg-white focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Opsional untuk menerima bukti faktur digital. Anda tetap bisa mendaftar tanpa mengisi email.
              </p>
            </div>

            {/* Field 5: Kata Sandi (Wajib untuk login) */}
            <div>
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Kata Sandi Akun
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
              </label>
              <Input
                type="password"
                required
                placeholder="Minimal 4 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs rounded-xl focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Gunakan sandi ini saat masuk kembali ke Webstore Apotik Tamansari.
              </p>
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5 text-[11px] text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Data Anda dilindungi protokol privasi medis Apotik Tamansari dan tidak akan disebarluaskan.
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? "Mendaftarkan Akun..." : "Daftar Akun Member Apotek Sekarang"}
            </Button>
          </form>

          {/* Login Option */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Sudah punya akun member sebelumnya?{" "}
            <Link href="/store/login" className="text-emerald-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
