import { PrismaClient, UserRole, BusinessRole, BusinessType, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_COA } from "../lib/accounting";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding database Gigin's Business Centre...");

  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  // 1. Seed Business Units
  console.log("🏢 1. Inisialisasi Unit Bisnis Multi-Tenant...");
  const apotik = await prisma.business.upsert({
    where: { slug: "apotik-tamansari" },
    update: {
      name: "Apotik Tamansari",
      type: BusinessType.PHARMACY,
      isActive: true,
      address: "Jl. Tamansari No. 45, Bandung, Jawa Barat",
      phone: "022-2501234",
      description: "Unit Bisnis Farmasi, Resep Dokter, Obat-Obatan & Layanan Apotek Terpadu",
    },
    create: {
      id: "biz-apotik-tamansari",
      name: "Apotik Tamansari",
      slug: "apotik-tamansari",
      type: BusinessType.PHARMACY,
      isActive: true,
      address: "Jl. Tamansari No. 45, Bandung, Jawa Barat",
      phone: "022-2501234",
      description: "Unit Bisnis Farmasi, Resep Dokter, Obat-Obatan & Layanan Apotek Terpadu",
      enabledModules: [
        "pos",
        "inventory",
        "purchasing",
        "crm",
        "accounting",
        "reports",
        "prescription",
        "compounding",
        "consignment",
        "pbf",
        "bpom_expiry",
      ],
    },
  });

  const tokoMainan = await prisma.business.upsert({
    where: { slug: "toko-mainan-pasar-lelea" },
    update: {
      name: "Toko Mainan Pasar Lelea",
      type: BusinessType.RETAIL_TOYS,
      isActive: true,
      address: "Pasar Lelea Blok B No. 12, Lelea, Indramayu, Jawa Barat",
      phone: "0812-3456-7890",
      description: "Unit Bisnis Retail Grosir & Eceran Mainan Anak, Edukasi & Hobi",
    },
    create: {
      id: "biz-toko-mainan-lelea",
      name: "Toko Mainan Pasar Lelea",
      slug: "toko-mainan-pasar-lelea",
      type: BusinessType.RETAIL_TOYS,
      isActive: true,
      address: "Pasar Lelea Blok B No. 12, Lelea, Indramayu, Jawa Barat",
      phone: "0812-3456-7890",
      description: "Unit Bisnis Retail Grosir & Eceran Mainan Anak, Edukasi & Hobi",
      enabledModules: [
        "pos",
        "inventory",
        "purchasing",
        "crm",
        "accounting",
        "reports",
        "barcode_scanning",
        "wholesale_pricing",
      ],
    },
  });

  console.log(`   ✅ Bisnis Terdaftar: "${apotik.name}" & "${tokoMainan.name}"`);

  // 2. Seed Users & RBAC (Password di-hash bcrypt)
  console.log("👥 2. Inisialisasi Akun Real Pengguna (Bcrypt Hashed)...");

  // Akun 1: Owner (Gigin) — Akses Penuh /hub dan kedua bisnis
  const owner = await prisma.user.upsert({
    where: { email: "owner@gigin.com" },
    update: {
      name: "Gigin",
      hashedPassword: defaultPasswordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
    create: {
      id: "usr-owner-gigin",
      name: "Gigin",
      email: "owner@gigin.com",
      hashedPassword: defaultPasswordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  // Assign Owner ke kedua unit bisnis
  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: apotik.id } },
    update: { role: BusinessRole.OWNER },
    create: { userId: owner.id, businessId: apotik.id, role: BusinessRole.OWNER },
  });
  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: tokoMainan.id } },
    update: { role: BusinessRole.OWNER },
    create: { userId: owner.id, businessId: tokoMainan.id, role: BusinessRole.OWNER },
  });

  // Akun 2: Staff Kasir Apotik Tamansari
  const kasirApotik = await prisma.user.upsert({
    where: { email: "kasir.apotik@gigin.com" },
    update: {
      name: "Siti Rahma, A.Md.Farm",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
    create: {
      id: "usr-kasir-apotik",
      name: "Siti Rahma, A.Md.Farm",
      email: "kasir.apotik@gigin.com",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
  });

  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: kasirApotik.id, businessId: apotik.id } },
    update: { role: BusinessRole.KASIR, permissions: ["can_stock_opname"] },
    create: { userId: kasirApotik.id, businessId: apotik.id, role: BusinessRole.KASIR, permissions: ["can_stock_opname"] },
  });

  // Akun 3: Staff Kasir Toko Mainan Pasar Lelea
  const kasirMainan = await prisma.user.upsert({
    where: { email: "kasir.mainan@gigin.com" },
    update: {
      name: "Budi Santoso",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
    create: {
      id: "usr-kasir-mainan",
      name: "Budi Santoso",
      email: "kasir.mainan@gigin.com",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
  });

  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: kasirMainan.id, businessId: tokoMainan.id } },
    update: { role: BusinessRole.KASIR, permissions: ["can_stock_opname"] },
    create: { userId: kasirMainan.id, businessId: tokoMainan.id, role: BusinessRole.KASIR, permissions: ["can_stock_opname"] },
  });

  // Akun Tambahan: Akun Admin & Kasir Apotek Tamansari Lama
  const legacyAdmin = await prisma.user.upsert({
    where: { email: "admin@apotiktamansari.com" },
    update: {
      name: "Administrator Apotik",
      hashedPassword: defaultPasswordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
    create: {
      name: "Administrator Apotik",
      email: "admin@apotiktamansari.com",
      hashedPassword: defaultPasswordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  });
  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: legacyAdmin.id, businessId: apotik.id } },
    update: { role: BusinessRole.OWNER },
    create: { userId: legacyAdmin.id, businessId: apotik.id, role: BusinessRole.OWNER },
  });

  const legacyKasir = await prisma.user.upsert({
    where: { email: "kasir@apotiktamansari.com" },
    update: {
      name: "Kasir Apotik Tamansari",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
    create: {
      name: "Kasir Apotik Tamansari",
      email: "kasir@apotiktamansari.com",
      hashedPassword: defaultPasswordHash,
      role: UserRole.KASIR,
      isActive: true,
    },
  });
  await prisma.userBusinessAccess.upsert({
    where: { userId_businessId: { userId: legacyKasir.id, businessId: apotik.id } },
    update: { role: BusinessRole.KASIR },
    create: { userId: legacyKasir.id, businessId: apotik.id, role: BusinessRole.KASIR },
  });

  console.log("   ✅ Akun Pengguna Real Terdaftar:");
  console.log("      1. Owner: owner@gigin.com / password123 (Akses Penuh /hub & All Bisnis)");
  console.log("      2. Kasir Apotik: kasir.apotik@gigin.com / password123 (Akses /b/apotik-tamansari)");
  console.log("      3. Kasir Mainan: kasir.mainan@gigin.com / password123 (Akses /b/toko-mainan-pasar-lelea)");

  // 3. Seed Chart of Accounts
  console.log("📊 3. Inisialisasi Chart of Accounts (COA)...");
  for (const acc of DEFAULT_COA) {
    await prisma.chartOfAccount.upsert({
      where: { accountCode: acc.code },
      update: {},
      create: {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        description: acc.desc,
        businessId: apotik.id,
      },
    });
  }

  // 4. Seed Units
  console.log("📦 4. Inisialisasi Master Satuan (Units)...");
  const units = ["Tablet", "Kapsul", "Strip", "Box", "Botol", "Gram", "Ampul", "Pcs"];
  for (const u of units) {
    await prisma.unit.upsert({
      where: { name: u },
      update: {},
      create: { name: u, businessId: apotik.id },
    });
  }

  console.log("\n🎉 Seeding database Gigin's Business Centre selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
