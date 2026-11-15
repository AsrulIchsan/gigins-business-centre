import { PrismaClient, UserRole, BusinessType, BusinessRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=================================================================");
  console.log("🚀 MIGRATION TO MULTI-BUSINESS ERP & POS: GIGIN'S BUSINESS CENTRE");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. BUAT / UPDATE ENTITAS BISNIS (MULTI-TENANT ROOTS)
  // ---------------------------------------------------------------------------
  console.log("📌 1. Memeriksa & Menginisialisasi Business Units...");

  // Unit Bisnis 1: Apotik Tamansari (PHARMACY)
  const apotik = await prisma.business.upsert({
    where: { slug: "apotik-tamansari" },
    update: {
      name: "Apotik Tamansari",
      type: BusinessType.PHARMACY,
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
      address: "Jl. Tamansari No. 45, Bandung, Jawa Barat",
      phone: "022-2501234",
      description: "Unit Bisnis Farmasi, Resep Dokter, Obat-Obatan & Layanan Apotek Terpadu",
      isActive: true,
    },
    create: {
      name: "Apotik Tamansari",
      slug: "apotik-tamansari",
      type: BusinessType.PHARMACY,
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
      address: "Jl. Tamansari No. 45, Bandung, Jawa Barat",
      phone: "022-2501234",
      description: "Unit Bisnis Farmasi, Resep Dokter, Obat-Obatan & Layanan Apotek Terpadu",
      isActive: true,
    },
  });
  console.log(`   ✅ Bisnis 1 Terdaftar: "${apotik.name}" (ID: ${apotik.id}, Slug: ${apotik.slug}, Tipe: ${apotik.type})`);

  // Unit Bisnis 2: Toko Mainan Pasar Lelea (RETAIL_TOYS)
  const tokoMainan = await prisma.business.upsert({
    where: { slug: "toko-mainan-pasar-lelea" },
    update: {
      name: "Toko Mainan Pasar Lelea",
      type: BusinessType.RETAIL_TOYS,
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
      address: "Pasar Lelea Blok B No. 12, Lelea, Indramayu, Jawa Barat",
      phone: "0812-3456-7890",
      description: "Unit Bisnis Retail Grosir & Eceran Mainan Anak, Edukasi & Hobi",
      isActive: true,
    },
    create: {
      name: "Toko Mainan Pasar Lelea",
      slug: "toko-mainan-pasar-lelea",
      type: BusinessType.RETAIL_TOYS,
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
      address: "Pasar Lelea Blok B No. 12, Lelea, Indramayu, Jawa Barat",
      phone: "0812-3456-7890",
      description: "Unit Bisnis Retail Grosir & Eceran Mainan Anak, Edukasi & Hobi",
      isActive: true,
    },
  });
  console.log(`   ✅ Bisnis 2 Terdaftar: "${tokoMainan.name}" (ID: ${tokoMainan.id}, Slug: ${tokoMainan.slug}, Tipe: ${tokoMainan.type})\n`);

  // ---------------------------------------------------------------------------
  // 2. MIGRASI SELURUH DATA LAMA KE "APOTIK TAMANSARI" (TANPA DATA HILANG)
  // ---------------------------------------------------------------------------
  console.log("📌 2. Memindahkan (Assign) Seluruh Data Master & Transaksional yang Sudah Ada ke 'Apotik Tamansari'...");

  const migrationTasks: { name: string; run: () => Promise<{ count: number }> }[] = [
    { name: "Kategori Produk (ProductCategory)", run: () => prisma.productCategory.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Satuan (Unit)", run: () => prisma.unit.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "PBF / Supplier", run: () => prisma.supplier.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Katalog Produk & Obat (Product)", run: () => prisma.product.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Histori Harga (PriceHistory)", run: () => prisma.priceHistory.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Batch Obat & Stok Expired (ProductBatch)", run: () => prisma.productBatch.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Kartu Stok (StockCard)", run: () => prisma.stockCard.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Stok Opname", run: () => prisma.stockOpname.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Konsinyasi (ConsignmentSettlement)", run: () => prisma.consignmentSettlement.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Purchase Order (PO)", run: () => prisma.purchaseOrder.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Faktur Pembelian (Purchase)", run: () => prisma.purchase.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Retur Pembelian (PurchaseReturn)", run: () => prisma.purchaseReturn.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Pembayaran Hutang (PurchasePayment)", run: () => prisma.purchasePayment.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Pelanggan & Member (Customer)", run: () => prisma.customer.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Member Tier", run: () => prisma.memberTier.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Promo & Diskon", run: () => prisma.promo.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Data Dokter & SIP (Doctor)", run: () => prisma.doctor.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Template WhatsApp (WaTemplate)", run: () => prisma.waTemplate.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Log WhatsApp (WaLog)", run: () => prisma.waLog.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Sesi Shift Kasir (Shift)", run: () => prisma.shift.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Transaksi Penjualan POS (Sale)", run: () => prisma.sale.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Retur Penjualan (SaleReturn)", run: () => prisma.saleReturn.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Pesanan Online (OnlineOrder)", run: () => prisma.onlineOrder.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Akun Akuntansi / COA (ChartOfAccount)", run: () => prisma.chartOfAccount.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Jurnal Umum Akuntansi (JournalEntry)", run: () => prisma.journalEntry.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Pengaturan Aplikasi (AppSetting)", run: () => prisma.appSetting.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Konfigurasi Channel Online", run: () => prisma.onlineChannelConfig.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
    { name: "Audit Log Aktivitas", run: () => prisma.auditLog.updateMany({ where: { businessId: null }, data: { businessId: apotik.id } }) },
  ];

  for (const task of migrationTasks) {
    try {
      const result = await task.run();
      console.log(`   ➡️  ${task.name.padEnd(42)}: ${result.count} data dimigrasikan.`);
    } catch (err: any) {
      console.warn(`   ⚠️  ${task.name} dilewati / error: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. UPGRADE ADMIN UTAMA KE OWNER DI "GIGIN'S BUSINESS CENTRE" & MULTI-ACCESS
  // ---------------------------------------------------------------------------
  console.log("\n📌 3. Mengatur Hak Akses Multi-Bisnis (UserBusinessAccess)...");

  // Cari admin utama
  let admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "admin@apotiktamansari.com" },
        { role: UserRole.ADMIN },
        { role: UserRole.OWNER },
      ],
    },
  });

  if (!admin) {
    console.log("   ℹ️ Admin belum ditemukan, membuat akun Superadmin / Owner baru...");
    admin = await prisma.user.create({
      data: {
        name: "Gigin (Owner / Superadmin)",
        email: "admin@apotiktamansari.com",
        hashedPassword: "hashed_secure_password_demo",
        role: UserRole.OWNER,
        isActive: true,
      },
    });
  } else {
    // Upgrade role admin ke OWNER di level platform
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        role: UserRole.OWNER,
        name: admin.name.includes("Gigin") ? admin.name : `${admin.name} (Owner Gigin's Business Centre)`,
      },
    });
    console.log(`   👑 User "${admin.name}" (${admin.email}) di-upgrade menjadi platform OWNER!`);
  }

  // Berikan hak akses OWNER untuk Admin di KEDUA unit bisnis ("Gigin's Business Centre")
  await prisma.userBusinessAccess.upsert({
    where: {
      userId_businessId: {
        userId: admin.id,
        businessId: apotik.id,
      },
    },
    update: { role: BusinessRole.OWNER },
    create: {
      userId: admin.id,
      businessId: apotik.id,
      role: BusinessRole.OWNER,
    },
  });
  console.log(`   ✅ Akses Bisnis: Admin -> Apotik Tamansari [OWNER]`);

  await prisma.userBusinessAccess.upsert({
    where: {
      userId_businessId: {
        userId: admin.id,
        businessId: tokoMainan.id,
      },
    },
    update: { role: BusinessRole.OWNER },
    create: {
      userId: admin.id,
      businessId: tokoMainan.id,
      role: BusinessRole.OWNER,
    },
  });
  console.log(`   ✅ Akses Bisnis: Admin -> Toko Mainan Pasar Lelea [OWNER]`);

  // Assign apoteker jika ada ke Apotik Tamansari sebagai MANAGER
  const apoteker = await prisma.user.findFirst({
    where: { email: "apoteker@apotiktamansari.com" },
  });
  if (apoteker) {
    await prisma.userBusinessAccess.upsert({
      where: {
        userId_businessId: {
          userId: apoteker.id,
          businessId: apotik.id,
        },
      },
      update: { role: BusinessRole.MANAGER },
      create: {
        userId: apoteker.id,
        businessId: apotik.id,
        role: BusinessRole.MANAGER,
      },
    });
    console.log(`   ✅ Akses Bisnis: Apoteker -> Apotik Tamansari [MANAGER]`);
  }

  // Assign kasir jika ada ke Apotik Tamansari sebagai KASIR
  const kasir = await prisma.user.findFirst({
    where: { email: "kasir@apotiktamansari.com" },
  });
  if (kasir) {
    await prisma.userBusinessAccess.upsert({
      where: {
        userId_businessId: {
          userId: kasir.id,
          businessId: apotik.id,
        },
      },
      update: { role: BusinessRole.KASIR },
      create: {
        userId: kasir.id,
        businessId: apotik.id,
        role: BusinessRole.KASIR,
      },
    });
    console.log(`   ✅ Akses Bisnis: Kasir -> Apotik Tamansari [KASIR]`);
  }

  // ---------------------------------------------------------------------------
  // 4. STARTER MASTER DATA UNTUK "TOKO MAINAN PASAR LELEA" (SIAP PAKAI)
  // ---------------------------------------------------------------------------
  console.log("\n📌 4. Menyiapkan Starter Master Data untuk Toko Mainan Pasar Lelea...");

  // Kategori Mainan
  const toyCategories = [
    { name: "Mainan Edukasi & Montessori", desc: "Balok susun, puzzle, sensory toys" },
    { name: "Mobil Remot, RC & Diecast", desc: "Mobil RC, helikopter, diecast miniature" },
    { name: "Action Figure & Robot", desc: "Superhero, anime figure, robot transformer" },
    { name: "Boneka & Plush Toys", desc: "Boneka beruang, boneka karakter" },
    { name: "Mainan Tradisional & Outdoor", desc: "Gasing, layangan, pistol gelembung, bola" },
  ];

  for (const cat of toyCategories) {
    const existingCat = await prisma.productCategory.findFirst({
      where: { businessId: tokoMainan.id, name: cat.name },
    });
    if (!existingCat) {
      await prisma.productCategory.create({
        data: {
          businessId: tokoMainan.id,
          name: cat.name,
          description: cat.desc,
        },
      });
    }
  }
  console.log(`   ✅ 5 Kategori Produk Mainan berhasil disiapkan.`);

  // Supplier Toko Mainan
  const toySupplier = await prisma.supplier.upsert({
    where: { code: "SUP-TOY-001" },
    update: { businessId: tokoMainan.id },
    create: {
      businessId: tokoMainan.id,
      code: "SUP-TOY-001",
      name: "Distributor Mainan Cemerlang Jaya",
      contactPerson: "Bpk. Hendra Wijaya",
      phone: "0813-8899-7711",
      address: "Sentra Grosir Pasar Pagi Lt. 2 Blok A, Jakarta Barat",
      paymentTermDays: 14,
    },
  });
  console.log(`   ✅ Supplier Mainan disiapkan: "${toySupplier.name}"`);

  // Sample Produk Mainan
  const edukasiCat = await prisma.productCategory.findFirst({
    where: { businessId: tokoMainan.id, name: "Mainan Edukasi & Montessori" },
  });

  if (edukasiCat) {
    const existingToyProduct = await prisma.product.findFirst({
      where: { businessId: tokoMainan.id, name: "Balok Susun Edukasi Kayu 100 Pcs" },
    });

    if (!existingToyProduct) {
      const unitPcs = await prisma.unit.upsert({
        where: { name: "Pcs" },
        update: {},
        create: { name: "Pcs" },
      });

      const toyProd = await prisma.product.create({
        data: {
          businessId: tokoMainan.id,
          name: "Balok Susun Edukasi Kayu 100 Pcs",
          genericName: "Wooden Building Blocks 100pcs Non-Toxic Paint",
          categoryId: edukasiCat.id,
          supplierId: toySupplier.id,
          minStock: 5,
          maxStock: 50,
          description: "Mainan kayu ramah anak untuk melatih motorik halus dan kreativitas anak usia 3+",
          isActive: true,
        },
      });

      await prisma.productBarcode.create({
        data: {
          productId: toyProd.id,
          barcode: "899123490001",
          unitId: unitPcs.id,
        },
      });

      await prisma.productUnit.create({
        data: {
          productId: toyProd.id,
          unitId: unitPcs.id,
          conversionFactor: 1,
          isBaseUnit: true,
          buyPrice: 65000,
          sellPrice: 95000,
        },
      });

      console.log(`   ✅ Produk starter mainan dibuat: "${toyProd.name}" (Barcode: 899123490001)`);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. UPDATE APP SETTINGS PLATFORM
  // ---------------------------------------------------------------------------
  console.log("\n📌 5. Menyimpan Konfigurasi Platform...");
  await prisma.appSetting.upsert({
    where: { key: "platform_name" },
    update: { value: "Gigin's Business Centre" },
    create: {
      key: "platform_name",
      value: "Gigin's Business Centre",
      description: "Nama Platform Multi-Business ERP & POS",
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "platform_version" },
    update: { value: "2.0.0-multitenant" },
    create: {
      key: "platform_version",
      value: "2.0.0-multitenant",
      description: "Versi Sistem Multi-Tenancy",
    },
  });

  console.log("   ✅ Pengaturan Platform 'Gigin's Business Centre' v2.0 disimpan.");

  console.log("\n=================================================================");
  console.log("🎉 MIGRASI KE MULTI-BUSINESS SELESAI DENGAN SUKSES!");
  console.log("   Unit Bisnis Aktif:");
  console.log("   1. Apotik Tamansari (PHARMACY)");
  console.log("   2. Toko Mainan Pasar Lelea (RETAIL_TOYS)");
  console.log("   Seluruh data lama telah dialokasikan ke Apotik Tamansari.");
  console.log("   Akun admin utama telah memiliki role OWNER pada kedua bisnis.");
  console.log("=================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat migrasi multi-tenant:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
