/**
 * app/api/b/[businessSlug]/ai-pharmacist/route.ts
 * Endpoint: POST /api/b/[businessSlug]/ai-pharmacist
 *
 * Asisten Apoteker Pintar — Gemini AI
 * - Hanya aktif untuk bisnis bertipe PHARMACY
 * - Proteksi session via cookie JWT
 * - Menggunakan mock stock data (mirror dari INITIAL_PRODUCTS + master-data-store)
 * - Memanggil gemini-2.5-flash dengan system instruction ketat farmasi
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { jwtVerify } from "jose/jwt/verify";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";
import type { PharmacyStockItem, AiPharmacistResponse, DrugClass } from "@/lib/ai-pharmacist";

export const dynamic = "force-dynamic";

// ─── Auth Helper ─────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "tamansari-pharmacy-super-secret-key-2026-gigin"
);

async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Drug class inference based on category name ─────────────────────────────

function inferDrugClass(category: string, genericName?: string): DrugClass {
  const cat = category.toLowerCase();
  const gen = (genericName || "").toLowerCase();

  // Obat Keras: Antibiotik, Kardiovaskular, obat keras umum
  if (
    cat.includes("antibiotik") ||
    cat.includes("kardiovaskular") ||
    cat.includes("hipertensi") ||
    cat.includes("diabetes") ||
    cat.includes("psikiatri") ||
    cat.includes("narkotika") ||
    gen.includes("amoxicillin") ||
    gen.includes("amlodipine") ||
    gen.includes("metformin") ||
    gen.includes("omeprazole") ||
    gen.includes("captopril") ||
    gen.includes("diazepam") ||
    gen.includes("tramadol")
  ) {
    return "KERAS";
  }

  // Bebas Terbatas: Antihistamin, beberapa analgesik kuat, dekongestan
  if (
    cat.includes("antihistamin") ||
    cat.includes("alergi") ||
    gen.includes("cetirizine") ||
    gen.includes("loratadine") ||
    gen.includes("chlorpheniramine") ||
    gen.includes("ctm") ||
    gen.includes("pseudoephedrine") ||
    gen.includes("dextromethorphan")
  ) {
    return "BEBAS_TERBATAS";
  }

  // Default: Bebas (OTC)
  return "BEBAS";
}

// ─── Build stock context for Gemini ──────────────────────────────────────────

function buildStockList(): PharmacyStockItem[] {
  return INITIAL_PRODUCTS.filter((p) => p.totalStock > 0).map((p) => ({
    productId: p.id,
    name: p.name,
    genericName: p.genericName,
    category: p.category,
    description: p.genericName,
    indication: undefined,
    drugClass: inferDrugClass(p.category, p.genericName),
    sellingPrice: p.units[0]?.sellPrice ?? 0,
    totalStock: p.totalStock,
    baseUnit: p.baseUnit,
  }));
}

// ─── Gemini System Instruction ───────────────────────────────────────────────

function buildSystemInstruction(stockList: PharmacyStockItem[]): string {
  const stockJson = JSON.stringify(
    stockList.map((s) => ({
      productId: s.productId,
      nama: s.name,
      namaGenerik: s.genericName || "-",
      kategori: s.category,
      golongan: s.drugClass,
      harga: s.sellingPrice,
      stok: s.totalStock,
      satuan: s.baseUnit,
    })),
    null,
    2
  );

  return `Kamu adalah Asisten Apoteker Pintar di Apotik Tamansari, Bandung.
Tugasmu adalah membantu kasir/petugas apotek mencari rekomendasi obat dan aturan pakainya secara kasual, komunikatif, dan akurat berdasarkan keluhan atau pertanyaan pasien.

PANDUAN GAYA BAHASA & KOMUNIKASI (KASUAL CHAT):
1. Gunakan gaya bahasa percakapan yang ramah, santai, komunikatif, dan bersahabat layaknya mengobrol dengan rekan kerja kasir/apoteker di apotek (gunakan sapaan ramah seperti "Halo!", "Baik kak/rekan kasir,", "Untuk keluhan ini...").
2. medicalNote harus berupa pesan chat yang santai, jelas, dan mengalir enak dibaca (bisa gunakan emoji farmasi yang relevan seperti 💊, 🌿, 💧).
3. HANYA boleh merekomendasikan obat yang ada dalam daftar stok Apotik Tamansari di bawah ini. Jika tidak ada yang cocok atau stok kosong, sampaikan terus terang dengan ramah dan beri saran umum.
4. Periksa golongan obat:
   - KERAS: Wajib ada Resep Dokter atau persetujuan Apoteker penanggung jawab. Ingatkan ini dengan jelas.
   - BEBAS_TERBATAS: Berikan peringatan khusus pemakaian jika ada (misal: efek mengantuk).
   - BEBAS: Obat bebas, aman diserahkan langsung.
5. Ingatkan hal penting/kontraindikasi yang perlu ditanyakan ke pasien (usia anak/dewasa, riwayat alergi, sedang hamil/menyusui, punya sakit maag/lambung).
6. Pada array recommendedProducts, cantumkan aturan pakai dan dosis yang praktis pada dosageNote (contoh: "3x sehari 1 tablet sesudah makan", "1x sehari malam sebelum tidur").
7. Respons wajib dalam format JSON yang valid persis sesuai SCHEMA di bawah.

SCHEMA RESPONS JSON (wajib diikuti persis):
{
  "medicalNote": "string — pesan percakapan kasual dan penjelasan singkat mengenai solusi keluhan pasien",
  "contraindications": "string — pengingat ramah hal yang perlu dikonfirmasi ke pasien (opsional jika tidak ada)",
  "recommendedProducts": [
    {
      "productId": "string — ID produk dari daftar stok",
      "name": "string — nama produk lengkap",
      "price": number,
      "dosageNote": "string — aturan pakai & waktu konsumsi jelas (misal: 3x1 setelah makan)",
      "requiresPrescription": boolean,
      "drugClass": "BEBAS | BEBAS_TERBATAS | KERAS",
      "stock": number,
      "baseUnit": "string"
    }
  ],
  "disclaimer": "string — catatan singkat edukasi obat",
  "requiresPrescriptionOverall": boolean
}

DAFTAR STOK APOTIK TAMANSARI (hanya gunakan produk dari daftar ini):
${stockJson}`;
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { businessSlug: string } }
) {
  try {
    // 1. Autentikasi
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }

    // 2. Validasi bisnis PHARMACY
    const { businessSlug } = params;
    const isPharmacyBusiness =
      businessSlug.includes("apotik") ||
      businessSlug.includes("pharmacy") ||
      businessSlug.includes("apotek");

    if (!isPharmacyBusiness) {
      return NextResponse.json(
        {
          success: false,
          message: "Fitur Asisten Apoteker hanya tersedia untuk unit bisnis Apotik.",
        },
        { status: 403 }
      );
    }

    // 3. Ambil input keluhan & riwayat chat (jika ada)
    const body = await request.json();
    const { complaint, history } = body as {
      complaint: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!complaint || complaint.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Pesan atau keluhan wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    // 4. Cek API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === "your-gemini-api-key-here") {
      return NextResponse.json(
        {
          success: false,
          message:
            "GEMINI_API_KEY belum dikonfigurasi. Silakan isi di file .env atau Vercel Environment Variables.",
          needsApiKey: true,
        },
        { status: 503 }
      );
    }

    // 5. Build stock context
    const stockList = buildStockList();
    const systemInstruction = buildSystemInstruction(stockList);

    // 6. Build multi-turn contents for Gemini
    const contents: any[] = [];

    // Sertakan riwayat percakapan sebelumnya jika ada (maksimal 6 interaksi terakhir)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Tambahkan pertanyaan/keluhan terbaru
    contents.push({
      role: "user",
      parts: [
        {
          text: `Pertanyaan/Keluhan kasir: "${complaint.trim()}"

Berikan saran ramah kasual dan rekomendasi obat yang cocok dari stok Apotik Tamansari dalam format JSON yang diminta.`,
        },
      ],
    });

    // 7. Call Gemini API with fallback models
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ];

    let rawText = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        });
        rawText = response.text ?? "";
        if (rawText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Pharmacist] Model ${model} failed, trying next candidate...`, err?.message || err);
      }
    }

    if (!rawText && lastError) {
      throw lastError;
    }

    // 7. Parse JSON response
    let aiResult: AiPharmacistResponse;
    try {
      // Strip markdown code fences if any
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      aiResult = JSON.parse(cleaned);
    } catch {
      console.error("[AI Pharmacist] Failed to parse Gemini response:", rawText);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal memproses respons dari AI. Coba lagi.",
          rawResponse: rawText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    // 8. Enrich products with full stock info (merge with local stock data)
    const enrichedProducts = (aiResult.recommendedProducts || []).map((rec) => {
      const localProduct = stockList.find((s) => s.productId === rec.productId);
      return {
        ...rec,
        stock: localProduct?.totalStock ?? rec.stock ?? 0,
        baseUnit: localProduct?.baseUnit ?? rec.baseUnit ?? "Pcs",
        drugClass: localProduct?.drugClass ?? rec.drugClass ?? "BEBAS",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...aiResult,
        recommendedProducts: enrichedProducts,
      },
      businessSlug,
      complaint: complaint.trim(),
    });
  } catch (err: any) {
    console.error("[AI Pharmacist API Error]", err);

    // Specific Gemini error messages
    if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("API key")) {
      return NextResponse.json(
        { success: false, message: "GEMINI_API_KEY tidak valid. Periksa kembali konfigurasi .env Anda.", needsApiKey: true },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada Asisten AI. Coba beberapa saat lagi." },
      { status: 500 }
    );
  }
}
