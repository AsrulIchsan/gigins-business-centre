"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  CreditCard,
  QrCode,
  MapPin,
  Phone,
  User,
  Mail,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StoreCheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    cartCount,
    updateCartQty,
    removeFromCart,
    clearCart,
    customer,
    isLoggedIn,
  } = useStore();

  // Vital Customer Data for Delivery
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState(""); // Opsional

  // Shipping & Payment
  const [shippingMethod, setShippingMethod] = useState<"INSTANT" | "REGULAR" | "PICKUP">("INSTANT");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "TRANSFER" | "COD">("QRIS");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill if logged in
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name || "");
      setCustomerPhone(customer.phone || "");
      setCustomerAddress(customer.address || "");
      setCustomerEmail(customer.email || "");
    }
  }, [customer]);

  // Shipping cost calculation
  const shippingCost =
    shippingMethod === "INSTANT"
      ? 10000
      : shippingMethod === "REGULAR"
      ? 8000
      : 0;

  const grandTotal = cartTotal + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (cart.length === 0) {
      setErrorMsg("Keranjang belanja Anda kosong.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg("Nama Lengkap pemesan wajib diisi.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg("Nomor HP / WhatsApp wajib diisi.");
      return;
    }
    if (shippingMethod !== "PICKUP" && !customerAddress.trim()) {
      setErrorMsg("Alamat lengkap pengiriman wajib diisi untuk kurir antar.");
      return;
    }

    setLoading(true);
    try {
      // Build order items
      const itemsPayload = cart.map((item) => ({
        productName: item.product.name,
        qty: item.quantity,
        unitName: item.product.unit,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const res = await fetch("/api/online-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ORDER",
          customerName: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          email: customerEmail.trim() || undefined, // Opsional
          shippingMethod:
            shippingMethod === "INSTANT"
              ? "Kurir Instan 1-2 Jam"
              : shippingMethod === "REGULAR"
              ? "Kurir Reguler"
              : "Ambil di Apotek",
          paymentMethod:
            paymentMethod === "QRIS"
              ? "QRIS Instan"
              : paymentMethod === "TRANSFER"
              ? "Transfer Bank"
              : "Bayar di Tempat (COD)",
          items: itemsPayload,
          totalAmount: grandTotal,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        clearCart();
        // Redirect to order success page
        router.push(
          `/store/order-success?orderNumber=${encodeURIComponent(
            data.order.orderNumber
          )}&total=${grandTotal}&name=${encodeURIComponent(
            customerName
          )}&phone=${encodeURIComponent(customerPhone)}&method=${paymentMethod}`
        );
      } else {
        setErrorMsg(data.message || "Gagal memproses pesanan.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Anda belum memilih obat atau produk kesehatan apapun dari etalase Apotik Tamansari.
        </p>
        <div className="pt-2">
          <Link href="/store">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-5">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Buka Etalase Obat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/store"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-semibold mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Belanja
          </Link>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Checkout & Pengiriman Obat
          </h1>
        </div>
        <Badge variant="cyan" className="text-xs">
          {cartCount} Item
        </Badge>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer Vital Info & Delivery Options (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Data Pemesan (Vital Saja) */}
            <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Data Vital Pemesan & Penerima
                    </CardTitle>
                  </div>
                  {isLoggedIn && customer ? (
                    <Badge variant="cyan" className="text-[10px]">
                      Member: {customer.memberCode}
                    </Badge>
                  ) : (
                    <Link
                      href="/store/login"
                      className="text-[11px] text-emerald-600 font-bold hover:underline"
                    >
                      Sudah punya akun? Masuk
                    </Link>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
                {/* Nama Lengkap */}
                <div>
                  <label className="font-bold text-slate-700 flex justify-between mb-1">
                    <span>Nama Lengkap Penerima:</span>
                    <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="Contoh: Ibu Siti Aminah"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Nomor HP */}
                <div>
                  <label className="font-bold text-slate-700 flex justify-between mb-1">
                    <span>Nomor WhatsApp / HP Aktif:</span>
                    <span className="text-[10px] text-rose-600 font-semibold">* Wajib</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Apoteker akan menghubungi untuk konfirmasi resep dan kurir saat pengantaran.
                  </p>
                </div>

                {/* Alamat Pengiriman */}
                <div>
                  <label className="font-bold text-slate-700 flex justify-between mb-1">
                    <span>Alamat Lengkap Pengiriman:</span>
                    <span className="text-[10px] text-rose-600 font-semibold">
                      {shippingMethod !== "PICKUP" ? "* Wajib" : "(Opsional jika ambil di apotek)"}
                    </span>
                  </label>
                  <textarea
                    required={shippingMethod !== "PICKUP"}
                    rows={2}
                    placeholder="Jalan, No. Rumah, RT/RW, Patokan / Kelurahan, Kota Bandung..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Email (Opsional - Tidak Wajib) */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <label className="font-bold text-slate-700 flex justify-between mb-1">
                    <span>Alamat Email:</span>
                    <Badge variant="secondary" className="text-[9px] bg-slate-200 text-slate-600">
                      (Opsional / Tidak Wajib)
                    </Badge>
                  </label>
                  <Input
                    type="email"
                    placeholder="Boleh dikosongkan jika tidak ada"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Metode Pengiriman */}
            <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Pilihan Pengantaran Obat
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2.5 text-xs">
                {/* Instant */}
                <label
                  onClick={() => setShippingMethod("INSTANT")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === "INSTANT"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Kurir Instan Apotek (1-2 Jam)</p>
                      <p className="text-[10px] text-slate-500">GoSend / GrabExpress langsung dari apotek</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">Rp 10.000</span>
                </label>

                {/* Regular */}
                <label
                  onClick={() => setShippingMethod("REGULAR")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === "REGULAR"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Ekspedisi Reguler (1-2 Hari)</p>
                      <p className="text-[10px] text-slate-500">J&T / SiCepat dengan nomor resi</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">Rp 8.000</span>
                </label>

                {/* Pickup */}
                <label
                  onClick={() => setShippingMethod("PICKUP")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === "PICKUP"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Ambil Sendiri di Apotik Tamansari</p>
                      <p className="text-[10px] text-slate-500">Jl. Tamansari No. 45, Coblong, Bandung</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">GRATIS</span>
                </label>
              </CardContent>
            </Card>

            {/* 3. Metode Pembayaran */}
            <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Pilihan Pembayaran
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2.5 text-xs">
                <label
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "QRIS"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">QRIS Instan (Semua Bank & E-Wallet)</p>
                      <p className="text-[10px] text-slate-500">BCA, Mandiri, GoPay, OVO, ShopeePay, Dana</p>
                    </div>
                  </div>
                  <Badge variant="cyan" className="text-[9px]">Otomatis</Badge>
                </label>

                <label
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "TRANSFER"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Transfer Bank Manual (BCA / Mandiri)</p>
                      <p className="text-[10px] text-slate-500">Konfirmasi bukti transfer ke WhatsApp Apoteker</p>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("COD")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Bayar di Tempat (COD / Tunai)</p>
                      <p className="text-[10px] text-slate-500">Bayar saat kurir mengantarkan obat</p>
                    </div>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Catatan untuk Apoteker */}
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Catatan Khusus Pasien / Kurir (Opsional):
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Pasien ada riwayat alergi obat penisilin, atau pagar rumah warna hijau..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white"
              />
            </div>
          </div>

          {/* Right Column: Order Items Summary & Payment Submit (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 bg-white rounded-2xl shadow-md overflow-hidden sticky top-24">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>Ringkasan Pesanan Obat</span>
                  <span className="text-xs font-normal text-slate-500">
                    {cartCount} Item
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* List items */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.product.unit} &bull; {formatRupiah(item.product.price)}
                        </p>
                      </div>

                      {/* Qty Counter */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono font-bold text-xs w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-800 block">
                          {formatRupiah(item.product.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-rose-500 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-1.5 pt-2 text-xs border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Obat:</span>
                    <span className="font-semibold">{formatRupiah(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pengantaran:</span>
                    <span className="font-semibold">
                      {shippingCost === 0 ? "GRATIS" : formatRupiah(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t text-sm">
                    <span className="font-bold text-slate-800">Total Pembayaran:</span>
                    <span className="font-black text-lg text-emerald-800">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Direct submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-5 rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.99]"
                >
                  {loading
                    ? "Mengirimkan Pesanan ke Apotek..."
                    : `Konfirmasi Pesanan (${formatRupiah(grandTotal)})`}
                </Button>

                <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                  Pesanan akan langsung masuk ke layar Kasir Apotik Tamansari dan disiapkan oleh apoteker.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
