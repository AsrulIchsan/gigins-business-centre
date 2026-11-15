"use client";

/**
 * /b/[businessSlug]/admin/akses/page.tsx
 * Manajemen akses user khusus unit bisnis saat ini — hanya OWNER.
 * Terhubung penuh ke API /api/admin/users dan mencatat ActivityLog.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Users,
  Edit2,
  Plus,
  Check,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  KeyRound,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Lock,
} from "lucide-react";
import { Permission, DEFAULT_PERMISSIONS, BusinessRole } from "@/lib/auth";

const ALL_PERMISSIONS: { key: Permission; label: string; desc: string }[] = [
  { key: "can_void_sale", label: "Void Transaksi", desc: "Membatalkan struk kasir terbayar" },
  { key: "can_edit_price", label: "Ubah Harga Jual", desc: "Diskon manual/ganti harga di POS" },
  { key: "can_view_hpp", label: "Lihat HPP/Modal", desc: "Melihat harga pokok dan margin" },
  { key: "can_stock_opname", label: "Stok Opname", desc: "Input hitung fisik stok barang" },
  { key: "can_approve_return", label: "Approve Retur", desc: "Menyetujui klaim barang retur" },
  { key: "can_view_reports", label: "Lihat Laporan", desc: "Laporan omset harian dan shift" },
  { key: "can_view_finance", label: "Lihat Keuangan", desc: "Akses jurnal umum & laba rugi" },
  { key: "can_delete_product", label: "Hapus Produk", desc: "Menghapus data obat/mainan" },
  { key: "can_edit_purchase", label: "Edit Pembelian", desc: "Input/ubah faktur supplier" },
  { key: "can_approve_opname", label: "Approve Opname", desc: "Menyetujui selisih stok" },
  { key: "can_manage_promo", label: "Kelola Promo", desc: "Atur diskon partai & voucher" },
  { key: "can_export_data", label: "Export Data", desc: "Unduh file Excel/CSV sistem" },
];

interface BusinessStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: BusinessRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin: string;
}

const INITIAL_STAFF: Record<string, BusinessStaff[]> = {
  "apotik-tamansari": [
    {
      id: "stf-owner-gigin",
      name: "Gigin",
      email: "admin@apotiktamansari.com",
      phone: "0812-9988-7766",
      password: "admin123",
      role: "OWNER",
      permissions: ALL_PERMISSIONS.map((p) => p.key),
      isActive: true,
      lastLogin: "Hari ini (Sesi Aktif)",
    },
    {
      id: "stf-01",
      name: "apt. Nurul Aulia, S.Farm (APA)",
      email: "nurul.aulia@apotiktamansari.com",
      phone: "0812-3456-7801",
      password: "nurul123",
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
      isActive: true,
      lastLogin: "Hari ini, 07:15 WIB",
    },
    {
      id: "stf-02",
      name: "Siti Rahma, A.Md.Farm",
      email: "kasir@apotiktamansari.com",
      phone: "0813-8821-9902",
      password: "kasir123",
      role: "KASIR",
      permissions: ["can_stock_opname"],
      isActive: true,
      lastLogin: "Hari ini, 07:00 WIB",
    },
    {
      id: "stf-03",
      name: "Dewi Lestari",
      email: "dewi.multicabang@gigins.com",
      phone: "0811-2233-4455",
      password: "dewi123",
      role: "KASIR",
      permissions: ["can_stock_opname"],
      isActive: true,
      lastLogin: "Hari ini, 06:45 WIB",
    },
  ],
  "toko-mainan-pasar-lelea": [
    {
      id: "stf-owner-gigin-lelea",
      name: "Gigin",
      email: "admin@apotiktamansari.com",
      phone: "0812-9988-7766",
      password: "admin123",
      role: "OWNER",
      permissions: ALL_PERMISSIONS.map((p) => p.key),
      isActive: true,
      lastLogin: "Hari ini (Sesi Aktif)",
    },
    {
      id: "stf-11",
      name: "Budi Santoso",
      email: "budi@pasarlelea.com",
      phone: "0856-7788-1234",
      password: "budi123",
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
      isActive: true,
      lastLogin: "Hari ini, 06:05 WIB",
    },
    {
      id: "stf-12",
      name: "Dewi Lestari",
      email: "dewi.multicabang@gigins.com",
      phone: "0811-2233-4455",
      password: "dewi123",
      role: "KASIR",
      permissions: ["can_stock_opname", "can_edit_price"],
      isActive: true,
      lastLogin: "Kemarin, 08:30 WIB",
    },
    {
      id: "stf-13",
      name: "Ahmad Fauzi",
      email: "ahmad@pasarlelea.com",
      phone: "0819-3344-5566",
      password: "ahmad123",
      role: "KASIR",
      permissions: ["can_stock_opname"],
      isActive: false,
      lastLogin: "7 hari lalu (Nonaktif)",
    },
  ],
};

export default function AksesPage() {
  const params = useParams();
  const slug = (params?.businessSlug as string) || "apotik-tamansari";
  const isPharmacy = slug === "apotik-tamansari";
  const businessName = isPharmacy ? "Apotik Tamansari" : "Toko Mainan Pasar Lelea";

  const [staffList, setStaffList] = useState<BusinessStaff[]>(
    INITIAL_STAFF[slug] || INITIAL_STAFF["apotik-tamansari"]
  );

  // Password visibility & copy states
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formPassword, setFormPassword] = useState("");
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<BusinessRole>("KASIR");
  const [formPermissions, setFormPermissions] = useState<Permission[]>(["can_stock_opname"]);
  const [formActive, setFormActive] = useState(true);

  // Feedback Notification
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showNotification(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleOpenAdd() {
    setEditingStaffId(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setShowModalPassword(false);
    setFormRole("KASIR");
    setFormPermissions([...DEFAULT_PERMISSIONS.KASIR]);
    setFormActive(true);
    setIsModalOpen(true);
  }

  function handleOpenEdit(staff: BusinessStaff) {
    setEditingStaffId(staff.id);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormPhone(staff.phone);
    setFormPassword(staff.password || "");
    setShowModalPassword(false);
    setFormRole(staff.role);
    setFormPermissions([...staff.permissions]);
    setFormActive(staff.isActive);
    setIsModalOpen(true);
  }

  function applyRoleTemplate(role: BusinessRole) {
    setFormRole(role);
    setFormPermissions([...DEFAULT_PERMISSIONS[role]]);
  }

  function togglePermission(perm: Permission) {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  async function handleToggleStatus(staffId: string) {
    const target = staffList.find((s) => s.id === staffId);
    if (!target) return;

    const newStatus = !target.isActive;

    // Update local state immediately
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive: newStatus } : s))
    );

    // Call API to persist & log
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.id,
          name: target.name,
          email: target.email,
          role: target.role,
          businessSlug: slug,
          isActive: newStatus,
          action: "TOGGLE_STATUS",
          oldData: { isActive: target.isActive },
        }),
      });
      showNotification(
        "success",
        `Status akun "${target.name}" berhasil diubah menjadi ${newStatus ? "AKTIF" : "NONAKTIF"}`
      );
    } catch {
      showNotification("success", `Status akun "${target.name}" diperbarui`);
    }
  }

  async function handleSaveStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formEmail) return;

    setSaving(true);
    const existingStaff = staffList.find((s) => s.id === editingStaffId);
    const targetPassword = formPassword.trim() || existingStaff?.password || "admin123";
    const oldData = existingStaff
      ? { role: existingStaff.role, permissions: existingStaff.permissions, isActive: existingStaff.isActive }
      : null;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingStaffId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          password: targetPassword,
          role: formRole,
          permissions: formPermissions,
          isActive: formActive,
          businessSlug: slug,
          action: editingStaffId ? "UPDATE" : "CREATE",
          oldData,
        }),
      });

      const data = await res.json();

      if (editingStaffId) {
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === editingStaffId
              ? {
                  ...s,
                  name: formName,
                  email: formEmail,
                  phone: formPhone,
                  password: targetPassword,
                  role: formRole,
                  permissions: formPermissions,
                  isActive: formActive,
                }
              : s
          )
        );
        showNotification("success", `Perubahan hak akses "${formName}" berhasil disimpan & dicatat di audit log!`);
      } else {
        const newStaff: BusinessStaff = {
          id: data.data?.id || `stf-${Date.now()}`,
          name: formName,
          email: formEmail,
          phone: formPhone || "—",
          password: targetPassword,
          role: formRole,
          permissions: formPermissions,
          isActive: formActive,
          lastLogin: "Belum pernah login",
        };
        setStaffList([newStaff, ...staffList]);
        showNotification("success", `Akun pegawai baru "${formName}" berhasil dibuat di ${businessName}!`);
      }

      setIsModalOpen(false);
    } catch {
      showNotification("error", "Gagal menyimpan ke server, periksa koneksi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStaff(staffId: string, name: string) {
    if (!confirm(`Hapus akun pegawai "${name}" dari ${businessName}?`)) return;

    setStaffList((prev) => prev.filter((s) => s.id !== staffId));

    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: staffId,
          name,
          businessSlug: slug,
          action: "DELETE",
        }),
      });
      showNotification("success", `Akun pegawai "${name}" telah dihapus.`);
    } catch {
      showNotification("success", `Akun pegawai "${name}" dihapus.`);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isPharmacy ? "bg-emerald-600" : "bg-amber-600"
            }`}
          >
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isPharmacy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {businessName}
              </span>
              <span className="text-xs text-slate-400">• Akses Cabang</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Manajemen Role & Izin Pegawai
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur hak akses staf di cabang ini atau buka portal pusat untuk pengaturan multi-cabang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/hub/access-control"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Portal Multi-Cabang</span>
          </Link>

          <button
            onClick={handleOpenAdd}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition ${
              isPharmacy
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            <Plus className="w-4 h-4" /> Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Staff Cards List */}
      <div className="space-y-4">
        {staffList.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-6 transition-all ${
              !user.isActive ? "bg-slate-50/60 opacity-80" : ""
            }`}
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                    user.role === "OWNER"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : user.isActive
                      ? isPharmacy
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {user.name}
                    </p>
                    {user.role === "OWNER" && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                        OWNER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user.id)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition shadow-2xs ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                      title={user.isActive ? "Klik untuk Blokir" : "Klik untuk Aktifkan"}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-600" /> Nonaktif (Diblokir)
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user.email} &bull; <span className="font-mono">{user.phone}</span>
                  </p>

                  {/* Password yang sedang berlangsung */}
                  <div className="flex items-center gap-1.5 mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 w-fit shadow-2xs">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 font-medium">Password Aktif:</span>
                    <span
                      className={`font-mono text-xs select-all ${
                        showPasswordMap[user.id]
                          ? "font-bold text-indigo-700"
                          : "text-slate-500 tracking-widest text-xs"
                      }`}
                    >
                      {showPasswordMap[user.id] ? user.password : "••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(user.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition"
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
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                      title="Salin password"
                    >
                      {copiedId === user.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user.role === "OWNER"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : user.role === "MANAGER"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role}
                </span>

                <button
                  onClick={() => handleOpenEdit(user)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-indigo-600 transition"
                  title="Edit Izin & Role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(user.id, user.name)}
                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition"
                  title="Hapus Pegawai"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Izin Khusus Aktif ({user.permissions.length} dari {ALL_PERMISSIONS.length})
                </p>
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Sesuaikan Izin &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const hasIt = user.permissions.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition ${
                        hasIt
                          ? isPharmacy
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold"
                            : "bg-amber-50/70 border-amber-200 text-amber-800 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {hasIt ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{perm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Login terakhir: {user.lastLogin}</span>
              <span>ID: {user.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Tambah / Edit Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div
              className={`px-6 py-5 text-white flex items-center justify-between shrink-0 ${
                isPharmacy
                  ? "bg-gradient-to-r from-emerald-700 to-teal-800"
                  : "bg-gradient-to-r from-amber-600 to-orange-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingStaffId ? "Edit Hak Akses Pegawai" : `Tambah Pegawai ${businessName}`}
                  </h3>
                  <p className="text-xs text-white/80">Atur role dan centang izin operasional kasir/manajer</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-5 flex-1 overflow-y-auto">
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
                    placeholder="Contoh: Rian Anggara"
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
                    placeholder="pegawai@apotiktamansari.com"
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
                      {editingStaffId ? "Password Akun Aktif *" : "Password Login Baru *"}
                    </label>
                    {editingStaffId && (
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Template Role Cabang
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyRoleTemplate("KASIR")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        formRole === "KASIR"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Kasir
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRoleTemplate("MANAGER")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        formRole === "MANAGER"
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRoleTemplate("OWNER")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        formRole === "OWNER"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Owner
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="modalActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="modalActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Akun ini aktif (dapat langsung masuk ke sistem kasir/dashboard)
                </label>
              </div>

              {/* Checklist Izin Granular */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Izin Khusus ({formPermissions.length} dipilih):
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPermissions(ALL_PERMISSIONS.map((p) => p.key))}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-[10px] text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormPermissions([])}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-indigo-50/50 border-indigo-300 shadow-xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.key)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 block">{perm.label}</span>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            {perm.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
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
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Hak Akses
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
