/**
 * lib/ai-pharmacist.ts
 * Helper types & shared constants untuk Asisten Apoteker Pintar
 * Digunakan bersama oleh API route & komponen UI
 */

export type DrugClass = "BEBAS" | "BEBAS_TERBATAS" | "KERAS";

export interface PharmacyStockItem {
  productId: string;
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  indication?: string;
  drugClass: DrugClass;
  sellingPrice: number;
  totalStock: number;
  baseUnit: string;
}

export interface AiRecommendedProduct {
  productId: string;
  name: string;
  price: number;
  dosageNote: string;
  requiresPrescription: boolean;
  drugClass: DrugClass;
  stock: number;
  baseUnit: string;
}

export interface AiPharmacistResponse {
  medicalNote: string;
  contraindications?: string;
  recommendedProducts: AiRecommendedProduct[];
  disclaimer: string;
  requiresPrescriptionOverall: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  data?: AiPharmacistResponse;
  isError?: boolean;
}

/** Map golongan obat → badge warna & label */
export const DRUG_CLASS_CONFIG: Record<
  DrugClass,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  BEBAS: {
    label: "Obat Bebas",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  BEBAS_TERBATAS: {
    label: "Bebas Terbatas",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  KERAS: {
    label: "Obat Keras",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};
