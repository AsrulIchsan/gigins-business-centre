"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Users,
  BarChart3,
  BookOpenCheck,
  Smartphone,
  RotateCcw,
  Boxes,
  Truck,
  MessageSquare,
  Globe,
  Settings,
  Store,
  Tag,
  PackageCheck,
  ScanBarcode,
  Building2,
  ShieldCheck,
  History,
  LogOut,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useBusinessStore } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";
import { useSidebarStore } from "@/lib/sidebar-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isMobileSpecial?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeBusiness, platformName } = useBusinessStore();
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebarStore();
  const isPharmacy = activeBusiness.type === "PHARMACY";

  // Dynamic Navigation Sections based on Business Type
  const navigationSections: NavSection[] = isPharmacy
    ? [
        {
          title: "OPERASIONAL UTAMA",
          items: [
            { title: "Dashboard Overview", href: "/", icon: LayoutDashboard },
            { title: "Kasir POS (Desktop)", href: "/pos", icon: ShoppingCart },
            { title: "Kasir POS Mobile (HP)", href: "/pos/mobile", icon: Smartphone, badge: "HP/Cam", isMobileSpecial: true },
            { title: "Retur Penjualan", href: "/pos/retur", icon: RotateCcw },
          ],
        },
        {
          title: "MASTER DATA & INVENTORY",
          items: [
            { title: "Master Data Obat", href: "/master/obat", icon: Pill },
            { title: "Kartu Stok & FIFO Batch", href: "/inventory/kartu-stok", icon: Boxes },
            { title: "Stok Opname Mobile", href: "/inventory/opname", icon: Smartphone, badge: "HP", isMobileSpecial: true },
            { title: "Obat Konsinyasi & Bagi Hasil", href: "/inventory/konsinyasi", icon: ShoppingBag },
          ],
        },
        {
          title: "PEMBELIAN & PBF",
          items: [
            { title: "Purchase Order (PO PBF)", href: "/pembelian/po", icon: Truck },
            { title: "Penerimaan Faktur PBF", href: "/pembelian/faktur", icon: ShoppingBag },
            { title: "Penerimaan Faktur (HP)", href: "/pembelian/mobile", icon: Smartphone, badge: "HP", isMobileSpecial: true },
            { title: "Retur Pembelian PBF", href: "/pembelian/retur", icon: RotateCcw },
          ],
        },
        {
          title: "CRM & INTEGRASI ONLINE",
          items: [
            { title: "Member & Promo", href: "/crm/member", icon: Users },
            { title: "WhatsApp Marketing", href: "/crm/whatsapp", icon: MessageSquare, badge: "WA" },
            { title: "Pesanan Online (Vmedis/Klik)", href: "/online-orders", icon: Globe, badge: "3 Baru" },
          ],
        },
        {
          title: "LAPORAN & AKUNTANSI",
          items: [
            { title: "Laporan Shift Kasir", href: "/laporan/shift", icon: BarChart3 },
            { title: "Peringatan Expired & Habis", href: "/laporan/stok-alert", icon: Pill, badge: "Penting" },
            { title: "Smart Forecasting & Harga", href: "/laporan/analitik", icon: BarChart3 },
            { title: "Akuntansi & Jurnal Umum", href: "/akuntansi/jurnal", icon: BookOpenCheck },
            { title: "Laba Rugi & Neraca", href: "/akuntansi/laporan", icon: BookOpenCheck },
          ],
        },
        {
          title: "PORTAL & KEAMANAN (OWNER)",
          items: [
            { title: "Portal Utama Gigin's Hub", href: "/hub", icon: Building2, badge: "Hub" },
            { title: "Role & Access Control", href: "/hub/access-control", icon: ShieldCheck, badge: "RBAC" },
            { title: "Login & Audit Logs", href: "/hub/audit-logs", icon: History, badge: "Log" },
          ],
        },
      ]
    : [
        {
          title: "OPERASIONAL TOKO MAINAN",
          items: [
            { title: "Dashboard Overview", href: "/", icon: LayoutDashboard },
            { title: "Kasir POS Mainan (Desktop)", href: "/pos", icon: ShoppingCart },
            { title: "Kasir HP (Scan Barcode)", href: "/pos/mobile", icon: Smartphone, badge: "HP/Cam", isMobileSpecial: true },
            { title: "Retur Penjualan", href: "/pos/retur", icon: RotateCcw },
          ],
        },
        {
          title: "KATALOG MAINAN & GUDANG",
          items: [
            { title: "Master Produk Mainan", href: "/master/obat", icon: Tag },
            { title: "Kartu Stok & Rak Toko", href: "/inventory/kartu-stok", icon: Boxes },
            { title: "Stok Opname Cepat (HP)", href: "/inventory/opname", icon: Smartphone, badge: "HP", isMobileSpecial: true },
          ],
        },
        {
          title: "PEMBELIAN & DISTRIBUTOR",
          items: [
            { title: "Purchase Order (PO Grosir)", href: "/pembelian/po", icon: Truck },
            { title: "Penerimaan Barang Toko", href: "/pembelian/faktur", icon: ShoppingBag },
            { title: "Penerimaan Barang (HP)", href: "/pembelian/mobile", icon: Smartphone, badge: "HP", isMobileSpecial: true },
            { title: "Retur ke Supplier", href: "/pembelian/retur", icon: RotateCcw },
          ],
        },
        {
          title: "CRM & PELANGGAN TOKO",
          items: [
            { title: "Member & Diskon Pelanggan", href: "/crm/member", icon: Users },
            { title: "WhatsApp Promo Mainan", href: "/crm/whatsapp", icon: MessageSquare, badge: "WA" },
          ],
        },
        {
          title: "KEUANGAN & AKUNTANSI",
          items: [
            { title: "Laporan Kas Kasir", href: "/laporan/shift", icon: BarChart3 },
            { title: "Peringatan Stok Menipis", href: "/laporan/stok-alert", icon: PackageCheck, badge: "Alert" },
            { title: "Analisis Margin & Best-Seller", href: "/laporan/analitik", icon: BarChart3 },
            { title: "Jurnal Pembukuan", href: "/akuntansi/jurnal", icon: BookOpenCheck },
            { title: "Laba Rugi & Neraca", href: "/akuntansi/laporan", icon: BookOpenCheck },
          ],
        },
        {
          title: "PORTAL & KEAMANAN (OWNER)",
          items: [
            { title: "Portal Utama Gigin's Hub", href: "/hub", icon: Building2, badge: "Hub" },
            { title: "Role & Access Control", href: "/hub/access-control", icon: ShieldCheck, badge: "RBAC" },
            { title: "Login & Audit Logs", href: "/hub/audit-logs", icon: History, badge: "Log" },
          ],
        },
      ];

  return (
    <>
      {/* Backdrop overlay saat sidebar terbuka */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs z-40 transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Drawer Sidebar (Default Tertutup, Slide-in saat Strip Tiga Diklik) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col border-r bg-white text-slate-700 shadow-2xl transition-transform duration-300 ease-in-out flex",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Dynamic Brand Header dengan Tombol Tutup (Strip Tiga / X) */}
        <div
          className={`h-16 flex items-center justify-between px-4 border-b text-white transition-colors duration-300 ${
            isPharmacy ? "bg-emerald-700" : "bg-gradient-to-r from-amber-600 to-orange-600"
          }`}
        >
          <div className="flex items-center space-x-3 truncate">
            <div className="bg-white/15 p-2 rounded-xl border border-white/20 shrink-0 shadow-xs">
              {isPharmacy ? (
                <Pill className="h-5 w-5 text-emerald-100" />
              ) : (
                <Store className="h-5 w-5 text-amber-100" />
              )}
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm tracking-tight leading-tight text-white truncate">
                {activeBusiness.name}
              </h1>
              <p className="text-[10px] text-white/80 mt-0.5 truncate flex items-center gap-1 font-medium">
                <span>{platformName}</span>
              </p>
            </div>
          </div>

          {/* Tombol Tutup Sidebar */}
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
            title="Tutup Menu Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navigationSections
            .filter((section) => {
              // Sembunyikan bagian portal owner jika bukan akun OWNER
              if (section.title.includes("PORTAL & KEAMANAN") && user?.role !== "OWNER") {
                return false;
              }
              return true;
            })
            .map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                {section.title}
              </h4>
              {section.items.map((item) => {
                const isDynamicRoute = pathname?.startsWith("/b/");
                const currentSlug = activeBusiness.slug;
                const targetHref = item.href.startsWith("/hub") || item.href.startsWith("/login")
                  ? item.href
                  : isDynamicRoute
                    ? item.href === "/"
                      ? `/b/${currentSlug}/dashboard`
                      : `/b/${currentSlug}${item.href}`
                    : item.href;
                const isActive = isDynamicRoute
                  ? pathname === targetHref
                  : pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    onClick={() => close()}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? isPharmacy
                          ? "bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-100"
                          : "bg-amber-50 text-amber-900 font-bold shadow-xs border border-amber-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors shrink-0",
                        isActive
                          ? isPharmacy
                            ? "text-emerald-700"
                            : "text-amber-700"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={item.isMobileSpecial ? "cyan" : "secondary"}
                      className="text-[9px] px-1.5 py-0 h-4 font-normal shrink-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Logged-in User Profile & Working Logout Footer */}
      <div className="p-3 border-t bg-slate-50 text-[11px] text-slate-600 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="truncate text-left">
              <p className="font-bold text-slate-800 text-xs truncate leading-tight">
                {user?.name || "Staff Aktif"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] px-1.5 py-0 rounded font-bold uppercase ${
                    user?.role === "OWNER"
                      ? "bg-purple-100 text-purple-800"
                      : isPharmacy
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {user?.role || activeBusiness.role}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.email || "Online"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            title="Keluar / Logout Sesi"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
