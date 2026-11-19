"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Clock,
  UserCheck,
  AlertTriangle,
  ShoppingBag,
  Menu,
  ChevronDown,
  Building2,
  Check,
  Pill,
  Sparkles,
  ArrowRightLeft,
  Store,
  LogOut,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBusinessStore, BusinessType } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";
import { useSidebarStore } from "@/lib/sidebar-store";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeBusiness, availableBusinesses, switchBusiness, platformName } = useBusinessStore();
  const { user, logout } = useAuth();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: F2 untuk fokus ke pencarian cepat
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isPharmacy = activeBusiness.type === "PHARMACY";

  const handleSwitch = (slug: string) => {
    switchBusiness(slug);
    setShowBusinessMenu(false);
    if (pathname?.startsWith("/b/")) {
      const parts = pathname.split("/");
      parts[2] = slug;
      router.push(parts.join("/"));
    }
  };

  return (
    <header className="h-16 border-b bg-white sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-xs">
      {/* Left: Strip Tiga (Sidebar Toggle) + Multi-Business Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Tombol Strip Tiga / Hamburger Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 shadow-2xs ${
            isSidebarOpen
              ? "bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400"
              : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-300"
          }`}
          title={isSidebarOpen ? "Tutup Menu Navigasi" : "Buka Menu Navigasi (Sidebar)"}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile View */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            className="flex items-center space-x-2 text-left"
          >
            <div
              className={`p-1.5 rounded-lg text-white ${
                isPharmacy ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {isPharmacy ? <Pill className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm leading-tight block truncate max-w-[140px]">
                {activeBusiness.name}
              </span>
              <span
                className={`text-[9px] font-semibold ${
                  isPharmacy ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {activeBusiness.typeLabel}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Desktop Business Selector Switcher */}
        <div className="hidden lg:block relative">
          <button
            onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            className={`flex items-center space-x-3 px-3 py-1.5 rounded-xl border transition-all text-left group ${
              isPharmacy
                ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300"
                : "bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs ${
                isPharmacy ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {isPharmacy ? <Pill className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {platformName}
                </span>
                <span
                  className={`text-[9px] px-1 py-0 rounded font-semibold uppercase ${
                    isPharmacy
                      ? "bg-emerald-200 text-emerald-800"
                      : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {activeBusiness.role}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-slate-800">
                  {activeBusiness.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </div>
            </div>
          </button>

          {/* Business Switcher Dropdown */}
          {showBusinessMenu && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Pilih Unit Bisnis
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    2 Unit Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Platform Multi-Business: ERP & POS Terintegrasi
                </p>
              </div>

              <div className="space-y-1.5">
                {availableBusinesses.map((biz) => {
                  const isCurrent = activeBusiness.id === biz.id;
                  const isBizPharm = biz.type === "PHARMACY";
                  return (
                    <button
                      key={biz.id}
                      onClick={() => handleSwitch(biz.slug)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between border ${
                        isCurrent
                          ? isBizPharm
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                            : "bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs"
                          : "border-transparent hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs ${
                            isBizPharm ? "bg-emerald-600" : "bg-amber-600"
                          }`}
                        >
                          {isBizPharm ? <Pill className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold">{biz.name}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                isBizPharm
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {biz.typeLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {biz.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>Role: <strong className="text-slate-600">{biz.role}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              Omset: {formatRupiah(biz.stats.todaySales)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <div
                          className={`p-1 rounded-full text-white shrink-0 mt-1 ${
                            isBizPharm ? "bg-emerald-600" : "bg-amber-600"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                  Pindah unit mengubah konteks data secara instan
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Quick Search */}
        <div className="hidden xl:flex items-center w-72 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              isPharmacy
                ? "Cari obat, resep, atau barcode (F2)..."
                : "Cari mainan, kode rak, atau barcode (F2)..."
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            F2
          </kbd>
        </div>
      </div>

      {/* Right Action Section */}
      <div className="flex items-center space-x-3">
        {/* Kasir Register Status (Continuous - Transaksi Berjalan Terus) */}
        <Link
          href={
            pathname?.startsWith("/b/")
              ? `/b/${activeBusiness.slug}/pos`
              : "/pos"
          }
          className={`hidden sm:flex items-center rounded-lg px-2.5 py-1.5 space-x-2 border transition-all hover:shadow-xs ${
            isPharmacy
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70"
              : "bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100/70"
          }`}
          title="POS Kasir Aktif - Transaksi Berjalan Terus Menerus"
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isPharmacy ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <div className="text-left text-xs">
            <span className="font-bold block leading-tight text-[11px]">
              Kasir Aktif
            </span>
            <span className="text-[10px] text-slate-500">
              Transaksi Berjalan Terus
            </span>
          </div>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {isPharmacy ? "3" : "1"}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border p-3 z-50 animate-in fade-in-50">
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                <span className="font-semibold text-xs text-slate-800">
                  Notifikasi {activeBusiness.name}
                </span>
                <Badge variant="destructive" className="text-[10px]">
                  {isPharmacy ? "3 Peringatan" : "1 Peringatan"}
                </Badge>
              </div>
              <div className="space-y-2 text-xs">
                {isPharmacy ? (
                  <>
                    <Link
                      href={
                        pathname?.startsWith("/b/")
                          ? `/b/${activeBusiness.slug}/laporan/stok-alert`
                          : "/laporan/stok-alert"
                      }
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 bg-rose-50 hover:bg-rose-100/80 transition-colors border border-rose-200 rounded-lg flex items-start space-x-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-900 text-[11px]">Antasida Doen Kedaluwarsa</p>
                        <p className="text-[10px] text-rose-700">Batch ATD-2024-K1 expired dalam 16 hari! &bull; Klik periksa</p>
                      </div>
                    </Link>
                    <Link
                      href={
                        pathname?.startsWith("/b/")
                          ? `/b/${activeBusiness.slug}/laporan/stok-alert`
                          : "/laporan/stok-alert"
                      }
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 bg-amber-50 hover:bg-amber-100/80 transition-colors border border-amber-200 rounded-lg flex items-start space-x-2"
                    >
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-[11px]">Sanmol 500mg Batch 24A</p>
                        <p className="text-[10px] text-amber-700">Expired 10 Des 2026 (H-26 hari) &bull; Klik restock</p>
                      </div>
                    </Link>
                    <Link
                      href={
                        pathname?.startsWith("/b/")
                          ? `/b/${activeBusiness.slug}/online-orders`
                          : "/online-orders"
                      }
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 bg-blue-50 hover:bg-blue-100/80 transition-colors border border-blue-200 rounded-lg flex items-start space-x-2"
                    >
                      <ShoppingBag className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 text-[11px]">Order Baru Webstore Apotik Tamansari</p>
                        <p className="text-[10px] text-blue-700">Pesanan ORD-WEB-001 siap diproses ke POS</p>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={
                        pathname?.startsWith("/b/")
                          ? `/b/${activeBusiness.slug}/laporan/stok-alert`
                          : "/laporan/stok-alert"
                      }
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 bg-amber-50 hover:bg-amber-100/80 transition-colors border border-amber-200 rounded-lg flex items-start space-x-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-[11px]">Stok Mobil RC Menipis</p>
                        <p className="text-[10px] text-amber-700">Sisa 2 Pcs di rak pajang, segera reorder ke DMC</p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                isPharmacy ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold text-slate-800 block leading-tight truncate max-w-[120px]">
                {user?.name || "Pegawai"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {user?.role || activeBusiness.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border p-2 z-50 animate-in fade-in-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || "Pengguna Aktif"}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user?.email || "user@gigin.com"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="success" className="text-[9px] px-1.5 py-0 font-bold">
                    {user?.role || activeBusiness.role}
                  </Badge>
                  <span className="text-[10px] text-slate-400">Akun Aktif</span>
                </div>
              </div>

              {/* Portal Owner Link if OWNER */}
              {user?.role === "OWNER" && (
                <div className="py-1 border-b mb-1">
                  <Link
                    href="/hub"
                    onClick={() => setShowRoleMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center gap-2 text-indigo-700 hover:bg-indigo-50 font-medium transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Buka Portal Utama Owner</span>
                  </Link>
                </div>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  setShowRoleMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-bold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar (Logout Sesi)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
