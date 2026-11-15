import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BusinessType = "PHARMACY" | "RETAIL_TOYS";
export type BusinessRole = "OWNER" | "MANAGER" | "KASIR";

export interface BusinessStats {
  todaySales: number;
  txCount: number;
  totalStockValue: number;
  stockAlerts: number;
  lowStockCount: number;
}

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  type: BusinessType;
  typeLabel: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  themeColor: "emerald" | "amber" | "indigo";
  role: BusinessRole;
  responsiblePerson: string;
  licenseNumber: string;
  enabledModules: string[];
  stats: BusinessStats;
}

export const BUSINESS_UNITS: BusinessUnit[] = [
  {
    id: "biz-apotik-tamansari",
    name: "Apotik Tamansari",
    slug: "apotik-tamansari",
    type: "PHARMACY",
    typeLabel: "Apotek & Farmasi",
    tagline: "Sistem Informasi Manajemen & POS Apotek Terpadu",
    description: "Unit Bisnis Farmasi, Resep Dokter, Obat Keras/Bebas, Konsinyasi & Pelaporan BPOM",
    address: "Jl. Tamansari No. 45, Bandung, Jawa Barat",
    phone: "022-2501234",
    themeColor: "emerald",
    role: "OWNER",
    responsiblePerson: "apt. Nurul Aulia, S.Farm (APA)",
    licenseNumber: "SIPA: 19850412/SIPA-32.73/2022/2001",
    enabledModules: [
      "pos",
      "pos_mobile",
      "inventory",
      "kartu_stok",
      "opname",
      "konsinyasi",
      "purchasing",
      "pbf_orders",
      "pbf_invoices",
      "retur",
      "crm",
      "whatsapp",
      "online_orders",
      "accounting",
      "reports",
      "prescription",
      "compounding",
      "bpom_expiry",
    ],
    stats: {
      todaySales: 4850000,
      txCount: 38,
      totalStockValue: 182400000,
      stockAlerts: 4,
      lowStockCount: 3,
    },
  },
  {
    id: "biz-toko-mainan-lelea",
    name: "Toko Mainan Pasar Lelea",
    slug: "toko-mainan-pasar-lelea",
    type: "RETAIL_TOYS",
    typeLabel: "Retail & Grosir Mainan",
    tagline: "Pusat Mainan Anak, Edukasi, RC & Hobi Terlengkap",
    description: "Unit Bisnis Penjualan Grosir & Eceran Aneka Mainan, Barcode Scanner Cepat, & Diskon Partai",
    address: "Pasar Lelea Blok B No. 12, Lelea, Indramayu, Jawa Barat",
    phone: "0812-3456-7890",
    themeColor: "amber",
    role: "OWNER",
    responsiblePerson: "Gigin (Owner / Pengelola Toko)",
    licenseNumber: "NIB: 9120003418821 / IUMK Pasar Lelea",
    enabledModules: [
      "pos",
      "pos_mobile",
      "inventory",
      "kartu_stok",
      "opname",
      "purchasing",
      "retur",
      "crm",
      "whatsapp",
      "accounting",
      "reports",
      "barcode_scanning",
      "wholesale_pricing",
    ],
    stats: {
      todaySales: 3620000,
      txCount: 27,
      totalStockValue: 95400000,
      stockAlerts: 1,
      lowStockCount: 2,
    },
  },
];

interface BusinessStoreState {
  platformName: string;
  activeBusiness: BusinessUnit;
  availableBusinesses: BusinessUnit[];
  switchBusiness: (slugOrId: string) => void;
  isModuleEnabled: (moduleKey: string) => boolean;
}

export const useBusinessStore = create<BusinessStoreState>()(
  persist(
    (set, get) => ({
      platformName: "Gigin's Business Centre",
      activeBusiness: BUSINESS_UNITS[0],
      availableBusinesses: BUSINESS_UNITS,

      switchBusiness: (slugOrId: string) => {
        const found = BUSINESS_UNITS.find(
          (b) => b.slug === slugOrId || b.id === slugOrId
        );
        if (found) {
          set({ activeBusiness: found });
        }
      },

      isModuleEnabled: (moduleKey: string) => {
        const current = get().activeBusiness;
        return current.enabledModules.includes(moduleKey);
      },
    }),
    {
      name: "gigins_business_centre_session",
    }
  )
);
