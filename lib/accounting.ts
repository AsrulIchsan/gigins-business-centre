import { AccountType, JournalReferenceType } from "@prisma/client";

export interface JournalLineItem {
  accountCode: string; // e.g. "11101" (Kas), "41100" (Pendapatan Penjualan)
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

/**
 * Default Chart of Accounts for Pharmacy
 */
export const DEFAULT_COA = [
  // 1. ASET (ASSET)
  { code: "11101", name: "Kas Kasir / Shift", type: AccountType.ASSET, desc: "Kas operasional pada laci kasir" },
  { code: "11102", name: "Bank BCA Operasional", type: AccountType.ASSET, desc: "Rekening penerimaan EDC & QRIS" },
  { code: "11201", name: "Piutang Pelanggan / Kredit", type: AccountType.ASSET, desc: "Tagihan penjualan kredit pasien" },
  { code: "11301", name: "Persediaan Obat & Alkes", type: AccountType.ASSET, desc: "Nilai persediaan barang dagang apotek" },
  { code: "11302", name: "Persediaan Obat Konsinyasi", type: AccountType.ASSET, desc: "Nilai stok titipan konsinyasi" },
  
  // 2. KEWAJIBAN / HUTANG (LIABILITY)
  { code: "21101", name: "Hutang Usaha ke PBF", type: AccountType.LIABILITY, desc: "Kewajiban faktur jatuh tempo ke PBF" },
  { code: "21102", name: "Hutang Titipan Konsinyasi", type: AccountType.LIABILITY, desc: "Hutang bagi hasil obat konsinyasi terjual" },
  { code: "21201", name: "PPN Keluaran", type: AccountType.LIABILITY, desc: "Pajak pertambahan nilai penjualan" },

  // 3. EKUITAS (EQUITY)
  { code: "31101", name: "Modal Pemilik / Disetor", type: AccountType.EQUITY, desc: "Modal awal pendirian apotek" },
  { code: "32101", name: "Laba Ditahan", type: AccountType.EQUITY, desc: "Akumulasi laba periode lalu" },
  { code: "32102", name: "Laba Periode Berjalan", type: AccountType.EQUITY, desc: "Laba bersih tahun/bulan ini" },

  // 4. PENDAPATAN (REVENUE)
  { code: "41101", name: "Pendapatan Penjualan Obat Bebas", type: AccountType.REVENUE, desc: "Penjualan OTC / Umum" },
  { code: "41102", name: "Pendapatan Penjualan Resep", type: AccountType.REVENUE, desc: "Penjualan obat ethical resep dokter" },
  { code: "41103", name: "Pendapatan Jasa Racik & Embalase", type: AccountType.REVENUE, desc: "Tuslah racikan dan kemasan obat" },
  { code: "41201", name: "Pendapatan Komisi Konsinyasi", type: AccountType.REVENUE, desc: "Bagi hasil dari obat konsinyasi" },

  // 5. HARGA POKOK PENJUALAN (COGS)
  { code: "51101", name: "HPP - Beban Pokok Penjualan Obat", type: AccountType.COGS, desc: "Harga pokok barang yang terjual (FIFO)" },

  // 6. BEBAN OPERASIONAL (EXPENSE)
  { code: "61101", name: "Beban Selisih Kasir", type: AccountType.EXPENSE, desc: "Selisih kas saat tutup shift" },
  { code: "61102", name: "Beban Kerusakan & Obat Expired", type: AccountType.EXPENSE, desc: "Penghapusan obat kedaluwarsa" },
  { code: "61103", name: "Beban Operasional & Listrik", type: AccountType.EXPENSE, desc: "Beban penunjang apotek" },
];

/**
 * Generate automated journal entry for POS Sales
 */
export async function createSaleJournal(
  tx: any,
  params: {
    saleId: string;
    saleNumber: string;
    totalAmount: number;
    subtotal: number;
    compoundingFee: number;
    embalaseFee: number;
    totalCOGS: number; // Total HPP FIFO
    paymentMethod: string;
    isCredit: boolean;
    userId: string;
  }
) {
  const lines: JournalLineItem[] = [];

  // 1. Debit Cash/Bank/Receivable
  if (params.isCredit) {
    lines.push({
      accountCode: "11201", // Piutang
      accountName: "Piutang Pelanggan / Kredit",
      debit: params.totalAmount,
      credit: 0,
      description: `Piutang Penjualan ${params.saleNumber}`,
    });
  } else if (params.paymentMethod === "CASH") {
    lines.push({
      accountCode: "11101", // Kas
      accountName: "Kas Kasir / Shift",
      debit: params.totalAmount,
      credit: 0,
      description: `Penerimaan Kas ${params.saleNumber}`,
    });
  } else {
    // QRIS, Debit, Transfer
    lines.push({
      accountCode: "11102", // Bank
      accountName: "Bank BCA Operasional",
      debit: params.totalAmount,
      credit: 0,
      description: `Penerimaan Non-Tunai (${params.paymentMethod}) ${params.saleNumber}`,
    });
  }

  // 2. Credit Revenue
  const baseRevenue = params.subtotal;
  lines.push({
    accountCode: "41101",
    accountName: "Pendapatan Penjualan Obat Bebas",
    debit: 0,
    credit: baseRevenue,
    description: `Penjualan ${params.saleNumber}`,
  });

  // 3. Credit Jasa Racik & Embalase if applicable
  const serviceRevenue = params.compoundingFee + params.embalaseFee;
  if (serviceRevenue > 0) {
    lines.push({
      accountCode: "41103",
      accountName: "Pendapatan Jasa Racik & Embalase",
      debit: 0,
      credit: serviceRevenue,
      description: `Jasa Racik & Embalase ${params.saleNumber}`,
    });
  }

  // 4. Record COGS (HPP) and Persediaan reduction
  if (params.totalCOGS > 0) {
    lines.push({
      accountCode: "51101", // Beban Pokok Penjualan
      accountName: "HPP - Beban Pokok Penjualan Obat",
      debit: params.totalCOGS,
      credit: 0,
      description: `HPP Penjualan (FIFO) ${params.saleNumber}`,
    });
    lines.push({
      accountCode: "11301", // Pengurangan Persediaan
      accountName: "Persediaan Obat & Alkes",
      debit: 0,
      credit: params.totalCOGS,
      description: `Pengurangan Persediaan ${params.saleNumber}`,
    });
  }

  // Persist to JournalEntry & JournalLine in Database
  return await recordJournalTransaction(tx, {
    entryNumber: `JV-SL-${params.saleNumber}`,
    entryDate: new Date(),
    description: `Jurnal Otomatis Penjualan POS: ${params.saleNumber}`,
    reference: params.saleNumber,
    referenceType: JournalReferenceType.SALE,
    lines,
    userId: params.userId,
  });
}

/**
 * Record balanced journal entry to the database
 */
export async function recordJournalTransaction(
  tx: any,
  params: {
    entryNumber: string;
    entryDate: Date;
    description: string;
    reference: string;
    referenceType: JournalReferenceType;
    lines: JournalLineItem[];
    userId: string;
  }
) {
  const totalDebit = params.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = params.lines.reduce((sum, l) => sum + l.credit, 0);

  // Validate balance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Jurnal tidak seimbang (Unbalanced)! Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`
    );
  }

  // Ensure accounts exist in CoA
  const journalEntry = await tx.journalEntry.create({
    data: {
      entryNumber: params.entryNumber,
      entryDate: params.entryDate,
      description: params.description,
      reference: params.reference,
      referenceType: params.referenceType,
      totalDebit,
      totalCredit,
      isPosted: true,
      createdById: params.userId,
    },
  });

  for (const line of params.lines) {
    let account = await tx.chartOfAccount.findUnique({
      where: { accountCode: line.accountCode },
    });

    if (!account) {
      // Auto-create account if missing
      account = await tx.chartOfAccount.create({
        data: {
          accountCode: line.accountCode,
          accountName: line.accountName,
          accountType: AccountType.ASSET, // fallback default
        },
      });
    }

    await tx.journalLine.create({
      data: {
        journalId: journalEntry.id,
        accountId: account.id,
        description: line.description || params.description,
        debit: line.debit,
        credit: line.credit,
      },
    });
  }

  return journalEntry;
}
