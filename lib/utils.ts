import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

/**
 * Format date in Indonesian locale (e.g. 14 Nov 2026, 15:30)
 */
export function formatDateIndo(date: Date | string | null | undefined, includeTime = false): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  };
  return new Intl.DateTimeFormat("id-ID", options).format(d);
}

/**
 * Calculate sell price based on HPP and desired margin percentage
 * Formula: Harga Jual = HPP + (HPP * Margin / 100)
 */
export function calculateSellPrice(costPrice: number, marginPct: number): number {
  if (costPrice <= 0) return 0;
  const markup = costPrice * (marginPct / 100);
  return Math.round(costPrice + markup);
}

/**
 * Calculate margin percentage based on HPP and Sell Price
 * Formula: Margin % = ((Harga Jual - HPP) / HPP) * 100
 */
export function calculateMarginPercentage(costPrice: number, sellPrice: number): number {
  if (costPrice <= 0) return 0;
  return Number((((sellPrice - costPrice) / costPrice) * 100).toFixed(2));
}

/**
 * Get days remaining until expiration date
 */
export function getDaysUntilExpiration(expiredDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiredDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get color badge styling based on expiration urgency
 */
export function getExpirationBadge(expiredDate: Date | string) {
  const days = getDaysUntilExpiration(expiredDate);
  if (days < 0) {
    return {
      label: `Kedaluwarsa (${Math.abs(days)} hari lalu)`,
      variant: "destructive",
      badgeColor: "bg-red-600 text-white border-red-700",
      urgency: "EXPIRED",
    };
  } else if (days <= 30) {
    return {
      label: `H-${days} Hari (Kritis)`,
      variant: "destructive",
      badgeColor: "bg-rose-500 text-white border-rose-600",
      urgency: "CRITICAL",
    };
  } else if (days <= 90) {
    return {
      label: `H-${days} Hari (Peringatan)`,
      variant: "warning",
      badgeColor: "bg-amber-500 text-white border-amber-600",
      urgency: "WARNING",
    };
  } else if (days <= 180) {
    return {
      label: `H-${days} Hari (Perhatian)`,
      variant: "outline",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      urgency: "ATTENTION",
    };
  }
  return {
    label: `Aman (${days} hari)`,
    variant: "secondary",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    urgency: "SAFE",
  };
}
