import fs from "fs";
import path from "path";
import os from "os";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface LoginLogItem {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  role: string;
  businessName: string;
  businessSlug: string;
  time: string;
  timestamp: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  ipAddress: string;
  status: "SUCCESS" | "FAILED";
  failReason?: string;
}

export interface ActivityLogItem {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  businessName: string;
  businessSlug: string;
  module: "POS" | "PRODUCT" | "PURCHASE" | "STOCK" | "FINANCE" | "USER" | "CRM" | "SETTING";
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID" | "APPROVE" | "REJECT" | "LOGIN" | "LOGOUT";
  entityId: string;
  entityName: string;
  description: string;
  time: string;
  timestamp: string;
  ipAddress: string;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
}

// ─── Storage Directory Setup (Vercel Serverless & Local Dual-Path) ─────────

const CWD_LOGS_DIR = path.join(process.cwd(), "data", "logs");
const CWD_LOGIN_FILE = path.join(CWD_LOGS_DIR, "login_history.json");
const CWD_ACTIVITY_FILE = path.join(CWD_LOGS_DIR, "activity_logs.json");

const TMP_LOGS_DIR = path.join(os.tmpdir(), "gigins_data", "logs");
const TMP_LOGIN_FILE = path.join(TMP_LOGS_DIR, "login_history.json");
const TMP_ACTIVITY_FILE = path.join(TMP_LOGS_DIR, "activity_logs.json");

// In-Memory Global Store to preserve logs across serverless function invocations
const globalAuditStore = globalThis as unknown as {
  __gigins_login_logs?: LoginLogItem[];
  __gigins_activity_logs?: ActivityLogItem[];
};

function ensureDirSafe(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {
    // Ignore read-only filesystem errors silently
  }
}

// ─── Initial Baseline Official Logs ─────────────────────────────────────────

const INITIAL_LOGIN_LOGS: LoginLogItem[] = [
  {
    id: "log-init-01",
    userName: "Gigin",
    userEmail: "owner@gigin.com",
    role: "OWNER",
    businessName: "Gigin's Business Centre (Portal)",
    businessSlug: "all",
    time: "Hari ini, 07:30 WIB",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    device: "Chrome / Windows 11",
    deviceType: "desktop",
    ipAddress: "192.168.1.1 (LAN Kantor)",
    status: "SUCCESS",
  },
  {
    id: "log-init-02",
    userName: "Siti Rahma, A.Md.Farm",
    userEmail: "kasir.apotik@gigin.com",
    role: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    time: "Hari ini, 07:00 WIB",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    device: "Chrome Mobile / Tablet POS Android",
    deviceType: "tablet",
    ipAddress: "192.168.1.15 (Kasir 1)",
    status: "SUCCESS",
  },
  {
    id: "log-init-03",
    userName: "Administrator Apotik",
    userEmail: "admin@apotiktamansari.com",
    role: "OWNER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    time: "Hari ini, 06:14 WIB",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    device: "Safari / macOS",
    deviceType: "desktop",
    ipAddress: "192.168.1.20",
    status: "SUCCESS",
  },
  {
    id: "log-init-04",
    userName: "Budi Santoso",
    userEmail: "kasir.mainan@gigin.com",
    role: "KASIR",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    time: "Hari ini, 06:05 WIB",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    device: "Safari / iPad Air",
    deviceType: "tablet",
    ipAddress: "192.168.2.8 (Kasir Toko)",
    status: "SUCCESS",
  },
  {
    id: "log-init-05",
    userName: "apt. Nurul Aulia, S.Farm",
    userEmail: "admin@apotiktamansari.com",
    role: "MANAGER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    time: "Kemarin, 21:10 WIB",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    device: "Chrome Mobile / iPhone 15 Pro",
    deviceType: "mobile",
    ipAddress: "114.124.200.5",
    status: "SUCCESS",
  },
];

const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "act-seed-01",
    userName: "Siti Rahma, A.Md.Farm",
    userRole: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "POS",
    action: "CREATE",
    entityId: "SL-TS-894102",
    entityName: "Struk #SL-TS-894102",
    description: "Transaksi Kasir Penjualan Umum Tunai berhasil diselesaikan",
    time: "Hari ini, 07:42 WIB",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    ipAddress: "192.168.1.15",
    oldData: null,
    newData: {
      saleNumber: "SL-TS-894102",
      totalAmount: 145000,
      paymentMethod: "CASH",
      cashGiven: 150000,
      change: 5000,
      items: [
        { name: "Amoxicillin 500mg", qty: 10, unit: "Kapsul", subtotal: 25000 },
        { name: "Paracetamol Sirup 120mg", qty: 2, unit: "Botol", subtotal: 40000 },
        { name: "Betadine Antiseptik 60ml", qty: 1, unit: "Botol", subtotal: 80000 },
      ],
      journalGenerated: "JV-SL-894102",
    },
  },
  {
    id: "act-seed-02",
    userName: "Gigin",
    userRole: "OWNER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "PRODUCT",
    action: "UPDATE",
    entityId: "PRD-MED-0012",
    entityName: "Paracetamol 500mg Tablet",
    description: "Harga jual eceran dinaikkan sesuai penyesuaian HPP dari PBF Kimia Farma",
    time: "Hari ini, 05:50 WIB",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    ipAddress: "192.168.1.1",
    oldData: {
      productId: "PRD-MED-0012",
      name: "Paracetamol 500mg Tablet",
      buyPriceHpp: 800,
      sellPrice: 1200,
      marginPercent: 50,
      lastUpdatedBy: "apt. Nurul Aulia",
    },
    newData: {
      productId: "PRD-MED-0012",
      name: "Paracetamol 500mg Tablet",
      buyPriceHpp: 950,
      sellPrice: 1500,
      marginPercent: 57.8,
      lastUpdatedBy: "Gigin (Owner)",
    },
  },
  {
    id: "act-seed-03",
    userName: "Budi Santoso",
    userRole: "MANAGER",
    businessName: "Toko Mainan Pasar Lelea",
    businessSlug: "toko-mainan-pasar-lelea",
    module: "PURCHASE",
    action: "CREATE",
    entityId: "PO-LELEA-2026-088",
    entityName: "Faktur Masuk Supplier #INV-TOYS-7721",
    description: "Penerimaan faktur masuk distributor Mobil Remote Control & Diecast",
    time: "Kemarin, 16:30 WIB",
    timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
    ipAddress: "192.168.2.8",
    oldData: null,
    newData: {
      supplier: "CV Mainan Jaya Sentosa (Jakarta)",
      invoiceNumber: "INV-TOYS-7721",
      poNumber: "PO-LELEA-2026-088",
      totalInvoice: 4850000,
      paymentTerms: "TEMPO_30_HARI",
      dueDate: "2026-12-14",
      itemsReceived: [
        { name: "Mobil RC Rock Crawler 4WD", qty: 12, buyPrice: 175000 },
        { name: "Hotwheels Basic Box 72pcs", qty: 2, buyPrice: 1375000 },
      ],
    },
  },
  {
    id: "act-seed-04",
    userName: "Siti Rahma, A.Md.Farm",
    userRole: "KASIR",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "POS",
    action: "VOID",
    entityId: "SL-TS-893991",
    entityName: "Struk #SL-TS-893991",
    description: "Void / Pembatalan transaksi kasir karena pelanggan salah bawa resep",
    time: "Kemarin, 14:15 WIB",
    timestamp: new Date(Date.now() - 3600000 * 25).toISOString(),
    ipAddress: "192.168.1.15",
    oldData: {
      saleNumber: "SL-TS-893991",
      status: "COMPLETED",
      totalAmount: 230000,
      paymentMethod: "QRIS",
      customer: "Bp. Hendra Kurniawan",
      voidReason: null,
      voidApprovedBy: null,
    },
    newData: {
      saleNumber: "SL-TS-893991",
      status: "VOID",
      totalAmount: 0,
      paymentMethod: "REFUNDED_QRIS",
      customer: "Bp. Hendra Kurniawan",
      voidReason: "Salah bawa resep obat keras, diganti nomor resep baru",
      voidApprovedBy: "apt. Nurul Aulia (Manager)",
    },
  },
  {
    id: "act-seed-05",
    userName: "apt. Nurul Aulia, S.Farm",
    userRole: "MANAGER",
    businessName: "Apotik Tamansari",
    businessSlug: "apotik-tamansari",
    module: "STOCK",
    action: "APPROVE",
    entityId: "OPN-2026-11-14",
    entityName: "Stok Opname Rak Kapsul & Sirup",
    description: "Approval penyesuaian selisih stok fisik bulanan apotek",
    time: "Kemarin, 11:00 WIB",
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    ipAddress: "192.168.1.10",
    oldData: {
      opnameId: "OPN-2026-11-14",
      status: "DRAFT_PENDING_APPROVAL",
      systemRecordedTotalUnits: 1420,
      physicalCountedTotalUnits: 1418,
      discrepancyUnits: -2,
      financialImpact: -15000,
    },
    newData: {
      opnameId: "OPN-2026-11-14",
      status: "APPROVED_ADJUSTED",
      approvedBy: "apt. Nurul Aulia, S.Farm",
      journalAdjustment: "JV-OPN-20261114-01",
      notes: "Selisih 2 botol rusak pecah saat display, dialokasikan ke Beban Kerusakan Obat",
    },
  },
  {
    id: "act-seed-06",
    userName: "Gigin",
    userRole: "OWNER",
    businessName: "Gigin's Business Centre",
    businessSlug: "all",
    module: "USER",
    action: "UPDATE",
    entityId: "usr-04",
    entityName: "Ahmad Fauzi (Kasir)",
    description: "Status akun diubah menjadi Nonaktif (akses diblokir)",
    time: "2 hari lalu",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    ipAddress: "192.168.1.1",
    oldData: {
      userId: "usr-04",
      name: "Ahmad Fauzi",
      isActive: true,
      role: "KASIR",
      assignedTo: "Toko Mainan Pasar Lelea",
    },
    newData: {
      userId: "usr-04",
      name: "Ahmad Fauzi",
      isActive: false,
      blockedReason: "Pegawai mutasi tugas sementara",
      updatedBy: "Gigin (Owner)",
    },
  },
];

// ─── Helpers: User-Agent & Time Parser ──────────────────────────────────────

export function parseDeviceFromUserAgent(ua?: string | null): {
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
} {
  if (!ua || ua === "Unknown Browser") {
    return { device: "Browser / Desktop", deviceType: "desktop" };
  }

  // Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(ua)) {
    deviceType = "mobile";
  }

  // OS
  let os = "Desktop";
  if (/windows nt 10\.0/i.test(ua)) os = "Windows 11/10";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone/i.test(ua)) os = "iPhone (iOS)";
  else if (/ipad/i.test(ua)) os = "iPad (iPadOS)";
  else if (/android/i.test(ua)) {
    const brandMatch = ua.match(/android\s+[0-9.]+;\s*([^;)]+)/i);
    os = brandMatch ? `Android (${brandMatch[1].trim()})` : "Android";
  } else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser
  let browser = "Web Browser";
  if (/edg\//i.test(ua)) {
    const v = ua.match(/edg\/([0-9]+)/i)?.[1];
    browser = v ? `Edge ${v}` : "Edge";
  } else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) {
    const v = ua.match(/chrome\/([0-9]+)/i)?.[1];
    browser = v ? (deviceType === "mobile" ? `Chrome Mobile ${v}` : `Chrome ${v}`) : "Chrome";
  } else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    browser = deviceType === "mobile" ? "Safari Mobile" : "Safari";
  } else if (/firefox\//i.test(ua)) {
    const v = ua.match(/firefox\/([0-9]+)/i)?.[1];
    browser = v ? `Firefox ${v}` : "Firefox";
  }

  return { device: `${browser} / ${os}`, deviceType };
}

export function formatLogTime(date: Date = new Date()): string {
  try {
    const now = new Date();
    const isToday =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    if (isToday) {
      return `Hari ini, ${timeStr} WIB`;
    }

    const yesterday = new Date(now.getTime() - 86400000);
    const isYesterday =
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate();

    if (isYesterday) {
      return `Kemarin, ${timeStr} WIB`;
    }

    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

    return `${dateStr} ${timeStr} WIB`;
  } catch {
    return date.toISOString().slice(0, 16).replace("T", " ") + " WIB";
  }
}

// ─── File Storage Operations (Dual-Path Serverless & Persistent Store) ──────

export async function readLoginLogs(): Promise<LoginLogItem[]> {
  // 1. If in-memory cache is populated, return immediately
  if (globalAuditStore.__gigins_login_logs && globalAuditStore.__gigins_login_logs.length > 0) {
    return globalAuditStore.__gigins_login_logs;
  }

  // 2. Try reading from writable TMP directory first (has latest runtime logs)
  try {
    if (fs.existsSync(TMP_LOGIN_FILE)) {
      const raw = fs.readFileSync(TMP_LOGIN_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalAuditStore.__gigins_login_logs = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[AuditStorage] Warning reading TMP login logs:", err);
  }

  // 3. Try reading from project bundle (data/logs/login_history.json)
  try {
    if (fs.existsSync(CWD_LOGIN_FILE)) {
      const raw = fs.readFileSync(CWD_LOGIN_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalAuditStore.__gigins_login_logs = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[AuditStorage] Warning reading CWD login logs:", err);
  }

  // 4. Default to baseline logs
  globalAuditStore.__gigins_login_logs = INITIAL_LOGIN_LOGS;

  // Persist to TMP in background so future reads are fast
  try {
    ensureDirSafe(TMP_LOGS_DIR);
    fs.writeFileSync(TMP_LOGIN_FILE, JSON.stringify(INITIAL_LOGIN_LOGS, null, 2), "utf-8");
  } catch {}

  return INITIAL_LOGIN_LOGS;
}

export async function appendLoginLog(entry: {
  userId?: string;
  userName: string;
  userEmail: string;
  role: string;
  businessName?: string;
  businessSlug?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  status: "SUCCESS" | "FAILED";
  failReason?: string;
}): Promise<LoginLogItem> {
  const currentLogs = await readLoginLogs();

  const now = new Date();
  const { device, deviceType } = parseDeviceFromUserAgent(entry.userAgent || entry.deviceInfo);

  const newLog: LoginLogItem = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: entry.userId,
    userName: entry.userName,
    userEmail: entry.userEmail,
    role: entry.role,
    businessName: entry.businessName || "Gigin's Business Centre",
    businessSlug: entry.businessSlug || "all",
    time: formatLogTime(now),
    timestamp: now.toISOString(),
    device: entry.deviceInfo && entry.deviceInfo !== entry.userAgent ? entry.deviceInfo : device,
    deviceType,
    ipAddress: entry.ipAddress || "127.0.0.1",
    status: entry.status,
    failReason: entry.failReason,
  };

  // Prepend to top of logs array (most recent first), limit to 1000
  const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);
  globalAuditStore.__gigins_login_logs = updatedLogs;

  // Try writing to writable TMP directory
  try {
    ensureDirSafe(TMP_LOGS_DIR);
    fs.writeFileSync(TMP_LOGIN_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuditStorage] Failed to write TMP login log file:", err);
  }

  // Try writing to CWD if writable (local dev)
  try {
    ensureDirSafe(CWD_LOGS_DIR);
    fs.writeFileSync(CWD_LOGIN_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch {
    // EROFS on Vercel is expected; TMP and in-memory cache handle runtime state
  }

  return newLog;
}

export async function readActivityLogs(): Promise<ActivityLogItem[]> {
  // 1. If in-memory cache is populated, return immediately
  if (globalAuditStore.__gigins_activity_logs && globalAuditStore.__gigins_activity_logs.length > 0) {
    return globalAuditStore.__gigins_activity_logs;
  }

  // 2. Try reading from writable TMP directory first (has latest runtime logs)
  try {
    if (fs.existsSync(TMP_ACTIVITY_FILE)) {
      const raw = fs.readFileSync(TMP_ACTIVITY_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalAuditStore.__gigins_activity_logs = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[AuditStorage] Warning reading TMP activity logs:", err);
  }

  // 3. Try reading from project bundle (data/logs/activity_logs.json)
  try {
    if (fs.existsSync(CWD_ACTIVITY_FILE)) {
      const raw = fs.readFileSync(CWD_ACTIVITY_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalAuditStore.__gigins_activity_logs = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[AuditStorage] Warning reading CWD activity logs:", err);
  }

  // 4. Default to baseline logs
  globalAuditStore.__gigins_activity_logs = INITIAL_ACTIVITY_LOGS;

  // Persist to TMP in background so future reads are fast
  try {
    ensureDirSafe(TMP_LOGS_DIR);
    fs.writeFileSync(TMP_ACTIVITY_FILE, JSON.stringify(INITIAL_ACTIVITY_LOGS, null, 2), "utf-8");
  } catch {}

  return INITIAL_ACTIVITY_LOGS;
}

export async function appendActivityLog(entry: {
  userId?: string;
  userName?: string;
  userRole?: string;
  businessName?: string;
  businessSlug?: string;
  module: ActivityLogItem["module"];
  action: ActivityLogItem["action"];
  entityId?: string;
  entityName?: string;
  description: string;
  ipAddress?: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
}): Promise<ActivityLogItem> {
  const currentLogs = await readActivityLogs();

  const now = new Date();
  const newLog: ActivityLogItem = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: entry.userId,
    userName: entry.userName || "Sistem / Operator",
    userRole: entry.userRole || "STAFF",
    businessName: entry.businessName || "Gigin's Business Centre",
    businessSlug: entry.businessSlug || "apotik-tamansari",
    module: entry.module,
    action: entry.action,
    entityId: entry.entityId || `ID-${Date.now()}`,
    entityName: entry.entityName || "Aktivitas",
    description: entry.description,
    time: formatLogTime(now),
    timestamp: now.toISOString(),
    ipAddress: entry.ipAddress || "127.0.0.1",
    oldData: entry.oldData ?? null,
    newData: entry.newData ?? null,
  };

  const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);
  globalAuditStore.__gigins_activity_logs = updatedLogs;

  // Try writing to writable TMP directory
  try {
    ensureDirSafe(TMP_LOGS_DIR);
    fs.writeFileSync(TMP_ACTIVITY_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuditStorage] Failed to write TMP activity log file:", err);
  }

  // Try writing to CWD if writable (local dev)
  try {
    ensureDirSafe(CWD_LOGS_DIR);
    fs.writeFileSync(CWD_ACTIVITY_FILE, JSON.stringify(updatedLogs, null, 2), "utf-8");
  } catch {
    // EROFS on Vercel is expected; TMP and in-memory cache handle runtime state
  }

  return newLog;
}

export async function getAuditStats() {
  const loginLogs = await readLoginLogs();
  const activityLogs = await readActivityLogs();

  const successCount = loginLogs.filter((l) => l.status === "SUCCESS").length;
  const failedCount = loginLogs.filter((l) => l.status === "FAILED").length;
  const uniqueDevices = new Set(loginLogs.map((l) => `${l.device}-${l.ipAddress}`)).size;

  return {
    totalLogins: loginLogs.length,
    successLogins: successCount,
    failedLogins: failedCount,
    uniqueDevices,
    totalActivities: activityLogs.length,
  };
}
