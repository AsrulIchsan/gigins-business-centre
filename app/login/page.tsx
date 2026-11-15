"use client";

/**
 * /login/page.tsx
 * Halaman Login Utama — Gigin's Business Centre.
 * Autentikasi real database Prisma + bcryptjs + JWT cookie.
 * Pencatatan otomatis ke LoginHistory & redirect berbasis role.
 */

import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2, AlertCircle, Shield, Store, Pill } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Email atau password salah.");
        return;
      }

      // Hard redirect ke rute tujuan agar state sesi browser dan router cache bersih penuh
      window.location.href = data.redirectTo || "/hub";
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  }

  // Helper untuk mengisi kredensial pengetesan dengan 1-klik
  const fillCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-3 shadow-lg ring-4 ring-indigo-100">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gigin's Business Centre</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Platform Multi-Bisnis Terpadu: Apotik Tamansari & Toko Mainan
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Pengguna
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@gigin.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition font-medium"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi Autentikasi...
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </button>
          </form>

          {/* Akun Pengetesan Resmi (Pilih Kredensial untuk Menguji Login Database Asli) */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-wider mb-2">
              Akun Testing Resmi (Klik untuk Isi Form)
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillCredentials("owner@gigin.com", "password123")}
                className="w-full text-left p-2 rounded-lg border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-gray-800">Owner (Gigin)</span>
                    <span className="text-[10px] text-gray-500 block">owner@gigin.com &bull; Role: OWNER</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                  Akses /hub
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("kasir.apotik@gigin.com", "password123")}
                className="w-full text-left p-2 rounded-lg border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-gray-800">Kasir Apotik Tamansari</span>
                    <span className="text-[10px] text-gray-500 block">kasir.apotik@gigin.com &bull; Role: KASIR</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Akses POS Apotek
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("kasir.mainan@gigin.com", "password123")}
                className="w-full text-left p-2 rounded-lg border border-amber-100 hover:border-amber-300 hover:bg-amber-50/60 transition-all flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <div>
                    <span className="font-bold text-gray-800">Kasir Toko Mainan</span>
                    <span className="text-[10px] text-gray-500 block">kasir.mainan@gigin.com &bull; Role: KASIR</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Akses POS Mainan
                </span>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center italic pt-1">
              Semua password pengujian: <code className="font-mono font-bold text-gray-600">password123</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Gigin's Business Centre &copy; 2026 &bull; Real Database Authentication
        </p>
      </div>
    </div>
  );
}
