/**
 * lib/pos-sales-data.ts
 * Persistent Store for POS Cashier Transactions
 * Uses globalThis cache + /tmp file fallback (same pattern as lib/audit-storage.ts)
 */

import fs from "fs";
import path from "path";
import os from "os";

export interface PosSaleItem {
  productId?: string;
  name: string;
  unitName?: string;
  qty: number;
  sellPrice: number;
  subtotal: number;
  batchNumber?: string;
  isCompounding?: boolean;
}

export interface PosSaleRecord {
  id: string;
  saleNumber: string;
  date: string;
  saleType: "GENERAL" | "PRESCRIPTION" | "COMPOUNDING" | string;
  items: PosSaleItem[];
  customer?: {
    id?: string;
    name: string;
    phone?: string;
    tier?: string;
    memberCode?: string;
  } | null;
  doctor?: {
    id?: string;
    name: string;
    clinic?: string;
    sip?: string;
  } | null;
  prescriptionNumber?: string;
  subtotal: number;
  compoundingFee?: number;
  embalaseFee?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentNote?: string;
  cashGiven: number;
  roundingAmount?: number;
  change: number;
  cashier: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  status: "COMPLETED" | "RETURNED" | "PARTIAL_RETURN";
  createdAt: string;
}

// ─── Storage Paths ────────────────────────────────────────────────────────────

const CWD_DATA_DIR = path.join(process.cwd(), "data");
const CWD_POS_SALES_FILE = path.join(CWD_DATA_DIR, "pos_sales.json");

const TMP_DATA_DIR = path.join(os.tmpdir(), "gigins_data");
const TMP_POS_SALES_FILE = path.join(TMP_DATA_DIR, "pos_sales.json");

// ─── GlobalThis Cache ─────────────────────────────────────────────────────────

const globalPosStore = globalThis as unknown as {
  __possSalesCache?: PosSaleRecord[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDirSafe(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {
    // Ignore read-only filesystem errors silently
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const now = Date.now();

export const INITIAL_POS_SALES: PosSaleRecord[] = [
  {
    id: "sale-ts-001",
    saleNumber: "SL-TS-884910",
    date: new Date(now - 25 * 60 * 1000).toISOString(),
    saleType: "GENERAL",
    items: [
      {
        productId: "prod-1",
        name: "Sanmol 500mg (Paracetamol)",
        unitName: "Strip",
        qty: 2,
        sellPrice: 5000,
        subtotal: 10000,
        batchNumber: "BCH-SNM-24A",
      },
      {
        productId: "prod-3",
        name: "Cetirizine 10mg Novell",
        unitName: "Strip",
        qty: 1,
        sellPrice: 11000,
        subtotal: 11000,
        batchNumber: "CTZ-24-X1",
      },
    ],
    customer: {
      id: "c-1",
      name: "Budi Santoso",
      phone: "081234567890",
      tier: "GOLD",
      memberCode: "MBR-001",
    },
    subtotal: 21000,
    compoundingFee: 0,
    embalaseFee: 0,
    discountAmount: 1050,
    totalAmount: 19950,
    paymentMethod: "CASH",
    paymentNote: "Tunai (Cash)",
    cashGiven: 50000,
    roundingAmount: 50,
    change: 30000,
    cashier: "Siti Rahma, A.Md.Farm",
    businessName: "Apotik Tamansari",
    businessAddress: "Jl. Tamansari No. 45, Bandung",
    businessPhone: "022-2501234",
    status: "COMPLETED",
    createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "sale-ts-002",
    saleNumber: "SL-TS-884909",
    date: new Date(now - 75 * 60 * 1000).toISOString(),
    saleType: "PRESCRIPTION",
    prescriptionNumber: "R/2026/11/045",
    doctor: {
      id: "doc-1",
      name: "dr. Hendra Gunawan, Sp.PD",
      clinic: "Klinik Sehat Tamansari",
      sip: "503/445/SIP-Dokter/2022",
    },
    items: [
      {
        productId: "prod-2",
        name: "Amoxicillin 500mg Hexpharm",
        unitName: "Strip",
        qty: 2,
        sellPrice: 8000,
        subtotal: 16000,
        batchNumber: "AMX-2024-H2",
      },
      {
        productId: "prod-5",
        name: "Vitamin C 500mg IPI",
        unitName: "Pot",
        qty: 1,
        sellPrice: 9500,
        subtotal: 9500,
        batchNumber: "VTC-2024-01",
      },
    ],
    customer: {
      id: "c-2",
      name: "Ibu Ratna Dewi",
      phone: "081987654321",
      tier: "SILVER",
      memberCode: "MBR-002",
    },
    subtotal: 25500,
    compoundingFee: 0,
    embalaseFee: 0,
    discountAmount: 765,
    totalAmount: 24735,
    paymentMethod: "QRIS",
    paymentNote: "QRIS Dinamis BCA",
    cashGiven: 24735,
    roundingAmount: 0,
    change: 0,
    cashier: "Siti Rahma, A.Md.Farm",
    businessName: "Apotik Tamansari",
    businessAddress: "Jl. Tamansari No. 45, Bandung",
    businessPhone: "022-2501234",
    status: "COMPLETED",
    createdAt: new Date(now - 75 * 60 * 1000).toISOString(),
  },
  {
    id: "sale-ts-003",
    saleNumber: "SL-TS-884908",
    date: new Date(now - 140 * 60 * 1000).toISOString(),
    saleType: "GENERAL",
    items: [
      {
        productId: "prod-6",
        name: "Minyak Kayu Putih Cap Lang 60ml",
        unitName: "Botol",
        qty: 1,
        sellPrice: 22000,
        subtotal: 22000,
        batchNumber: "MKP-2024-05",
      },
      {
        productId: "prod-7",
        name: "Madu Herbal TJ Murni 150g",
        unitName: "Botol",
        qty: 1,
        sellPrice: 25000,
        subtotal: 25000,
        batchNumber: "TJ-2024-09",
      },
    ],
    customer: null,
    subtotal: 47000,
    compoundingFee: 0,
    embalaseFee: 0,
    discountAmount: 0,
    totalAmount: 47000,
    paymentMethod: "CASH",
    paymentNote: "Tunai (Cash)",
    cashGiven: 50000,
    roundingAmount: 0,
    change: 3000,
    cashier: "Siti Rahma, A.Md.Farm",
    businessName: "Apotik Tamansari",
    businessAddress: "Jl. Tamansari No. 45, Bandung",
    businessPhone: "022-2501234",
    status: "COMPLETED",
    createdAt: new Date(now - 140 * 60 * 1000).toISOString(),
  },
  {
    id: "sale-ts-004",
    saleNumber: "SL-TS-884907",
    date: new Date(now - 210 * 60 * 1000).toISOString(),
    saleType: "COMPOUNDING",
    doctor: {
      id: "doc-2",
      name: "dr. Maya Lestari, Sp.A",
      clinic: "Praktek Mandiri dr. Maya",
      sip: "503/446/SIP-Dokter/2023",
    },
    items: [
      {
        productId: "prod-8",
        name: "Serbuk Racik Paracetamol + CTM",
        unitName: "Puyer",
        qty: 10,
        sellPrice: 1500,
        subtotal: 15000,
        batchNumber: "RCK-2026-11",
        isCompounding: true,
      },
    ],
    customer: {
      id: "c-4",
      name: "Ahmad Fauzi",
      phone: "087711223344",
      tier: "REGULAR",
    },
    subtotal: 15000,
    compoundingFee: 7500,
    embalaseFee: 2500,
    discountAmount: 0,
    totalAmount: 25000,
    paymentMethod: "DEBIT_CARD",
    paymentNote: "Kartu Debit Mandiri",
    cashGiven: 25000,
    roundingAmount: 0,
    change: 0,
    cashier: "Siti Rahma, A.Md.Farm",
    businessName: "Apotik Tamansari",
    businessAddress: "Jl. Tamansari No. 45, Bandung",
    businessPhone: "022-2501234",
    status: "COMPLETED",
    createdAt: new Date(now - 210 * 60 * 1000).toISOString(),
  },
];

// ─── Core Functions ───────────────────────────────────────────────────────────

export function getAllPosSales(): PosSaleRecord[] {
  // 1. If in-memory cache is populated, return immediately
  if (globalPosStore.__possSalesCache && globalPosStore.__possSalesCache.length > 0) {
    return globalPosStore.__possSalesCache;
  }

  // 2. Try reading from writable TMP directory first (has latest runtime sales)
  try {
    if (fs.existsSync(TMP_POS_SALES_FILE)) {
      const raw = fs.readFileSync(TMP_POS_SALES_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalPosStore.__possSalesCache = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[PosSalesData] Warning reading TMP pos_sales.json:", err);
  }

  // 3. Try reading from project bundle (data/pos_sales.json)
  try {
    if (fs.existsSync(CWD_POS_SALES_FILE)) {
      const raw = fs.readFileSync(CWD_POS_SALES_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalPosStore.__possSalesCache = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("[PosSalesData] Warning reading CWD pos_sales.json:", err);
  }

  // 4. Default to seed data
  globalPosStore.__possSalesCache = [...INITIAL_POS_SALES];

  // Persist seed to TMP so future reads are fast
  try {
    ensureDirSafe(TMP_DATA_DIR);
    fs.writeFileSync(TMP_POS_SALES_FILE, JSON.stringify(INITIAL_POS_SALES, null, 2), "utf-8");
  } catch {}

  return globalPosStore.__possSalesCache;
}

export function addLivePosSale(sale: PosSaleRecord): void {
  const current = getAllPosSales();

  // Prevent duplicate
  if (current.some((s) => s.saleNumber === sale.saleNumber)) {
    return;
  }

  const updated = [sale, ...current].slice(0, 500);
  globalPosStore.__possSalesCache = updated;

  // Persist to TMP file (writable in Vercel serverless)
  try {
    ensureDirSafe(TMP_DATA_DIR);
    fs.writeFileSync(TMP_POS_SALES_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("[PosSalesData] Failed to write TMP pos_sales.json:", err);
  }

  // Persist to local project directory (local dev)
  try {
    ensureDirSafe(CWD_DATA_DIR);
    fs.writeFileSync(CWD_POS_SALES_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch {
    // Read-only filesystem on Vercel is expected and safe to ignore
  }
}

// Backwards-compatible export: computed array from globalThis cache
// (Note: on serverless, use getAllPosSales() for freshest data)
export const livePosSales: PosSaleRecord[] = new Proxy([] as PosSaleRecord[], {
  get(target, prop, receiver) {
    const live = getAllPosSales();
    if (prop === "length") return live.length;
    if (prop === Symbol.iterator) return live[Symbol.iterator].bind(live);
    if (typeof prop === "string" && !isNaN(Number(prop))) return live[Number(prop)];
    // For array methods like find, some, map, filter, etc.
    if (typeof prop === "string" && typeof (live as any)[prop] === "function") {
      return (live as any)[prop].bind(live);
    }
    return Reflect.get(target, prop, receiver);
  },
});
