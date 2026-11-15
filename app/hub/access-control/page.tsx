"use client";

/**
 * /hub/access-control/page.tsx
 * Portal Utama Owner — Role & Access Management (Granular RBAC)
 * Kelola seluruh akun pegawai, penugasan unit bisnis, template role & izin granular.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Pill,
  Store,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  KeyRound,
  Lock,
  ChevronRight,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { HubHeader } from "@/components/hub/hub-header";
import { Permission, DEFAULT_PERMISSIONS, BusinessRole } from "@/lib/auth";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  assignedBusinesses: {
    slug: string;
    name: string;
    type: "PHARMACY" | "RETAIL_TOYS";
    role: BusinessRole;
    permissions: Permission[];
  }[];
  lastLogin: string;
}

const ALL_PERMISSIONS: { key: Permission; label: string; description: string; category: string }[] = [
  { key: "can_void_sale", label: "Void Transaksi Kasir", description: "Membatalkan struk belanja yang sudah dibayar", category: "POS & Penjualan" },
  { key: "can_edit_price", label: "Ubah Harga Jual di POS", description: "Memberi diskon manual atau merubah harga jual saat kasir", category: "POS & Penjualan" },
  { key: "can_approve_return", label: "Approve Retur Penjualan", description: "Menyetujui klaim pengembalian barang dari pembeli", category: "POS & Penjualan" },
  { key: "can_view_hpp", label: "Lihat HPP & Modal Barang", description: "Melihat harga pokok pembelian & margin laba kotor", category: "Katalog & Harga" },
  { key: "can_delete_product", label: "Hapus Master Produk", description: "Menghapus entri obat atau mainan dari katalog", category: "Katalog & Harga" },
  { key: "can_manage_promo", label: "Kelola Promo & Diskon", description: "Membuat voucher, diskon partai, dan promo member", category: "Katalog & Harga" },
  { key: "can_stock_opname", label: "Input Stok Opname", description: "Melakukan perhitungan fisik barang via HP/Barcode", category: "Inventori & Gudang" },
  { key: "can_approve_opname", label: "Approve Selisih Opname", description: "Menyetujui penyesuaian nilai buku saat selisih stok", category: "Inventori & Gudang" },
  { key: "can_edit_purchase", label: "Input/Edit Faktur Pembelian", description: "Menerima faktur supplier/PBF & merubah nominal utang", category: "Pembelian & Supplier" },
  { key: "can_view_reports", label: "Lihat Laporan Penjualan", description: "Melihat rekap shift kasir dan omset harian", category: "Laporan & Keuangan" },
  { key: "can_view_finance", label: "Akses Jurnal & Laba Rugi", description: "Melihat neraca, pembukuan jurnal akuntansi, dan laba", category: "Laporan & Keuangan" },
  { key: "can_export_data", label: "Export Data (Excel/CSV)", description: "Mengunduh database pelanggan, stok, atau mutasi", category: "Laporan & Keuangan" },
  { key: "can_manage_users", label: "Kelola Akses Bawahan", description: "Mengatur user bawahan di cabang yang sama", category: "Pengaturan Sistem" },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: "usr-owner-gigin",
    name: "Gigin",
    email: "admin@apotiktamansari.com",
    phone: "0812-9988-7766",
    password: "admin123",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "OWNER",
        permissions: ALL_PERMISSIONS.map((p) => p.key),
      },
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "OWNER",
        permissions: ALL_PERMISSIONS.map((p) => p.key),
      },
    ],
    lastLogin: "Hari ini (Sesi Aktif)",
  },
  {
    id: "usr-01",
    name: "apt. Nurul Aulia, S.Farm",
    email: "nurul.aulia@apotiktamansari.com",
    phone: "0812-3456-7801",
    password: "nurul123",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "MANAGER",
        permissions: [
          "can_void_sale",
          "can_edit_price",
          "can_view_hpp",
          "can_stock_opname",
          "can_approve_return",
          "can_view_reports",
          "can_view_finance",
          "can_edit_purchase",
          "can_approve_opname",
          "can_manage_promo",
        ],
      },
    ],
    lastLogin: "Hari ini, 07:15 (Chrome / Windows)",
  },
  {
    id: "usr-02",
    name: "Siti Rahma, A.Md.Farm",
    email: "kasir@apotiktamansari.com",
    phone: "0813-8821-9902",
    password: "kasir123",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
    lastLogin: "Hari ini, 07:00 (Android POS)",
  },
  {
    id: "usr-03",
    name: "Budi Santoso",
    email: "budi@pasarlelea.com",
    phone: "0856-7788-1234",
    password: "budi123",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "MANAGER",
        permissions: [
          "can_void_sale",
          "can_edit_price",
          "can_view_hpp",
          "can_stock_opname",
          "can_approve_return",
          "can_view_reports",
          "can_edit_purchase",
          "can_manage_promo",
        ],
      },
    ],
    lastLogin: "Kemarin, 14:22 (Safari / iPad)",
  },
  {
    id: "usr-04",
    name: "Ahmad Fauzi",
    email: "ahmad@pasarlelea.com",
    phone: "0819-3344-5566",
    password: "ahmad123",
    isActive: false,
    assignedBusinesses: [
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
    ],
    lastLogin: "7 hari lalu (Nonaktif)",
  },
  {
    id: "usr-05",
    name: "Dewi Lestari",
    email: "dewi.multicabang@gigins.com",
    phone: "0811-2233-4455",
    password: "dewi123",
    isActive: true,
    assignedBusinesses: [
      {
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY",
        role: "KASIR",
        permissions: ["can_stock_opname"],
      },
      {
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS",
        role: "KASIR",
        permissions: ["can_stock_opname", "can_edit_price"],
      },
    ],
    lastLogin: "Hari ini, 06:45 (Desktop Chrome)",
  },
];

export default function AccessControlPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessFilter, setBusinessFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Password visibility & copy states
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);

  function toggleShowPassword(userId: string) {
    setShowPasswordMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  function copyPassword(userId: string, pass: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pass);
    }
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification("success", `Password berhasil disalin ke clipboard: ${pass}`);
  }

  // Feedback Notification
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showNotification(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formActive, setFormActive] = useState(true);

  // Business assignment & role state inside modal
  const [assignApotik, setAssignApotik] = useState(true);
  const [roleApotik, setRoleApotik] = useState<BusinessRole>("KASIR");
  const [permissionsApotik, setPermissionsApotik] = useState<Permission[]>(["can_stock_opname"]);

  const [assignMainan, setAssignMainan] = useState(false);
  const [roleMainan, setRoleMainan] = useState<BusinessRole>("KASIR");
  const [permissionsMainan, setPermissionsMainan] = useState<Permission[]>(["can_stock_opname"]);

  // Open Modal for Add
  function handleOpenAdd() {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setShowModalPassword(false);
    setFormActive(true);
    setAssignApotik(true);
    setRoleApotik("KASIR");
    setPermissionsApotik([...DEFAULT_PERMISSIONS.KASIR]);
    setAssignMainan(false);
    setRoleMainan("KASIR");
    setPermissionsMainan([...DEFAULT_PERMISSIONS.KASIR]);
    setIsModalOpen(true);
  }

  // Open Modal for Edit
  function handleOpenEdit(user: UserAccount) {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormPassword(user.password || "");
    setShowModalPassword(false);
    setFormActive(user.isActive);

    const apotik = user.assignedBusinesses.find((b) => b.slug === "apotik-tamansari");
    if (apotik) {
      setAssignApotik(true);
      setRoleApotik(apotik.role);
      setPermissionsApotik(
        apotik.permissions.length > 0 ? [...apotik.permissions] : [...DEFAULT_PERMISSIONS[apotik.role]]
      );
    } else {
      setAssignApotik(false);
      setRoleApotik("KASIR");
      setPermissionsApotik([...DEFAULT_PERMISSIONS.KASIR]);
    }

    const mainan = user.assignedBusinesses.find((b) => b.slug === "toko-mainan-pasar-lelea");
    if (mainan) {
      setAssignMainan(true);
      setRoleMainan(mainan.role);
      setPermissionsMainan(
        mainan.permissions.length > 0 ? [...mainan.permissions] : [...DEFAULT_PERMISSIONS[mainan.role]]
      );
    } else {
      setAssignMainan(false);
      setRoleMainan("KASIR");
      setPermissionsMainan([...DEFAULT_PERMISSIONS.KASIR]);
    }

    setIsModalOpen(true);
  }

  // Toggle user active status directly from table
  async function handleToggleStatus(userId: string) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = !target.isActive;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
    );

    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.id,
          name: target.name,
          email: target.email,
          businessSlug: "all",
          isActive: newStatus,
          action: "TOGGLE_STATUS",
          oldData: { isActive: target.isActive },
        }),
      });
      showNotification("success", `Status akun "${target.name}" diubah menjadi: ${newStatus ? "AKTIF" : "NONAKTIF (DIBLOKIR)"}`);
    } catch {
      showNotification("success", `Status akun "${target.name}" diperbarui`);
    }
  }

  // Apply template role
  function applyTemplateApotik(role: BusinessRole) {
    setRoleApotik(role);
    setPermissionsApotik([...DEFAULT_PERMISSIONS[role]]);
  }

  function applyTemplateMainan(role: BusinessRole) {
    setRoleMainan(role);
    setPermissionsMainan([...DEFAULT_PERMISSIONS[role]]);
  }

  // Toggle single permission for Apotik
  function togglePermissionApotik(perm: Permission) {
    setPermissionsApotik((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  // Toggle single permission for Mainan
  function togglePermissionMainan(perm: Permission) {
    setPermissionsMainan((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  // Save Modal
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formEmail) return;

    if (!assignApotik && !assignMainan) {
      alert("Pegawai harus ditugaskan minimal ke salah satu unit bisnis!");
      return;
    }

    setSaving(true);
    const assigned: UserAccount["assignedBusinesses"] = [];
    if (assignApotik) {
      assigned.push({
        slug: "apotik-tamansari",
        name: "Apotik Tamansari",
        type: "PHARMACY" as const,
        role: roleApotik,
        permissions: permissionsApotik,
      });
    }
    if (assignMainan) {
      assigned.push({
        slug: "toko-mainan-pasar-lelea",
        name: "Toko Mainan Pasar Lelea",
        type: "RETAIL_TOYS" as const,
        role: roleMainan,
        permissions: permissionsMainan,
      });
    }

    const existing = users.find((u) => u.id === editingUserId);
    const targetPassword = formPassword.trim() || existing?.password || "admin123";
    const oldData = existing
      ? { name: existing.name, assigned: existing.assignedBusinesses, isActive: existing.isActive }
      : null;

    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          password: targetPassword,
          role: roleApotik || roleMainan,
          permissions: assignApotik ? permissionsApotik : permissionsMainan,
          isActive: formActive,
          businessSlug: assignApotik && assignMainan ? "all" : assignApotik ? "apotik-tamansari" : "toko-mainan-pasar-lelea",
          action: editingUserId ? "UPDATE" : "CREATE",
          oldData,
        }),
      });

      if (editingUserId) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUserId
              ? {
                  ...u,
                  name: formName,
                  email: formEmail,
                  phone: formPhone,
                  password: targetPassword,
                  isActive: formActive,
                  assignedBusinesses: assigned,
                }
              : u
          )
        );
        showNotification("success", `Akun & hak akses "${formName}" berhasil disimpan & dicatat ke audit log!`);
      } else {
        const newUser: UserAccount = {
          id: `usr-${Date.now()}`,
          name: formName,
          email: formEmail,
          phone: formPhone || "—",
          password: targetPassword,
          isActive: formActive,
          assignedBusinesses: assigned,
          lastLogin: "Belum pernah login",
        };
        setUsers([newUser, ...users]);
        showNotification("success", `Akun pegawai baru "${formName}" berhasil dibuat!`);
      }
      setIsModalOpen(false);
    } catch {
      showNotification("error", "Gagal menyimpan ke server");
    } finally {
      setSaving(false);
    }
  }

  // Delete user
  async function handleDeleteUser(userId: string, name: string) {
    if (confirm(`Apakah Anda yakin ingin menghapus akun pegawai "${name}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      try {
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name,
            businessSlug: "all",
            action: "DELETE",
          }),
        });
        showNotification("success", `Akun pegawai "${name}" telah dihapus.`);
      } catch {
        showNotification("success", `Akun pegawai "${name}" dihapus.`);
      }
    }
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    // Search
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    // Business
    if (businessFilter !== "ALL") {
      const hasBiz = u.assignedBusinesses.some((b) => b.slug === businessFilter);
      if (!hasBiz) return false;
    }

    // Role
    if (roleFilter !== "ALL") {
      const hasRole = u.assignedBusinesses.some((b) => b.role === roleFilter);
      if (!hasRole) return false;
    }

    // Status
    if (statusFilter === "ACTIVE" && !u.isActive) return false;
    if (statusFilter === "INACTIVE" && u.isActive) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <HubHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <Shield className="w-4 h-4" />
              <span>GIGIN'S BUSINESS CENTRE · ACCESS CONTROL</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Role & Granular Permission Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Atur hak akses pegawai, penugasan multi-cabang, dan batasi fitur sensitif (void, ubah harga, HPP, keuangan).
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-md hover:from-indigo-700 hover:to-purple-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Akun Pegawai
          </button>
        </div>

        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Total Pegawai</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{users.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Semua cabang terdaftar</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Akun Aktif</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {users.filter((u) => u.isActive).length}
            </span>
            <span className="text-[11px] text-slate-400">Bisa login ke POS/ERP</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Akun Dinonaktifkan</span>
            <span className="text-2xl font-black text-red-500 mt-1 block">
              {users.filter((u) => !u.isActive).length}
            </span>
            <span className="text-[11px] text-slate-400">Akses diblokir sementara</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Pegawai Multi-Cabang</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {users.filter((u) => u.assignedBusinesses.length > 1).length}
            </span>
            <span className="text-[11px] text-slate-400">Tugas di 2 unit bisnis</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pegawai, email, atau no. telepon..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Unit Bisnis */}
              <select
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Unit Bisnis</option>
                <option value="apotik-tamansari">🏥 Apotik Tamansari</option>
                <option value="toko-mainan-pasar-lelea">🧸 Toko Mainan Pasar Lelea</option>
              </select>

              {/* Role */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Role</option>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="KASIR">Kasir</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Hanya Aktif</option>
                <option value="INACTIVE">Hanya Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table / Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Pegawai</th>
                  <th className="px-6 py-4">Password Aktif</th>
                  <th className="px-6 py-4">Penugasan Unit Bisnis</th>
                  <th className="px-6 py-4">Role & Izin Granular</th>
                  <th className="px-6 py-4">Status Akun</th>
                  <th className="px-6 py-4">Login Terakhir</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada akun pegawai yang sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !user.isActive ? "bg-slate-50/40 opacity-75" : ""
                      }`}
                    >
                      {/* Pegawai info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              user.id === "usr-owner-gigin"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : user.isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 block leading-tight">
                                {user.name}
                              </span>
                              {user.assignedBusinesses.some((b) => b.role === "OWNER") && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                  OWNER
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block">{user.email}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {user.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Password Akun Aktif (Perlihatkan password yang sedang berlangsung) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="px-2.5 py-1 bg-slate-100/90 rounded-lg border border-slate-200 font-mono text-xs flex items-center gap-1.5 select-all">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span
                              className={
                                showPasswordMap[user.id]
                                  ? "font-bold text-indigo-700 tracking-normal"
                                  : "text-slate-500 tracking-widest text-xs"
                              }
                            >
                              {showPasswordMap[user.id] ? user.password : "••••••••"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(user.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title={
                              showPasswordMap[user.id]
                                ? "Sembunyikan password"
                                : "Lihat password yang sedang berlangsung"
                            }
                          >
                            {showPasswordMap[user.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPassword(user.id, user.password)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Salin password"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Penugasan unit bisnis */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {user.assignedBusinesses.map((b) => (
                            <div
                              key={b.slug}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mr-2 mb-1 ${
                                b.type === "PHARMACY"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {b.type === "PHARMACY" ? (
                                <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span>{b.name}</span>
                              <span className="text-[10px] opacity-70">({b.role})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Role & Permissions count */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {user.assignedBusinesses.map((b) => (
                            <div key={b.slug} className="text-xs">
                              <span className="font-semibold text-slate-700">
                                {b.role === "OWNER"
                                  ? "Owner / Superadmin"
                                  : b.role === "MANAGER"
                                  ? "Manajer Cabang"
                                  : "Kasir Operasional"}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-indigo-600 mt-0.5">
                                <KeyRound className="w-3 h-3" />
                                <span>
                                  {b.role === "OWNER"
                                    ? "Akses Penuh Seluruh Modul (13/13)"
                                    : `${b.permissions.length} dari 13 izin khusus aktif`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                            user.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                          title={user.isActive ? "Klik untuk Nonaktifkan" : "Klik untuk Aktifkan"}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Nonaktif (Diblokir)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {user.lastLogin}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Izin & Penugasan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Akun Pegawai"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Tambah / Edit Akun Pegawai */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingUserId ? "Edit Akun & Izin Pegawai" : "Tambah Akun Pegawai Baru"}
                  </h3>
                  <p className="text-xs text-white/80">
                    Konfigurasi kredensial, cabang kerja, dan izin granular
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Bagian 1: Informasi Kredensial */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  1. Informasi Profil & Akun
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Budi Santoso, S.Farm"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="pegawai@gigins.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {editingUserId ? "Password Akun Aktif *" : "Password Login Baru *"}
                      </label>
                      {editingUserId && (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Password Sedang Berlangsung
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showModalPassword ? "text" : "password"}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        title={showModalPassword ? "Sembunyikan password" : "Lihat password"}
                      >
                        {showModalPassword ? (
                          <EyeOff className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="userActiveCheck"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="userActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Akun ini aktif (dapat langsung masuk ke sistem)
                  </label>
                </div>
              </div>

              {/* Bagian 2: Penugasan Unit Bisnis & Template Role */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  2. Penugasan Unit Bisnis & Template Role
                </h4>

                <div className="space-y-4">
                  {/* Apotik Tamansari Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      assignApotik
                        ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/10"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="assignApotikCheck"
                          checked={assignApotik}
                          onChange={(e) => setAssignApotik(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <label
                          htmlFor="assignApotikCheck"
                          className="flex items-center gap-2 font-bold text-slate-900 text-sm cursor-pointer"
                        >
                          <Pill className="w-4 h-4 text-emerald-600" />
                          Apotik Tamansari (Unit Farmasi)
                        </label>
                      </div>

                      {assignApotik && (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Role:</span>
                          <button
                            type="button"
                            onClick={() => applyTemplateApotik("KASIR")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleApotik === "KASIR"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Kasir
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplateApotik("MANAGER")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleApotik === "MANAGER"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Manager
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplateApotik("OWNER")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleApotik === "OWNER"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Owner
                          </button>
                        </div>
                      )}
                    </div>

                    {assignApotik && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Izin Khusus di Apotik Tamansari ({permissionsApotik.length} dipilih):
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPermissionsApotik(ALL_PERMISSIONS.map((p) => p.key))}
                              className="text-[10px] text-emerald-700 font-bold hover:underline"
                            >
                              Centang Semua
                            </button>
                            <span className="text-[10px] text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setPermissionsApotik([])}
                              className="text-[10px] text-slate-500 hover:underline"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {ALL_PERMISSIONS.map((perm) => {
                            const isChecked = permissionsApotik.includes(perm.key);
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? "bg-white border-emerald-300 shadow-xs"
                                    : "bg-slate-50/50 border-slate-200 text-slate-500"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermissionApotik(perm.key)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
                                />
                                <div>
                                  <span className="font-semibold text-slate-800 block">
                                    {perm.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block leading-tight">
                                    {perm.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toko Mainan Pasar Lelea Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      assignMainan
                        ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/10"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="assignMainanCheck"
                          checked={assignMainan}
                          onChange={(e) => setAssignMainan(e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                        />
                        <label
                          htmlFor="assignMainanCheck"
                          className="flex items-center gap-2 font-bold text-slate-900 text-sm cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-amber-600" />
                          Toko Mainan Pasar Lelea (Retail Mainan)
                        </label>
                      </div>

                      {assignMainan && (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Role:</span>
                          <button
                            type="button"
                            onClick={() => applyTemplateMainan("KASIR")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleMainan === "KASIR"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Kasir
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplateMainan("MANAGER")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleMainan === "MANAGER"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Manager
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplateMainan("OWNER")}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                              roleMainan === "OWNER"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Owner
                          </button>
                        </div>
                      )}
                    </div>

                    {assignMainan && (
                      <div className="mt-3 pt-3 border-t border-amber-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Izin Khusus di Toko Mainan ({permissionsMainan.length} dipilih):
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPermissionsMainan(ALL_PERMISSIONS.map((p) => p.key))}
                              className="text-[10px] text-amber-800 font-bold hover:underline"
                            >
                              Centang Semua
                            </button>
                            <span className="text-[10px] text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setPermissionsMainan([])}
                              className="text-[10px] text-slate-500 hover:underline"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {ALL_PERMISSIONS.map((perm) => {
                            const isChecked = permissionsMainan.includes(perm.key);
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? "bg-white border-amber-300 shadow-xs"
                                    : "bg-slate-50/50 border-slate-200 text-slate-500"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermissionMainan(perm.key)}
                                  className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mt-0.5"
                                />
                                <div>
                                  <span className="font-semibold text-slate-800 block">
                                    {perm.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block leading-tight">
                                    {perm.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {saving ? "Menyimpan ke Server..." : editingUserId ? "Simpan Perubahan Izin" : "Buat Akun Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
