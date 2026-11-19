/**
 * GIGIN'S BUSINESS CENTRE — Dedicated Thermal POS Receipt Printer (58mm & 80mm)
 * Menghasilkan struk thermal standar POS ritel/apotek dan mencetaknya secara terisolasi via hidden iframe
 * sehingga tidak mencetak elemen halaman web (tanpa modal, tanpa tombol, tanpa backdrop, dan 1 lembar pas).
 */

export interface ThermalReceiptItem {
  name: string;
  qty: number;
  unitName?: string;
  sellPrice: number;
  subtotal: number;
}

export interface ThermalReceiptData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  licenseNumber?: string;
  saleNumber: string;
  date: string | Date;
  cashier: string;
  customerName?: string;
  customerTier?: string;
  doctorName?: string;
  saleType?: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  compoundingFee?: number;
  embalaseFee?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentNote?: string;
  cashGiven: number;
  roundingAmount?: number;
  change: number;
  footerNote?: string;
}

export type ThermalPaperWidth = "58mm" | "80mm";

function formatRp(num: number): string {
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

export function generateThermalReceiptHtml(
  data: ThermalReceiptData,
  paperWidth: ThermalPaperWidth = "58mm"
): string {
  const is58 = paperWidth === "58mm";
  const bodyWidth = is58 ? "48mm" : "72mm";
  const fontSize = is58 ? "10px" : "12px";
  const headerFontSize = is58 ? "13px" : "15px";

  const dateStr =
    data.date instanceof Date
      ? data.date.toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date(data.date).toLocaleString("id-ID");

  const itemsHtml = data.items
    .map(
      (item) => `
      <div style="margin-bottom: 3px;">
        <div style="font-weight: 600; word-break: break-word;">${item.name}</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #111;">
          <span>${item.qty} ${item.unitName || "pcs"} &times; ${formatRp(item.sellPrice)}</span>
          <span style="font-weight: 600;">${formatRp(item.subtotal)}</span>
        </div>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk_${data.saleNumber}</title>
  <style>
    @page {
      margin: 0;
      size: ${paperWidth} auto;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0 auto;
      padding: 6px 4px 18px 4px;
      width: ${bodyWidth};
      max-width: ${bodyWidth};
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace, 'Lucida Console', Monaco;
      font-size: ${fontSize};
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .dashed {
      border-bottom: 1px dashed #000;
      margin: 5px 0;
    }
    .double-dashed {
      border-bottom: 2px dashed #000;
      margin: 6px 0;
    }
    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5px;
    }
    .receipt-title {
      font-size: ${headerFontSize};
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .receipt-subtitle {
      font-size: 0.85em;
      color: #222;
      margin-bottom: 1px;
    }
    .total-row {
      font-size: 1.15em;
      font-weight: 900;
      margin-top: 3px;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <!-- HEADER TOKO / APOTEK -->
  <div class="text-center">
    <div class="receipt-title uppercase">${data.businessName || "APOTIK TAMANSARI"}</div>
    ${
      data.businessAddress
        ? `<div class="receipt-subtitle">${data.businessAddress}</div>`
        : `<div class="receipt-subtitle">Jl. Tamansari No. 45, Bandung</div>`
    }
    ${
      data.businessPhone
        ? `<div class="receipt-subtitle">Telp: ${data.businessPhone}</div>`
        : `<div class="receipt-subtitle">Telp: 022-2501234</div>`
    }
    ${
      data.licenseNumber
        ? `<div class="receipt-subtitle" style="font-size: 0.8em;">${data.licenseNumber}</div>`
        : ""
    }
  </div>

  <div class="double-dashed"></div>

  <!-- INFO TRANSAKSI -->
  <div>
    <div class="flex-between">
      <span>No: ${data.saleNumber}</span>
      <span>${dateStr}</span>
    </div>
    <div class="flex-between">
      <span>Kasir: ${data.cashier}</span>
      <span>${data.customerName || "Pelanggan Umum"}</span>
    </div>
    ${
      data.doctorName
        ? `<div class="flex-between">
            <span>Dokter: ${data.doctorName}</span>
            <span>(Resep)</span>
           </div>`
        : ""
    }
  </div>

  <div class="dashed"></div>

  <!-- DAFTAR ITEM BELANJA -->
  <div style="margin: 4px 0;">
    ${itemsHtml}
  </div>

  <!-- BIAYA RACIKAN JIKA ADA -->
  ${
    (data.compoundingFee || 0) > 0 || (data.embalaseFee || 0) > 0
      ? `
    <div class="dashed"></div>
    ${
      (data.compoundingFee || 0) > 0
        ? `<div class="flex-between"><span>Jasa Racik / Tuslah:</span><span>${formatRp(data.compoundingFee!)}</span></div>`
        : ""
    }
    ${
      (data.embalaseFee || 0) > 0
        ? `<div class="flex-between"><span>Biaya Embalase/Pot:</span><span>${formatRp(data.embalaseFee!)}</span></div>`
        : ""
    }
  `
      : ""
  }

  <div class="dashed"></div>

  <!-- RINCIAN TOTAL & PEMBAYARAN -->
  <div>
    <div class="flex-between">
      <span>Subtotal:</span>
      <span>${formatRp(data.subtotal)}</span>
    </div>

    ${
      (data.discountAmount || 0) > 0
        ? `<div class="flex-between font-bold">
            <span>Diskon Member:</span>
            <span>-${formatRp(data.discountAmount!)}</span>
           </div>`
        : ""
    }

    ${
      (data.roundingAmount || 0) > 0
        ? `<div class="flex-between" style="font-size: 0.85em; color: #555;">
            <span>Pembulatan (+Rp 500 keatas):</span>
            <span>+${formatRp(data.roundingAmount!)}</span>
           </div>`
        : ""
    }

    <div class="dashed"></div>

    <div class="flex-between total-row">
      <span>TOTAL:</span>
      <span>${formatRp(data.totalAmount)}</span>
    </div>

    <div class="dashed"></div>

    <div class="flex-between">
      <span>Metode Bayar:</span>
      <span class="font-bold">${data.paymentMethod}</span>
    </div>

    ${
      data.paymentNote
        ? `<div class="flex-between" style="font-size: 0.85em;">
            <span>Keterangan:</span>
            <span>${data.paymentNote}</span>
           </div>`
        : ""
    }

    <div class="flex-between">
      <span>Uang Diterima:</span>
      <span class="font-bold">${formatRp(data.cashGiven)}</span>
    </div>

    ${
      data.paymentMethod === "CASH"
        ? `
      <div class="flex-between" style="font-size: 1.05em; font-weight: 800; margin-top: 2px;">
        <span>Kembalian Diserahkan:</span>
        <span>${formatRp(data.change)}</span>
      </div>
    `
        : `<div class="flex-between" style="font-size: 0.85em;">
            <span>Status:</span>
            <span>Lunas (Uang Pas)</span>
           </div>`
    }
  </div>

  <div class="double-dashed"></div>

  <!-- FOOTER NOTIFIKASI -->
  <div class="text-center" style="font-size: 0.85em; margin-top: 6px;">
    <div>${data.footerNote || "Semoga Lekas Sembuh"}</div>
    <div style="margin-top: 2px;">Terima Kasih atas Kunjungan Anda</div>
    <div style="font-size: 0.8em; color: #555; margin-top: 3px;">Barang yang sudah dibeli tidak dapat ditukar</div>
  </div>
</body>
</html>`;
}

/**
 * Mencetak struk thermal secara terisolasi tanpa memicu print pada seluruh halaman website.
 */
export function printThermalReceipt(
  data: ThermalReceiptData,
  paperWidth: ThermalPaperWidth = "58mm"
): void {
  if (typeof window === "undefined") return;

  const html = generateThermalReceiptHtml(data, paperWidth);

  // Buat hidden iframe khusus untuk print thermal
  let iframe = document.getElementById("thermal-print-iframe") as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "thermal-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = paperWidth === "58mm" ? "58mm" : "80mm";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Beri waktu browser me-render layout sebelum memanggil dialog print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 250);
}
