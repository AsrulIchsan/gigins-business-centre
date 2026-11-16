/**
 * lib/store-data.ts
 * Data Katalog, Kategori, & Tipe Pelanggan Webstore Apotik Tamansari
 */

export interface StoreProduct {
  id: string;
  name: string;
  genericName: string;
  category: string;
  categoryKey: "BEBAS" | "LAMBUNG" | "VITAMIN" | "ALERGI" | "HERBAL" | "ALKES";
  price: number;
  unit: string;
  stock: number;
  prescriptionRequired: boolean;
  indication: string;
  dosage: string;
  sideEffects?: string;
  bpom: string;
  rating: number;
  soldCount: number;
  colorTheme: string;
}

export interface CustomerVitalRegistration {
  name: string; // Wajib
  phone: string; // Wajib
  address: string; // Wajib
  email?: string; // Opsional (tidak wajib)
  password: string; // Wajib (untuk login)
}

export interface StoreCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  memberCode: string;
  points: number;
  tier: "REGULAR" | "SILVER" | "GOLD";
  createdAt: string;
}

export interface StoreCartItem {
  product: StoreProduct;
  quantity: number;
}

export const STORE_CATEGORIES = [
  { key: "ALL", label: "Semua Produk", icon: "Boxes" },
  { key: "BEBAS", label: "Obat Bebas & Flu", icon: "Pill" },
  { key: "LAMBUNG", label: "Lambung & Maag", icon: "ShieldCheck" },
  { key: "VITAMIN", label: "Vitamin & Imunitas", icon: "Sparkles" },
  { key: "ALERGI", label: "Antihistamin & Kulit", icon: "Heart" },
  { key: "HERBAL", label: "Herbal & Madu", icon: "Leaf" },
  { key: "ALKES", label: "P3K & Alat Kesehatan", icon: "Cross" },
] as const;

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "prod-1",
    name: "Sanmol 500mg (Paracetamol)",
    genericName: "Paracetamol 500 mg",
    category: "Analgesik & Antipiretik",
    categoryKey: "BEBAS",
    price: 5000,
    unit: "Strip (10 Tablet)",
    stock: 410,
    prescriptionRequired: false,
    indication: "Meredakan rasa sakit kepala, sakit gigi, dan menurunkan demam.",
    dosage: "Dewasa: 1-2 tablet 3-4 kali sehari setelah makan. Anak 6-12 tahun: 1/2-1 tablet 3-4 kali sehari.",
    sideEffects: "Reaksi alergi ringan (sangat jarang jika sesuai dosis).",
    bpom: "DBL7622235610A1",
    rating: 4.9,
    soldCount: 342,
    colorTheme: "emerald",
  },
  {
    id: "prod-2",
    name: "Amoxicillin 500mg Hexpharm",
    genericName: "Amoxicillin Trihydrate 500 mg",
    category: "Antibiotik",
    categoryKey: "BEBAS",
    price: 8000,
    unit: "Strip (10 Kapsul)",
    stock: 300,
    prescriptionRequired: true,
    indication: "Antibiotik spektrum luas untuk infeksi bakteri saluran nafas, kulit, dan saluran kemih.",
    dosage: "Dewasa: 1 kapsul setiap 8 jam. Wajib dihabiskan sesuai anjuran apoteker / resep dokter.",
    sideEffects: "Mual ringan, diare ringan pada individu sensitif.",
    bpom: "GKL9808504501A1",
    rating: 4.8,
    soldCount: 184,
    colorTheme: "rose",
  },
  {
    id: "prod-3",
    name: "Cetirizine 10mg Novell",
    genericName: "Cetirizine Dihydrochloride 10 mg",
    category: "Antihistamin & Alergi",
    categoryKey: "ALERGI",
    price: 11000,
    unit: "Strip (10 Tablet)",
    stock: 195,
    prescriptionRequired: false,
    indication: "Mengatasi gejala alergi seperti rhinitis alergi, biduran, mata berair, dan gatal kulit.",
    dosage: "Dewasa & anak > 12 tahun: 1 tablet 1 kali sehari pada malam hari.",
    sideEffects: "Dapat menyebabkan rasa kantuk ringan pada sebagian orang.",
    bpom: "DKL0231526417A1",
    rating: 4.9,
    soldCount: 220,
    colorTheme: "indigo",
  },
  {
    id: "prod-4",
    name: "Antasida Doen Tablet Kunyah",
    genericName: "Aluminium Hidroksida 200mg + Magnesium Hidroksida 200mg",
    category: "Saluran Cerna & Lambung",
    categoryKey: "LAMBUNG",
    price: 4000,
    unit: "Strip (10 Tablet)",
    stock: 270,
    prescriptionRequired: false,
    indication: "Menetralkan asam lambung, mengatasi kembung, nyeri ulu hati, dan rasa terbakar di dada (maag).",
    dosage: "Kunyah 1-2 tablet 1 jam sebelum makan atau 2 jam setelah makan dan menjelang tidur malam.",
    sideEffects: "Konstipasi ringan atau diare jika berlebihan.",
    bpom: "GBL9808505563A1",
    rating: 4.8,
    soldCount: 310,
    colorTheme: "amber",
  },
  {
    id: "prod-5",
    name: "Imboost Force Strip",
    genericName: "Echinacea purpurea extract, Zinc Picolinate, Black Elderberry",
    category: "Vitamin & Daya Tahan Tubuh",
    categoryKey: "VITAMIN",
    price: 38500,
    unit: "Strip (10 Kaplet)",
    stock: 115,
    prescriptionRequired: false,
    indication: "Membantu memelihara daya tahan tubuh, mempercepat masa pemulihan dari flu dan sakit.",
    dosage: "Dewasa: 1 kaplet 3 kali sehari setelah makan.",
    bpom: "SD021503871",
    rating: 5.0,
    soldCount: 489,
    colorTheme: "purple",
  },
  {
    id: "prod-6",
    name: "Madu Herbal TJ Murni 150g",
    genericName: "Madu Alami 100% Pilihan",
    category: "Herbal & Suplemen",
    categoryKey: "HERBAL",
    price: 25000,
    unit: "Botol 150 gram",
    stock: 64,
    prescriptionRequired: false,
    indication: "Meningkatkan stamina alami tubuh, kaya antioksidan dan enzim alami untuk kesehatan keluarga.",
    dosage: "1-2 sendok makan sehari, dapat diminum langsung atau dicampur air hangat.",
    bpom: "TR182616831",
    rating: 4.9,
    soldCount: 198,
    colorTheme: "amber",
  },
  {
    id: "prod-7",
    name: "Minyak Kayu Putih Cap Lang 60ml",
    genericName: "Oleum Cajuputi 100%",
    category: "Minyak Gosok & Herbal",
    categoryKey: "HERBAL",
    price: 22000,
    unit: "Botol 60 ml",
    stock: 85,
    prescriptionRequired: false,
    indication: "Menghangatkan tubuh, meredakan masuk angin, perut kembung, dan gigitan serangga.",
    dosage: "Oleskan secukupnya pada dada, punggung, atau bagian yang sakit.",
    bpom: "TR142679841",
    rating: 5.0,
    soldCount: 512,
    colorTheme: "emerald",
  },
  {
    id: "prod-8",
    name: "Vitamin C 500mg IPI",
    genericName: "Ascorbic Acid (Vitamin C) 500 mg",
    category: "Vitamin & Suplemen",
    categoryKey: "VITAMIN",
    price: 9500,
    unit: "Pot (45 Tablet Hisap)",
    stock: 160,
    prescriptionRequired: false,
    indication: "Memenuhi kebutuhan harian vitamin C, mencegah sariawan, dan menjaga kekebalan imun tubuh.",
    dosage: "1 tablet hisap sehari setelah makan.",
    bpom: "SD141546241",
    rating: 4.9,
    soldCount: 420,
    colorTheme: "orange",
  },
  {
    id: "prod-9",
    name: "Betadine Antiseptic Solution 15ml",
    genericName: "Povidone-Iodine 10%",
    category: "P3K & Antiseptik",
    categoryKey: "ALKES",
    price: 18500,
    unit: "Botol 15 ml",
    stock: 92,
    prescriptionRequired: false,
    indication: "Antiseptik untuk mencegah infeksi pada luka gores, lecet, dan luka bakar ringan.",
    dosage: "Oleskan atau teteskan pada luka yang telah dibersihkan 2 kali sehari.",
    bpom: "PKD20501610052",
    rating: 4.9,
    soldCount: 165,
    colorTheme: "rose",
  },
  {
    id: "prod-10",
    name: "Hansaplast Plester Kain Elastis 10s",
    genericName: "Fabric Adhesive Plaster with Silver Anti-bacterial",
    category: "P3K & Alat Kesehatan",
    categoryKey: "ALKES",
    price: 8500,
    unit: "Amplop (10 Lembar)",
    stock: 210,
    prescriptionRequired: false,
    indication: "Melindungi luka terbuka dari kotoran dan bakteri, bahan lentur dan berpori.",
    dosage: "Bersihkan luka dan tempelkan plester, ganti secara berkala 1-2 kali sehari.",
    bpom: "AKL10902611728",
    rating: 4.8,
    soldCount: 378,
    colorTheme: "blue",
  },
  {
    id: "prod-11",
    name: "Mylanta Suspensi Cair 50ml",
    genericName: "Aluminium Hidroksida, Magnesium Hidroksida, Simetikon",
    category: "Saluran Cerna & Lambung",
    categoryKey: "LAMBUNG",
    price: 21000,
    unit: "Botol 50 ml",
    stock: 78,
    prescriptionRequired: false,
    indication: "Bekerja cepat meredakan rasa perih di lambung, kembung berlebih, dan tukak lambung.",
    dosage: "Dewasa: 1-2 sendok takar (5-10 ml) 3-4 kali sehari saat perut kosong.",
    bpom: "DBL1441200233A1",
    rating: 4.9,
    soldCount: 231,
    colorTheme: "teal",
  },
  {
    id: "prod-12",
    name: "Bodrex Extra Tablet",
    genericName: "Paracetamol 350 mg, Ibuprofen 200 mg, Kafein 50 mg",
    category: "Obat Sakit Kepala & Nyeri",
    categoryKey: "BEBAS",
    price: 3500,
    unit: "Blister (4 Kaplet)",
    stock: 350,
    prescriptionRequired: false,
    indication: "Meredakan sakit kepala berat, nyeri berdenyut, dan sakit gigi.",
    dosage: "Dewasa: 1-2 kaplet 3 kali sehari setelah makan.",
    bpom: "DTL0603700904A1",
    rating: 4.8,
    soldCount: 610,
    colorTheme: "red",
  },
];

// Initial mock customers for demonstration
export const INITIAL_STORE_CUSTOMERS: StoreCustomer[] = [
  {
    id: "cust-store-001",
    name: "Rina Marlina",
    phone: "08122334455",
    address: "Jl. Tamansari Dalam No. 18, RT 02/RW 04, Bandung",
    email: "rina.marlina@example.com",
    memberCode: "MBR-TAMAN-1001",
    points: 150,
    tier: "SILVER",
    createdAt: "2026-10-15T08:00:00.000Z",
  },
  {
    id: "cust-store-002",
    name: "Budi Santoso",
    phone: "081234567890",
    address: "Jl. Ir. H. Juanda (Dago) No. 92, Bandung",
    email: "budi.santoso@example.com",
    memberCode: "MBR-TAMAN-1002",
    points: 450,
    tier: "GOLD",
    createdAt: "2026-09-01T10:30:00.000Z",
  },
];
