export interface MockProductUnit {
  id: string;
  unitName: string;
  conversionFactor: number; // e.g. 1 Box = 10 Strip = 100 Tablet
  isBaseUnit: boolean;
  buyPrice: number;
  sellPrice: number;
}

export interface MockBatch {
  id: string;
  batchNumber: string;
  expiredDate: string; // ISO string
  quantity: number; // in base units
  buyPrice: number;
}

export interface MockProduct {
  id: string;
  name: string;
  genericName: string;
  category: string;
  barcode: string;
  isConsignment: boolean;
  supplierName: string;
  minStock: number;
  maxStock: number;
  baseUnit: string;
  units: MockProductUnit[];
  batches: MockBatch[];
  totalStock: number; // sum of batch quantities
  defaultMarginPct: number;
}

export const INITIAL_PRODUCTS: MockProduct[] = [
  {
    id: "prod-1",
    name: "Sanmol 500mg (Paracetamol)",
    genericName: "Paracetamol",
    category: "Analgesik & Antipiretik",
    barcode: "899123456001",
    isConsignment: false,
    supplierName: "PT Kimia Farma Trading & Dist",
    minStock: 50,
    maxStock: 500,
    baseUnit: "Tablet",
    defaultMarginPct: 25,
    units: [
      { id: "u-1-tab", unitName: "Tablet", conversionFactor: 1, isBaseUnit: true, buyPrice: 400, sellPrice: 500 },
      { id: "u-1-str", unitName: "Strip", conversionFactor: 10, isBaseUnit: false, buyPrice: 4000, sellPrice: 5000 },
      { id: "u-1-box", unitName: "Box", conversionFactor: 100, isBaseUnit: false, buyPrice: 38000, sellPrice: 48000 },
    ],
    batches: [
      { id: "b-1-1", batchNumber: "BCH-SNM-24A", expiredDate: "2026-12-10T00:00:00.000Z", quantity: 60, buyPrice: 400 }, // Expiring soon! (H-26)
      { id: "b-1-2", batchNumber: "BCH-SNM-25B", expiredDate: "2027-05-15T00:00:00.000Z", quantity: 150, buyPrice: 400 },
      { id: "b-1-3", batchNumber: "BCH-SNM-26C", expiredDate: "2027-11-20T00:00:00.000Z", quantity: 200, buyPrice: 420 },
    ],
    totalStock: 410,
  },
  {
    id: "prod-2",
    name: "Amoxicillin 500mg Hexpharm",
    genericName: "Amoxicillin Trihydrate",
    category: "Antibiotik",
    barcode: "899123456002",
    isConsignment: false,
    supplierName: "PT Anugrah Argon Medica",
    minStock: 30,
    maxStock: 300,
    baseUnit: "Kapsul",
    defaultMarginPct: 30,
    units: [
      { id: "u-2-kap", unitName: "Kapsul", conversionFactor: 1, isBaseUnit: true, buyPrice: 600, sellPrice: 800 },
      { id: "u-2-str", unitName: "Strip", conversionFactor: 10, isBaseUnit: false, buyPrice: 6000, sellPrice: 8000 },
      { id: "u-2-box", unitName: "Box", conversionFactor: 100, isBaseUnit: false, buyPrice: 58000, sellPrice: 75000 },
    ],
    batches: [
      { id: "b-2-1", batchNumber: "AMX-2024-09", expiredDate: "2027-02-14T00:00:00.000Z", quantity: 120, buyPrice: 600 },
      { id: "b-2-2", batchNumber: "AMX-2025-01", expiredDate: "2027-08-30T00:00:00.000Z", quantity: 180, buyPrice: 600 },
    ],
    totalStock: 300,
  },
  {
    id: "prod-3",
    name: "Cetirizine 10mg Novell",
    genericName: "Cetirizine HCl",
    category: "Antihistamin & Alergi",
    barcode: "899123456003",
    isConsignment: false,
    supplierName: "PT Mensa Bina Sukses",
    minStock: 40,
    maxStock: 250,
    baseUnit: "Tablet",
    defaultMarginPct: 35,
    units: [
      { id: "u-3-tab", unitName: "Tablet", conversionFactor: 1, isBaseUnit: true, buyPrice: 800, sellPrice: 1100 },
      { id: "u-3-str", unitName: "Strip", conversionFactor: 10, isBaseUnit: false, buyPrice: 8000, sellPrice: 11000 },
    ],
    batches: [
      { id: "b-3-1", batchNumber: "CTZ-24-X1", expiredDate: "2027-01-20T00:00:00.000Z", quantity: 45, buyPrice: 800 }, // H-67 (Peringatan)
      { id: "b-3-2", batchNumber: "CTZ-25-Y2", expiredDate: "2027-09-10T00:00:00.000Z", quantity: 150, buyPrice: 800 },
    ],
    totalStock: 195,
  },
  {
    id: "prod-4",
    name: "Antasida Doen Tablet Kunyah",
    genericName: "Alumunium Hidroksida, Magnesium Hidroksida",
    category: "Saluran Cerna & Lambung",
    barcode: "899123456004",
    isConsignment: false,
    supplierName: "PT Kimia Farma Trading & Dist",
    minStock: 100,
    maxStock: 600,
    baseUnit: "Tablet",
    defaultMarginPct: 25,
    units: [
      { id: "u-4-tab", unitName: "Tablet", conversionFactor: 1, isBaseUnit: true, buyPrice: 300, sellPrice: 400 },
      { id: "u-4-str", unitName: "Strip", conversionFactor: 10, isBaseUnit: false, buyPrice: 3000, sellPrice: 4000 },
      { id: "u-4-box", unitName: "Box", conversionFactor: 100, isBaseUnit: false, buyPrice: 28000, sellPrice: 38000 },
    ],
    batches: [
      { id: "b-4-1", batchNumber: "ATD-2024-K1", expiredDate: "2026-11-30T00:00:00.000Z", quantity: 20, buyPrice: 300 }, // Kritis! (H-16)
      { id: "b-4-2", batchNumber: "ATD-2025-L2", expiredDate: "2027-06-25T00:00:00.000Z", quantity: 250, buyPrice: 300 },
    ],
    totalStock: 270,
  },
  {
    id: "prod-5",
    name: "Amlodipine 10mg Dexa",
    genericName: "Amlodipine Besylate",
    category: "Kardiovaskular & Hipertensi",
    barcode: "899123456005",
    isConsignment: false,
    supplierName: "PT Anugrah Argon Medica",
    minStock: 50,
    maxStock: 400,
    baseUnit: "Tablet",
    defaultMarginPct: 30,
    units: [
      { id: "u-5-tab", unitName: "Tablet", conversionFactor: 1, isBaseUnit: true, buyPrice: 700, sellPrice: 950 },
      { id: "u-5-str", unitName: "Strip", conversionFactor: 10, isBaseUnit: false, buyPrice: 7000, sellPrice: 9500 },
      { id: "u-5-box", unitName: "Box", conversionFactor: 100, isBaseUnit: false, buyPrice: 68000, sellPrice: 90000 },
    ],
    batches: [
      { id: "b-5-1", batchNumber: "AML-24-001", expiredDate: "2027-04-10T00:00:00.000Z", quantity: 180, buyPrice: 700 },
    ],
    totalStock: 180,
  },
  {
    id: "prod-6",
    name: "Madu Herbal TJ Murni 150g (Konsinyasi)",
    genericName: "Mel Depuratum",
    category: "Herbal & Suplemen",
    barcode: "899123456006",
    isConsignment: true,
    supplierName: "CV Alami Sejahtera (Titipan)",
    minStock: 10,
    maxStock: 50,
    baseUnit: "Botol",
    defaultMarginPct: 20,
    units: [
      { id: "u-6-btl", unitName: "Botol", conversionFactor: 1, isBaseUnit: true, buyPrice: 20000, sellPrice: 25000 },
    ],
    batches: [
      { id: "b-6-1", batchNumber: "TJ-2024-H7", expiredDate: "2027-12-31T00:00:00.000Z", quantity: 24, buyPrice: 20000 },
    ],
    totalStock: 24,
  },
  {
    id: "prod-7",
    name: "Asam Salisilat Serbuk (Bahan Racik)",
    genericName: "Acidum Salicylicum",
    category: "Bahan Baku Racikan",
    barcode: "899123456007",
    isConsignment: false,
    supplierName: "PT Kimia Farma Trading & Dist",
    minStock: 100,
    maxStock: 1000,
    baseUnit: "Gram",
    defaultMarginPct: 50,
    units: [
      { id: "u-7-g", unitName: "Gram", conversionFactor: 1, isBaseUnit: true, buyPrice: 150, sellPrice: 300 },
    ],
    batches: [
      { id: "b-7-1", batchNumber: "SAL-2024-G1", expiredDate: "2028-01-01T00:00:00.000Z", quantity: 500, buyPrice: 150 },
    ],
    totalStock: 500,
  },
  {
    id: "prod-8",
    name: "Vaselin Album (Bahan Racik)",
    genericName: "Vaselin Putih",
    category: "Bahan Baku Racikan",
    barcode: "899123456008",
    isConsignment: false,
    supplierName: "PT Kimia Farma Trading & Dist",
    minStock: 200,
    maxStock: 2000,
    baseUnit: "Gram",
    defaultMarginPct: 50,
    units: [
      { id: "u-8-g", unitName: "Gram", conversionFactor: 1, isBaseUnit: true, buyPrice: 80, sellPrice: 150 },
    ],
    batches: [
      { id: "b-8-1", batchNumber: "VAS-2024-03", expiredDate: "2028-06-30T00:00:00.000Z", quantity: 1200, buyPrice: 80 },
    ],
    totalStock: 1200,
  },
];

export interface MockShift {
  id: string;
  shiftNumber: string;
  cashierName: string;
  cashierRole: string;
  openedAt: string;
  openingCash: number;
  status: "OPEN" | "CLOSED";
  salesCount: number;
  totalCashSales: number;
  totalNonCashSales: number;
  totalSales: number;
}

export const ACTIVE_SHIFT: MockShift = {
  id: "shift-today",
  shiftNumber: "SFT-20261114-01",
  cashierName: "Siti Rahma, A.Md.Farm",
  cashierRole: "TTK / Kasir",
  openedAt: "2026-11-14T07:00:00.000Z",
  openingCash: 300000, // Rp 300.000 modal kas awal
  status: "OPEN",
  salesCount: 14,
  totalCashSales: 540000,
  totalNonCashSales: 385000,
  totalSales: 925000,
};

export interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  memberCode: string;
  tier: "REGULAR" | "SILVER" | "GOLD" | "PLATINUM";
  points: number;
  discountPct: number;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: "c-1", name: "Budi Santoso", phone: "081234567890", memberCode: "MBR-001", tier: "GOLD", points: 450, discountPct: 5 },
  { id: "c-2", name: "Ibu Ratna Dewi", phone: "081987654321", memberCode: "MBR-002", tier: "SILVER", points: 210, discountPct: 3 },
  { id: "c-3", name: "Dr. Hendra Gunawan", phone: "085612349876", memberCode: "MBR-003", tier: "PLATINUM", points: 1200, discountPct: 7 },
  { id: "c-4", name: "Ahmad Fauzi", phone: "087711223344", memberCode: "MBR-004", tier: "REGULAR", points: 50, discountPct: 0 },
];

export const MOCK_DOCTORS = [
  { id: "doc-1", name: "dr. Hendra Gunawan, Sp.PD", sip: "503/445/SIP-Dokter/2022", clinic: "Klinik Sehat Tamansari" },
  { id: "doc-2", name: "dr. Maya Lestari, Sp.A", sip: "503/446/SIP-Dokter/2023", clinic: "Praktek Mandiri dr. Maya" },
  { id: "doc-3", name: "dr. Ahmad Subari, Sp.KK", sip: "503/447/SIP-Dokter/2021", clinic: "Klinik Kulit Estetika" },
];

export const MOCK_SUPPLIERS = [
  { id: "sup-1", code: "PBF-KF", name: "PT Kimia Farma Trading & Distribution", contact: "Pak Joko", phone: "022-7301234", termDays: 30, isConsignment: false },
  { id: "sup-2", code: "PBF-AAM", name: "PT Anugrah Argon Medica", contact: "Ibu Diana", phone: "022-7805678", termDays: 21, isConsignment: false },
  { id: "sup-3", code: "PBF-MBS", name: "PT Mensa Bina Sukses", contact: "Pak Irwan", phone: "022-6019988", termDays: 30, isConsignment: false },
  { id: "sup-4", code: "TITIP-ALAMI", name: "CV Alami Sejahtera (Herbal Titipan)", contact: "Bu Eni", phone: "081320001122", termDays: 0, isConsignment: true },
];

export const MOCK_ONLINE_ORDERS = [
  {
    id: "ord-1",
    orderNumber: "ORD-WEB-20261114-001",
    channel: "WEBSTORE_INTERNAL",
    customerName: "Rina Marlina",
    phone: "08122334455",
    items: [
      { name: "Sanmol 500mg (Paracetamol)", qty: 2, unit: "Strip", price: 5000, subtotal: 10000 },
      { name: "Cetirizine 10mg Novell", qty: 1, unit: "Strip", price: 11000, subtotal: 11000 },
    ],
    totalAmount: 21000,
    status: "PENDING",
    time: "10 menit lalu",
  },
  {
    id: "ord-2",
    orderNumber: "ORD-KD-20261114-002",
    channel: "KLIKDOKTER",
    customerName: "Dedi Supardi",
    phone: "08571239988",
    items: [
      { name: "Amoxicillin 500mg Hexpharm", qty: 2, unit: "Strip", price: 8000, subtotal: 16000 },
    ],
    totalAmount: 16000,
    status: "PROCESSING",
    time: "25 menit lalu",
  },
  {
    id: "ord-3",
    orderNumber: "ORD-WEB-20261114-003",
    channel: "WEBSTORE",
    customerName: "Siti Aminah",
    phone: "08961234567",
    items: [
      { name: "Madu Herbal TJ Murni 150g (Konsinyasi)", qty: 2, unit: "Botol", price: 25000, subtotal: 50000 },
    ],
    totalAmount: 50000,
    status: "COMPLETED",
    time: "1 jam lalu",
  },
];
