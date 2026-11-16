"use client";

/**
 * /login/page.tsx
 * Halaman Login Resmi — Gigin's Business Centre & Apotik Tamansari.
 * Autentikasi real database Prisma + bcryptjs + JWT cookie.
 * Pencatatan otomatis ke LoginHistory & redirect berbasis role.
 */

import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2, AlertCircle, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
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
        body: JSON.stringify({ email: identifier, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Email atau password yang Anda masukkan salah.");
        return;
      }

      // Hard redirect ke rute tujuan agar state sesi browser dan router cache bersih penuh
      window.location.href = data.redirectTo || "/hub";
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi jaringan Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header Resmi */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-3 shadow-lg ring-4 ring-indigo-100">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gigin's Business Centre</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Sistem Informasi Manajemen Terpadu: Apotik Tamansari & Unit Bisnis
          </p>
        </div>

        {/* Card Form Login */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan Email atau Username Anda"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition font-medium text-gray-900"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
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
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition text-gray-900 font-medium"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md mt-4"
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
        </div>

        {/* Footer Resmi */}
        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          Apotik Tamansari &copy; 2026 &bull; Sistem Terpadu Multi-Device Resmi
        </p>
      </div>
    </div>
  );
}
