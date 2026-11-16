/**
 * lib/store-settings.ts
 * Konfigurasi Pengaturan Webstore Apotik Tamansari
 * Dapat diubah oleh Owner melalui Menu Kontrol Webstore
 */

export interface WebstoreSettings {
  storeName: string;
  storeDescription: string;
  whatsappNumber: string;
  whatsappGreeting: string;
  operatingHours: string;
  pharmacyAddress: string;
  sipaNumber: string;
  isStoreOpen: boolean;
  shipping: {
    instantRate: number; // e.g. 10000
    instantLabel: string;
    instantEnabled: boolean;
    regularRate: number; // e.g. 8000
    regularLabel: string;
    regularEnabled: boolean;
    pickupEnabled: boolean;
    pickupLabel: string;
    freeShippingThreshold: number; // e.g. 100000 (0 jika nonaktif)
  };
  payment: {
    qrisEnabled: boolean;
    qrisImageUrl: string; // Base64 data URL atau path gambar
    qrisNmid: string;
    bankTransferEnabled: boolean;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    codEnabled: boolean;
    codMaxAmount: number;
  };
  banner: {
    enabled: boolean;
    text: string;
  };
}

// Sample default QRIS SVG Data URL (Apotik Tamansari QRIS Standar Pembayaran Nasional)
export const DEFAULT_QRIS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320"><rect width="320" height="320" fill="white" rx="16"/><rect x="20" y="20" width="280" height="48" fill="%23065F46" rx="8"/><text x="160" y="50" fill="white" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle" letter-spacing="2">QRIS APOTIK TAMANSARI</text><rect x="40" y="80" width="70" height="70" fill="none" stroke="%231E293B" stroke-width="8"/><rect x="55" y="95" width="40" height="40" fill="%231E293B"/><rect x="210" y="80" width="70" height="70" fill="none" stroke="%231E293B" stroke-width="8"/><rect x="225" y="95" width="40" height="40" fill="%231E293B"/><rect x="40" y="210" width="70" height="70" fill="none" stroke="%231E293B" stroke-width="8"/><rect x="55" y="225" width="40" height="40" fill="%231E293B"/><rect x="130" y="85" width="60" height="60" fill="%23059669"/><rect x="85" y="165" width="150" height="25" fill="%230F172A"/><rect x="130" y="205" width="60" height="60" fill="%23059669"/><rect x="210" y="210" width="30" height="30" fill="%231E293B"/><rect x="250" y="250" width="30" height="30" fill="%231E293B"/><text x="160" y="300" fill="%23475569" font-family="sans-serif" font-weight="700" font-size="11" text-anchor="middle">NMID: ID1020039281726 &bull; RESMI APOTEK</text></svg>`;

export const DEFAULT_WEBSTORE_SETTINGS: WebstoreSettings = {
  storeName: "Apotik Tamansari Webstore",
  storeDescription: "Pelayanan Resep & Toko Obat Resmi Apotik Tamansari",
  whatsappNumber: "08122334455",
  whatsappGreeting: "Halo Apotik Tamansari, saya ingin konsultasi obat dan konfirmasi pesanan webstore.",
  operatingHours: "07.00 - 22.00 WIB",
  pharmacyAddress: "Jl. Tamansari No. 45, Coblong, Kota Bandung, Jawa Barat 40132",
  sipaNumber: "19850412/SIPA-32.73/2022/2001",
  isStoreOpen: true,
  shipping: {
    instantRate: 10000,
    instantLabel: "Kurir Instan Apotik (1-2 Jam)",
    instantEnabled: true,
    regularRate: 8000,
    regularLabel: "Ekspedisi Reguler (1-2 Hari)",
    regularEnabled: true,
    pickupEnabled: true,
    pickupLabel: "Ambil Sendiri di Apotik Tamansari (Pick-Up)",
    freeShippingThreshold: 100000, // Belanja di atas 100rb gratis ongkir
  },
  payment: {
    qrisEnabled: true,
    qrisImageUrl: DEFAULT_QRIS_SVG,
    qrisNmid: "ID1020039281726",
    bankTransferEnabled: true,
    bankName: "BCA (Bank Central Asia)",
    bankAccountNumber: "777-089-1234",
    bankAccountName: "Apotik Tamansari Sejahtera",
    codEnabled: true,
    codMaxAmount: 500000,
  },
  banner: {
    enabled: true,
    text: "Promo Spesial: Gratis Ongkir untuk Pesanan di atas Rp 100.000 ke Seluruh Bandung!",
  },
};

const SETTINGS_STORAGE_KEY = "apotik_tamansari_webstore_settings";

export function getLocalStoreSettings(): WebstoreSettings {
  if (typeof window === "undefined") return DEFAULT_WEBSTORE_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_WEBSTORE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn("Failed to read webstore settings from localStorage:", err);
  }
  return DEFAULT_WEBSTORE_SETTINGS;
}

export function saveLocalStoreSettings(settings: WebstoreSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save webstore settings to localStorage:", err);
  }
}
