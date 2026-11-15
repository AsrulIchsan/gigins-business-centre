import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_CUSTOMERS,
  MOCK_DOCTORS,
  MOCK_SUPPLIERS,
  INITIAL_PRODUCTS,
  MockCustomer,
  MockProduct,
  MockProductUnit,
  MockBatch,
} from "./mock-data";

export interface MockDoctor {
  id: string;
  name: string;
  sip: string;
  clinic: string;
}

export interface MockSupplierItem {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  termDays: number;
  isConsignment: boolean;
}

const DEFAULT_CATEGORIES = [
  "Analgesik & Antipiretik",
  "Antibiotik",
  "Antihistamin & Alergi",
  "Gastrointestinal & Lambung",
  "Kardiovaskular & Hipertensi",
  "Vitamin & Suplemen",
  "Alat Kesehatan & Medis",
  "Herbal & Suplemen",
  "Bahan Baku Racikan",
  "Mainan Edukasi",
  "Mainan Remote Control",
  "Boneka & Action Figure",
  "Aksesoris & Lainnya",
];

interface MasterDataState {
  customers: MockCustomer[];
  doctors: MockDoctor[];
  suppliers: MockSupplierItem[];
  categories: string[];
  products: MockProduct[];

  // Actions
  addCustomer: (data: {
    name: string;
    phone?: string;
    tier?: "REGULAR" | "SILVER" | "GOLD" | "PLATINUM";
    discountPct?: number;
  }) => MockCustomer;

  addDoctor: (data: {
    name: string;
    clinic?: string;
    sip?: string;
  }) => MockDoctor;

  addSupplier: (data: {
    name: string;
    code?: string;
    contact?: string;
    phone?: string;
    termDays?: number;
    isConsignment?: boolean;
  }) => MockSupplierItem;

  addCategory: (category: string) => string;

  // Product Actions for Owner (POS & Master Data)
  addProduct: (productData: {
    name: string;
    genericName?: string;
    category?: string;
    barcode?: string;
    baseUnit?: string;
    buyPrice?: number;
    sellPrice?: number;
    initialStock?: number;
    batchNumber?: string;
    expiredDate?: string;
    supplierName?: string;
    isConsignment?: boolean;
    units?: MockProductUnit[];
  }) => MockProduct;

  updateProduct: (id: string, updates: Partial<MockProduct>) => MockProduct | null;
  updateProductStock: (id: string, newTotalStock: number, reason?: string) => void;
  updateProductPrice: (id: string, unitIndex: number, newSellPrice: number, newBuyPrice?: number) => void;
}

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      customers: MOCK_CUSTOMERS,
      doctors: MOCK_DOCTORS,
      suppliers: MOCK_SUPPLIERS,
      categories: DEFAULT_CATEGORIES,
      products: INITIAL_PRODUCTS,

      addCustomer: (data) => {
        const tier = data.tier || "REGULAR";
        const discountPct =
          data.discountPct !== undefined
            ? data.discountPct
            : tier === "PLATINUM"
            ? 7
            : tier === "GOLD"
            ? 5
            : tier === "SILVER"
            ? 3
            : 0;

        const newCustomer: MockCustomer = {
          id: `cust-${Date.now()}`,
          name: data.name.trim(),
          phone: data.phone?.trim() || "-",
          memberCode: `MBR-${Date.now().toString().slice(-4)}`,
          tier,
          points: 100,
          discountPct,
        };

        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }));

        return newCustomer;
      },

      addDoctor: (data) => {
        const newDoctor: MockDoctor = {
          id: `doc-${Date.now()}`,
          name: data.name.trim(),
          clinic: data.clinic?.trim() || "Praktek Mandiri",
          sip: data.sip?.trim() || `503/SIP/${new Date().getFullYear()}`,
        };

        set((state) => ({
          doctors: [newDoctor, ...state.doctors],
        }));

        return newDoctor;
      },

      addSupplier: (data) => {
        const code =
          data.code?.trim().toUpperCase() ||
          `PBF-${data.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 4)
            .toUpperCase()}`;

        const newSupplier: MockSupplierItem = {
          id: `sup-${Date.now()}`,
          code,
          name: data.name.trim(),
          contact: data.contact?.trim() || "Bagian Penjualan",
          phone: data.phone?.trim() || "-",
          termDays: data.termDays || 30,
          isConsignment: data.isConsignment || false,
        };

        set((state) => ({
          suppliers: [newSupplier, ...state.suppliers],
        }));

        return newSupplier;
      },

      addCategory: (category) => {
        const trimmed = category.trim();
        if (!trimmed) return trimmed;

        set((state) => {
          if (state.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            return state;
          }
          return { categories: [...state.categories, trimmed] };
        });

        return trimmed;
      },

      addProduct: (data) => {
        const id = `prod-${Date.now()}`;
        const baseUnit = data.baseUnit?.trim() || "Tablet";
        const buyPrice = data.buyPrice || 1000;
        const sellPrice = data.sellPrice || Math.round(buyPrice * 1.25);
        const stockQty = data.initialStock !== undefined ? data.initialStock : 100;
        const batchNum = data.batchNumber?.trim() || `BCH-${Date.now().toString().slice(-6)}`;
        const expDate = data.expiredDate?.trim() || "2027-12-31T00:00:00.000Z";

        const defaultUnit: MockProductUnit = {
          id: `u-${id}-base`,
          unitName: baseUnit,
          conversionFactor: 1,
          isBaseUnit: true,
          buyPrice,
          sellPrice,
        };

        const units = data.units && data.units.length > 0 ? data.units : [defaultUnit];

        const defaultBatch: MockBatch = {
          id: `b-${id}-1`,
          batchNumber: batchNum,
          expiredDate: expDate,
          quantity: stockQty,
          buyPrice,
        };

        const newProd: MockProduct = {
          id,
          name: data.name.trim(),
          genericName: data.genericName?.trim() || data.name.trim(),
          category: data.category?.trim() || "Analgesik & Antipiretik",
          barcode: data.barcode?.trim() || `899${Date.now().toString().slice(-9)}`,
          isConsignment: data.isConsignment || false,
          supplierName: data.supplierName?.trim() || "PT Kimia Farma Trading & Dist",
          minStock: 20,
          maxStock: 500,
          baseUnit,
          units,
          batches: [defaultBatch],
          totalStock: stockQty,
          defaultMarginPct: Math.round(((sellPrice - buyPrice) / buyPrice) * 100) || 25,
        };

        set((state) => ({
          products: [newProd, ...(state.products || INITIAL_PRODUCTS)],
        }));

        return newProd;
      },

      updateProduct: (id, updates) => {
        let updatedProd: MockProduct | null = null;
        set((state) => {
          const currentList = state.products || INITIAL_PRODUCTS;
          const list = currentList.map((p) => {
            if (p.id === id) {
              updatedProd = { ...p, ...updates };
              return updatedProd;
            }
            return p;
          });
          return { products: list };
        });
        return updatedProd;
      },

      updateProductStock: (id, newTotalStock) => {
        set((state) => {
          const currentList = state.products || INITIAL_PRODUCTS;
          const list = currentList.map((p) => {
            if (p.id === id) {
              const diff = newTotalStock - p.totalStock;
              const batches = [...p.batches];
              if (batches.length > 0) {
                batches[0] = {
                  ...batches[0],
                  quantity: Math.max(0, batches[0].quantity + diff),
                };
              }
              return {
                ...p,
                totalStock: newTotalStock,
                batches,
              };
            }
            return p;
          });
          return { products: list };
        });
      },

      updateProductPrice: (id, unitIndex, newSellPrice, newBuyPrice) => {
        set((state) => {
          const currentList = state.products || INITIAL_PRODUCTS;
          const list = currentList.map((p) => {
            if (p.id === id) {
              const units = [...p.units];
              if (units[unitIndex]) {
                units[unitIndex] = {
                  ...units[unitIndex],
                  sellPrice: newSellPrice,
                  buyPrice: newBuyPrice !== undefined ? newBuyPrice : units[unitIndex].buyPrice,
                };
              }
              return { ...p, units };
            }
            return p;
          });
          return { products: list };
        });
      },
    }),
    {
      name: "gigins-master-data-storage",
    }
  )
);
