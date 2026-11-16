"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Pill,
  ShoppingCart,
  User,
  Phone,
  ShieldCheck,
  Clock,
  MapPin,
  ExternalLink,
  LogOut,
  Sparkles,
  ChevronRight,
  Globe,
  Info,
  CheckCircle,
} from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function StoreNavbar() {
  const pathname = usePathname();
  const { customer, isLoggedIn, cartCount, logoutCustomer } = useStore();
  const [isSubdomainModalOpen, setIsSubdomainModalOpen] = useState(false);

  return (
    <>
      {/* Top Banner: Pharmacy Credentials & Operating Hours */}
      <div className="bg-emerald-900 text-emerald-100 text-[11px] sm:text-xs py-1.5 px-4 border-b border-emerald-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              Apotik Tamansari Resmi Berizin &bull; SIPA: 19850412/SIPA-32.73/2022/2001
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Buka Setiap Hari: 07.00 - 22.00 WIB
            </span>
            <span className="hidden md:inline-block opacity-40">|</span>
            <a
              href="https://wa.me/628122334455?text=Halo%20Apoteker%20Tamansari,%20saya%20ingin%20konsultasi%20obat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 text-emerald-300 font-semibold"
            >
              <Phone className="h-3 w-3 text-emerald-400" /> Konsultasi Apoteker (WA)
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Subdomain Badge */}
          <div className="flex items-center gap-3">
            <Link href="/store" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Pill className="h-5 w-5 rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-800">
                    APOTIK TAMANSARI
                  </span>
                  <Badge variant="cyan" className="text-[9px] py-0 px-1.5 font-bold uppercase">
                    Webstore
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Toko Obat & Layanan Antar Resep Farmasi
                </p>
              </div>
            </Link>

            {/* Subdomain pill button */}
            <button
              onClick={() => setIsSubdomainModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[11px] font-mono transition-colors"
              title="Informasi Subdomain Webstore"
            >
              <Globe className="h-3 w-3 text-emerald-600" />
              <span>store.apotiktamansari.com</span>
              <Info className="h-3 w-3 text-emerald-500" />
            </button>
          </div>

          {/* Right Action Icons: Customer Account & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Status / Login */}
            {isLoggedIn && customer ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 sm:px-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {customer.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-mono font-medium">
                    {customer.memberCode} &bull; {customer.points} Poin
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logoutCustomer}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Keluar dari akun"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/store/login">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                    Masuk
                  </Button>
                </Link>
                <Link href="/store/register">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <User className="mr-1.5 h-3.5 w-3.5" />
                    Buat Akun
                  </Button>
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <Link href="/store/checkout">
              <Button
                size="sm"
                className="relative bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 px-3"
              >
                <ShoppingCart className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Keranjang</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Subdomain Info Modal */}
      <Dialog open={isSubdomainModalOpen} onOpenChange={setIsSubdomainModalOpen}>
        <DialogContent onClose={() => setIsSubdomainModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Globe className="h-5 w-5" />
            </div>
            <DialogTitle>Konfigurasi Subdomain Webstore</DialogTitle>
            <DialogDescription>
              Webstore Apotik Tamansari telah disiapkan untuk berjalan pada subdomain resmi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-semibold text-slate-800">Alamat Subdomain Produksi:</p>
              <div className="font-mono text-emerald-700 bg-white p-2 rounded-lg border text-sm font-bold flex items-center justify-between">
                <span>https://store.apotiktamansari.com</span>
                <Badge variant="cyan" className="text-[10px]">Aktif di Middleware</Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                (Atau alternatif: <code>https://webstore.apotiktamansari.com</code>)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Subdomain Routing di Next.js:
              </p>
              <p className="text-[11px] leading-relaxed">
                Telah diintegrasikan di <code>middleware.ts</code> menggunakan header <code>host</code>. Setiap permintaan yang masuk ke <code>store.*</code> atau <code>webstore.*</code> langsung di-rewrite secara transparan ke halaman etalase publik tanpa campur tangan staf apotek.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-bold">Langkah DNS Domain Publik:</p>
              <p className="text-[11px] leading-relaxed">
                Di cPanel / Cloudflare DNS hosting Anda, cukup tambahkan <b>CNAME Record</b>:
                <br />
                <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-semibold">store</code> &rarr; mengarah ke domain server / Vercel apotek Anda.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Pill className="h-4 w-4" />
              </div>
              <span className="font-black text-white text-base tracking-tight">
                APOTIK TAMANSARI
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pelayanan kefarmasian terpercaya, obat resmi 100% dari PBF berizin, konsultasi apoteker gratis, dan pengantaran cepat ke seluruh wilayah.
            </p>
            <div className="pt-2 text-[11px] text-emerald-400 font-mono">
              SIPA: 19850412/SIPA-32.73/2022/2001
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Alamat & Jam Operasional</h4>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Jl. Tamansari No. 45, Coblong, Kota Bandung, Jawa Barat 40132</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Senin - Minggu: 07.00 - 22.00 WIB</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: 0812-2334-455 (Pesan & Antar)</span>
              </p>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Jaminan Keamanan & Kualitas</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 100% Produk Asli & Terdaftar BPOM
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Penyimpanan Suhu Terkontrol (FIFO)
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Pengawasan Apoteker Berizin (SIPA)
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Privasi Pasien Terjaga
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Akses & Manajemen</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Khusus staf, TTK, dan kasir Apotik Tamansari:
            </p>
            <div className="space-y-1.5">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full text-xs text-white border-slate-700 bg-slate-800 hover:bg-slate-700">
                  Login Staf Apotek / POS
                </Button>
              </Link>
              <Link href="/online-orders">
                <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-white">
                  Pantau Pesanan Online Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Apotik Tamansari. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="font-mono text-slate-600">
            Powered by Gigin's Business Centre &bull; Subdomain: store.apotiktamansari.com
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <StoreNavbar />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </StoreProvider>
  );
}
