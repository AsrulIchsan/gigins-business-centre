"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Smartphone,
  Pill,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Truck,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Globe,
  Receipt,
  Store,
  Tag,
  Package,
  Layers,
  Award,
  Flame,
} from "lucide-react";
import { ACTIVE_SHIFT, INITIAL_PRODUCTS, MOCK_ONLINE_ORDERS } from "@/lib/mock-data";
import { formatRupiah, getExpirationBadge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBusinessStore } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";

export default function DashboardPage() {
  const pathname = usePathname();
  const { activeBusiness, platformName } = useBusinessStore();
  const { user } = useAuth();
  const activeCashierName = user?.name || ACTIVE_SHIFT.cashierName;
  const bHref = (path: string) =>
    pathname?.startsWith("/b/") ? `/b/${activeBusiness.slug}${path}` : path;
  const isPharmacy = activeBusiness.type === "PHARMACY";

  // Calculate expired alert items for Pharmacy
  const expiredAlerts = INITIAL_PRODUCTS.flatMap((p) =>
    p.batches.map((b) => ({
      productName: p.name,
      batchNumber: b.batchNumber,
      expiredDate: b.expiredDate,
      quantity: b.quantity,
      unit: p.baseUnit,
      ...getExpirationBadge(b.expiredDate),
    }))
  ).filter((item) => item.urgency === "EXPIRED" || item.urgency === "CRITICAL" || item.urgency === "WARNING");

  // Calculate low stock items
  const lowStockItems = INITIAL_PRODUCTS.filter((p) => p.totalStock <= p.minStock);

  // Toy Store specific mock items
  const toyBestSellers = [
    { name: "Mobil Remote Control Monster Rock Crawler 4WD", category: "Mobil Remot & RC", sold: 18, price: 175000, stock: 4 },
    { name: "Balok Susun Edukasi Kayu 100 Pcs (Montessori)", category: "Mainan Edukasi", sold: 14, price: 95000, stock: 12 },
    { name: "Boneka Beruang Teddy Bear Jumbo 80cm", category: "Boneka & Plush", sold: 9, price: 135000, stock: 6 },
    { name: "Lego Brick Creative Box 500 Pcs", category: "Board Game & Puzzle", sold: 8, price: 120000, stock: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner - Dynamic based on active business unit */}
      <div
        className={`rounded-2xl p-6 text-white shadow-lg transition-all duration-300 ${
          isPharmacy
            ? "bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800"
            : "bg-gradient-to-r from-amber-700 via-orange-600 to-amber-900"
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-2 border ${
                isPharmacy
                  ? "bg-emerald-900/60 border-emerald-400/30 text-emerald-200"
                  : "bg-amber-900/60 border-amber-300/30 text-amber-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-ping ${
                  isPharmacy ? "bg-emerald-400" : "bg-amber-300"
                }`}
              />
              <span className="font-semibold tracking-wide">
                {isPharmacy
                  ? `Shift Aktif: ${ACTIVE_SHIFT.shiftNumber} (${activeCashierName})`
                  : `Shift Aktif: SHIFT-TOY-01 (${activeCashierName})`}
              </span>
              <span className="hidden sm:inline-block opacity-75">|</span>
              <span className="hidden sm:inline-block font-mono text-[11px] opacity-90">
                {platformName}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span>{activeBusiness.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 font-bold uppercase tracking-wider">
                {activeBusiness.typeLabel}
              </span>
            </h1>

            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              {activeBusiness.description}
            </p>
          </div>

          {/* Quick Action Touch Buttons */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Link href={bHref("/pos")} className="flex-1 sm:flex-none">
              <Button
                size="touch"
                className={`w-full font-bold shadow-md ${
                  isPharmacy
                    ? "bg-white text-emerald-800 hover:bg-emerald-50"
                    : "bg-white text-amber-800 hover:bg-amber-50"
                }`}
              >
                <ShoppingCart
                  className={`mr-2 h-5 w-5 ${
                    isPharmacy ? "text-emerald-600" : "text-amber-600"
                  }`}
                />
                POS Desktop
              </Button>
            </Link>
            <Link href={bHref("/pos/mobile")} className="flex-1 sm:flex-none">
              <Button
                size="touch"
                variant="default"
                className={`w-full text-white font-bold shadow-md border ${
                  isPharmacy
                    ? "bg-emerald-500 hover:bg-emerald-400 border-emerald-400"
                    : "bg-orange-500 hover:bg-orange-400 border-orange-400"
                }`}
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Kasir HP (Cam Barcode)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penjualan Hari Ini */}
        <Card className={isPharmacy ? "border-emerald-100 bg-white" : "border-amber-100 bg-white"}>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center text-slate-500">
              <span>Omset Hari Ini</span>
              <Receipt className={isPharmacy ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-amber-600"} />
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">
              {formatRupiah(activeBusiness.stats.todaySales)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-[11px] text-slate-600">
              <span>{activeBusiness.stats.txCount} Transaksi Selesai</span>
              <span className={`font-semibold flex items-center ${isPharmacy ? "text-emerald-600" : "text-amber-600"}`}>
                +14.8% <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Estimasi Laba Kotor */}
        <Card className={isPharmacy ? "border-teal-100 bg-white" : "border-orange-100 bg-white"}>
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center text-slate-500">
              <span>Estimasi Margin Laba</span>
              <TrendingUp className={isPharmacy ? "h-4 w-4 text-teal-600" : "h-4 w-4 text-orange-600"} />
            </CardDescription>
            <CardTitle className={`text-xl sm:text-2xl font-bold ${isPharmacy ? "text-teal-700" : "text-orange-700"}`}>
              {formatRupiah(isPharmacy ? 1420000 : 1150000)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-[11px] text-slate-600">
              <span>{isPharmacy ? "Rata-rata Margin HPP" : "Margin Ritel & Partai"}</span>
              <Badge variant={isPharmacy ? "cyan" : "default"} className="text-[10px]">
                {isPharmacy ? "29.3%" : "31.8%"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Alert Spesifik Unit Bisnis */}
        <Card className={isPharmacy ? "border-rose-100 bg-rose-50/30" : "border-amber-100 bg-amber-50/30"}>
          <CardHeader className="pb-2">
            <CardDescription className={`flex justify-between items-center ${isPharmacy ? "text-rose-700" : "text-amber-700"}`}>
              <span>{isPharmacy ? "Peringatan Kedaluwarsa" : "Stok Menipis di Rak"}</span>
              <AlertTriangle className={`h-4 w-4 ${isPharmacy ? "text-rose-600" : "text-amber-600"}`} />
            </CardDescription>
            <CardTitle className={`text-xl sm:text-2xl font-bold ${isPharmacy ? "text-rose-700" : "text-amber-700"}`}>
              {isPharmacy ? `${expiredAlerts.length} Batch` : `${activeBusiness.stats.stockAlerts} Produk`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={bHref("/laporan/stok-alert")}
              className={`text-[11px] font-semibold hover:underline flex items-center justify-between ${
                isPharmacy ? "text-rose-600" : "text-amber-700"
              }`}
            >
              <span>{isPharmacy ? "Filter H-30 & H-90" : "Cek Kebutuhan Reorder"}</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 4: Total Aset Inventori */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex justify-between items-center text-slate-500">
              <span>Total Nilai Inventori</span>
              <Boxes className="h-4 w-4 text-indigo-600" />
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-700">
              {formatRupiah(activeBusiness.stats.totalStockValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={bHref("/inventory/kartu-stok")}
              className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center justify-between"
            >
              <span>{isPharmacy ? "Kartu Stok & Batch FIFO" : "Stok Fisik Rak Toko"}</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Feature Action Tiles */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          {isPharmacy ? "Akses Cepat Modul Apotek" : "Akses Cepat Modul Toko Mainan"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href={bHref("/pos")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">Kasir POS</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isPharmacy ? "Resep & Racikan" : "Barcode Cepat"}
              </p>
            </div>
          </Link>

          <Link href={bHref("/inventory/opname")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">Opname HP</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scanner Kamera</p>
            </div>
          </Link>

          <Link href={bHref("/pembelian/faktur")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Truck className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">
                {isPharmacy ? "Faktur PBF" : "Faktur Masuk"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isPharmacy ? "Input Batch & ED" : "Input Stok Grosir"}
              </p>
            </div>
          </Link>

          <Link href={bHref("/inventory/kartu-stok")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Boxes className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">Kartu Stok</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Mutasi Otomatis</p>
            </div>
          </Link>

          <Link href={bHref("/crm/whatsapp")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-green-100 text-green-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">WhatsApp</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isPharmacy ? "Struk & Tebus Obat" : "Katalog & Promo Anak"}
              </p>
            </div>
          </Link>

          <Link href={bHref("/akuntansi/laporan")} className="group">
            <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-slate-800">Laba Rugi</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Neraca Keuangan</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two-Column Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Alerts or Reorder */}
        {isPharmacy ? (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-rose-700">
                  <Clock className="h-4 w-4" />
                  Peringatan Batch Kedaluwarsa (FIFO Watch)
                </CardTitle>
                <CardDescription>
                  Obat dengan tanggal expired terdekat yang harus diprioritaskan keluar
                </CardDescription>
              </div>
              <Link href={bHref("/laporan/stok-alert")}>
                <Button variant="outline" size="sm" className="text-xs">
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {expiredAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-slate-800">{alert.productName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-200 px-1.5 py-0.2 rounded text-[10px]">
                          Batch: {alert.batchNumber}
                        </span>
                        <span>
                          Stok: <b>{alert.quantity} {alert.unit}</b>
                        </span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${alert.badgeColor}`}>
                      {alert.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Package className="h-4 w-4" />
                  Status Stok Menipis & Reorder (Toko Mainan)
                </CardTitle>
                <CardDescription>
                  Mainan terlaris dengan stok rak kritis yang perlu segera dipesan ulang ke distributor
                </CardDescription>
              </div>
              <Link href={bHref("/pembelian/po")}>
                <Button variant="outline" size="sm" className="text-xs">
                  Buat PO
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-slate-800">
                      Lego Brick Creative Box 500 Pcs
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sisa: <b className="text-rose-600">2 Box</b> (Min: 5 Box) &bull; Supplier: Distributor Mainan Jaya
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    Kritis (Reorder)
                  </Badge>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-slate-800">
                      Mobil Remote Control Rock Crawler 4WD
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Sisa: <b className="text-amber-600">4 Pcs</b> (Min: 5 Pcs) &bull; Supplier: DMC Sentra Grosir
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">
                    Mendekati Min
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Right Column: Online Channels for Pharmacy OR Best-Sellers for Toys */}
        {isPharmacy ? (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                  <Globe className="h-4 w-4" />
                  Integrasi Pesanan Online Apotek
                </CardTitle>
                <CardDescription>
                  Sinkronisasi otomatis order masuk dari kanal eksternal & Webstore
                </CardDescription>
              </div>
              <Link href={bHref("/online-orders")}>
                <Button variant="outline" size="sm" className="text-xs">
                  Kelola Order
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {MOCK_ONLINE_ORDERS.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            order.channel === "WEBSTORE_INTERNAL" || order.channel === "WEBSTORE"
                              ? "cyan"
                              : order.channel === "KLIKDOKTER"
                              ? "success"
                              : "secondary"
                          }
                          className="text-[9px]"
                        >
                          {order.channel === "WEBSTORE_INTERNAL"
                            ? "WEBSTORE TAMANSARI"
                            : order.channel}
                        </Badge>
                        <span className="font-mono text-[10px] text-slate-400">
                          {order.orderNumber}
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-slate-800">
                        {order.customerName} &bull; <span className="text-slate-500 font-normal">{order.phone}</span>
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {order.items.map((i) => `${i.name} (${i.qty} ${i.unit})`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-emerald-700">
                        {formatRupiah(order.totalAmount)}
                      </p>
                      <Badge variant={order.status === "PENDING" ? "destructive" : "default"} className="text-[9px] mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                  <Flame className="h-4 w-4 text-orange-600" />
                  Mainan Best-Seller & Terlaris Minggu Ini
                </CardTitle>
                <CardDescription>
                  Item dengan perputaran stok tercepat di Toko Mainan Pasar Lelea
                </CardDescription>
              </div>
              <Link href={bHref("/pos")}>
                <Button variant="outline" size="sm" className="text-xs">
                  Buka Kasir
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {toyBestSellers.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-orange-300 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.category} &bull; Harga: <b>{formatRupiah(item.price)}</b>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-orange-700 block">
                        {item.sold} Terjual
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sisa {item.stock} Unit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
