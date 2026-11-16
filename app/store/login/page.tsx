"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Lock,
  ArrowRight,
  Pill,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StoreLoginPage() {
  const router = useRouter();
  const { loginCustomer, isLoggedIn, customer, cartCount } = useStore();

  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!phoneOrEmail.trim()) {
      setErrorMsg("Masukkan Nomor HP atau Email Anda.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomer(phoneOrEmail.trim(), password.trim());
      if (res.success) {
        if (cartCount > 0) {
          router.push("/store/checkout");
        } else {
          router.push("/store");
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn && customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <Card className="p-6 rounded-2xl border-slate-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Anda Sudah Masuk sebagai {customer.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kode Member: <b className="font-mono text-emerald-700">{customer.memberCode}</b>
          </p>
          <div className="mt-5 space-y-2">
            <Link href="/store" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-5">
                Belanja di Etalase Webstore
              </Button>
            </Link>
            {cartCount > 0 && (
              <Link href="/store/checkout" className="block">
                <Button variant="outline" className="w-full text-xs font-bold py-5">
                  Lanjut ke Checkout ({cartCount} Obat)
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Pill className="h-3.5 w-3.5 text-emerald-600" />
          Akun Pasien & Member
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Masuk ke Webstore
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Akses pesanan, resep, dan alamat pengiriman obat Anda
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Nomor HP / WhatsApp atau Email:
              </label>
              <Input
                type="text"
                required
                placeholder="Contoh: 08122334455"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="h-10 text-xs rounded-xl focus-visible:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Kata Sandi Akun:
              </label>
              <Input
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs rounded-xl focus-visible:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? "Memproses..." : "Masuk ke Akun"}
            </Button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-700 block">Akun Uji Coba Cepat:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneOrEmail("08122334455");
                  setPassword("123456");
                }}
                className="px-2 py-1 bg-white rounded border text-emerald-700 hover:bg-emerald-50 font-mono text-[10px]"
              >
                Rina Marlina (08122334455)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneOrEmail("081234567890");
                  setPassword("123456");
                }}
                className="px-2 py-1 bg-white rounded border text-emerald-700 hover:bg-emerald-50 font-mono text-[10px]"
              >
                Budi S. (081234567890)
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Belum memiliki akun member?{" "}
            <Link href="/store/register" className="text-emerald-600 font-bold hover:underline">
              Daftar Akun Baru (Data Vital Saja)
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
