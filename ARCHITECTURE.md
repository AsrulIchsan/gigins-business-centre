# ARCHITECTURE.md — Apotik Tamansari Pharmacy Management System

> **Versi Dokumen:** 1.0.0  
> **Tanggal:** November 2026  
> **Status:** Living Document — diperbarui seiring perkembangan sistem

---

## Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Tech Stack Detail](#2-tech-stack-detail)
3. [System Architecture](#3-system-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Database Design Overview](#5-database-design-overview)
6. [Module Breakdown (30 Fitur)](#6-module-breakdown-30-fitur)
7. [FIFO & Batch Logic](#7-fifo--batch-logic)
8. [Konsinyasi Logic](#8-konsinyasi-logic)
9. [Accounting Engine](#9-accounting-engine)
10. [Multi-Payment Logic](#10-multi-payment-logic)
11. [Mobile-First Strategy](#11-mobile-first-strategy)
12. [Shift Management](#12-shift-management)
13. [Online Sales Integration](#13-online-sales-integration)
14. [WhatsApp Integration](#14-whatsapp-integration)
15. [Security & RBAC](#15-security--rbac)
16. [Performance Considerations](#16-performance-considerations)
17. [Deployment Architecture](#17-deployment-architecture)

---

## 1. Project Overview

### 1.1 Deskripsi Sistem

**Apotik Tamansari** adalah sistem manajemen apotek berbasis web yang dirancang untuk mengelola seluruh operasional apotek modern secara terintegrasi — mulai dari manajemen stok obat dengan metode FIFO, transaksi pembelian dari PBF (Pedagang Besar Farmasi), transaksi penjualan di kasir (POS), hingga pelaporan akuntansi otomatis dan integrasi kanal penjualan online.

### 1.2 Target Pengguna

| Peran | Deskripsi |
|---|---|
| **Admin / Pemilik** | Akses penuh ke seluruh modul, laporan keuangan, dan konfigurasi sistem |
| **Apoteker** | Verifikasi resep, manajemen obat keras, persetujuan retur |
| **TTK / Kasir** | Transaksi penjualan, input pembelian, stok opname harian |
| **Manajer** | Dashboard analitik, laporan laba-rugi, monitoring stok |

### 1.3 Design Philosophy

- **Mobile-First**: Modul kasir, input pembelian, dan stok opname dioptimalkan untuk smartphone
- **Offline-Capable**: Transaksi POS dapat berlanjut saat koneksi terputus (PWA + local queue)
- **Audit-Ready**: Setiap mutasi stok dan transaksi keuangan menghasilkan jejak audit (audit trail) otomatis
- **FIFO Strict**: Pengurangan stok selalu mengikuti urutan batch paling cepat kedaluwarsa
- **Double-Entry Accounting**: Setiap transaksi bisnis menghasilkan jurnal akuntansi ganda secara otomatis

---

## 2. Tech Stack Detail

### 2.1 Core Framework

| Teknologi | Versi | Fungsi |
|---|---|---|
| **Next.js** | 14.2.x (App Router) | Full-stack framework — routing, SSR, API routes |
| **TypeScript** | 5.4.x | Type safety di seluruh codebase |
| **React** | 18.3.x | UI rendering library |
| **Node.js** | 20.x LTS | Runtime environment |

### 2.2 Styling & UI

| Teknologi | Versi | Fungsi |
|---|---|---|
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework |
| **Shadcn UI** | latest | Komponen UI berbasis Radix UI + Tailwind |
| **Radix UI** | latest | Headless accessible components |
| **Lucide React** | 0.400.x | Icon library |
| **Recharts** | 2.12.x | Chart & grafik untuk dashboard analitik |
| **Framer Motion** | 11.x | Animasi UI |

### 2.3 Database & ORM

| Teknologi | Versi | Fungsi |
|---|---|---|
| **PostgreSQL** | 16.x | Primary database |
| **Prisma ORM** | 5.14.x | Type-safe database client & schema migration |
| **Redis** | 7.x | Caching, session storage, job queue |
| **BullMQ** | 5.x | Background job queue (laporan, pengiriman WA) |

### 2.4 Authentication & Security

| Teknologi | Versi | Fungsi |
|---|---|---|
| **NextAuth.js** | 5.x (Auth.js) | Authentication — session, JWT, OAuth |
| **bcryptjs** | 2.4.x | Password hashing |
| **jose** | 5.x | JWT signing & verification |
| **zod** | 3.23.x | Schema validation di API routes |

### 2.5 State Management & Data Fetching

| Teknologi | Versi | Fungsi |
|---|---|---|
| **TanStack Query** | 5.x | Server state management, caching, invalidation |
| **Zustand** | 4.5.x | Client state (cart POS, shift state, UI state) |
| **React Hook Form** | 7.x | Form management + validation |

### 2.6 PDF, Print & Barcode

| Teknologi | Versi | Fungsi |
|---|---|---|
| **React-PDF / @react-pdf/renderer** | 3.4.x | Generate PDF (faktur, laporan, struk) |
| **jsPDF** | 2.5.x | PDF generation alternatif untuk laporan sederhana |
| **ZXing JS** | 0.21.x | Barcode/QR decode dari kamera |
| **QuaggaJS** | 0.12.x | Barcode scanning alternatif |
| **JsBarcode** | 3.11.x | Generate barcode gambar untuk label obat |

### 2.7 WhatsApp & Komunikasi

| Teknologi | Versi | Fungsi |
|---|---|---|
| **Fonnte API** | v2 | Pengiriman pesan WhatsApp (struk, promo, reminder) |
| **WA Business API** | Cloud API | Alternatif enterprise WA integration |
| **Nodemailer** | 6.9.x | Pengiriman email (backup notifikasi) |

### 2.8 Utilities

| Teknologi | Versi | Fungsi |
|---|---|---|
| **date-fns** | 3.6.x | Manipulasi tanggal (expired date, shift, laporan) |
| **numeral.js** | 2.0.x | Format angka dan mata uang Rupiah |
| **xlsx / SheetJS** | 0.20.x | Export data ke Excel |
| **Papa Parse** | 5.4.x | Import/export CSV |
| **sharp** | 0.33.x | Optimasi gambar produk |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        WEB["Web Browser\n(Desktop)"]
        MOBILE["Mobile Browser\n(PWA / Android/iOS)"]
        SCANNER["Barcode Scanner\n(Camera / USB)"]
    end

    subgraph NextJS["Next.js 14 App — Vercel / VPS"]
        direction TB
        APPROUTER["App Router\n(RSC + Client Components)"]
        APIROUTES["API Routes\n(/api/v1/...)"]
        MIDDLEWARE["Middleware\n(Auth Check, RBAC, Rate Limit)"]
        NEXTAUTH["NextAuth.js\n(Session Management)"]
    end

    subgraph DataLayer["Data Layer"]
        PRISMA["Prisma ORM"]
        POSTGRES["PostgreSQL 16\n(Supabase / Railway)"]
        REDIS["Redis\n(Cache + Queue)"]
        BULLMQ["BullMQ\n(Background Jobs)"]
    end

    subgraph Integrations["External Integrations"]
        FONNTE["Fonnte API\n(WhatsApp)"]
        VMEDIMART["VMedisMart API"]
        KLIKDOKTER["KlikDokter API"]
        WEBSTORE["Webstore\nApotik Tamansari"]
        PAYMENT["Payment Gateway\n(QRIS / EDC)"]
    end

    WEB --> APPROUTER
    MOBILE --> APPROUTER
    SCANNER --> APPROUTER
    APPROUTER --> MIDDLEWARE
    MIDDLEWARE --> NEXTAUTH
    MIDDLEWARE --> APIROUTES
    APIROUTES --> PRISMA
    PRISMA --> POSTGRES
    APIROUTES --> REDIS
    BULLMQ --> FONNTE
    BULLMQ --> POSTGRES
    APIROUTES --> BULLMQ
    APIROUTES --> VMEDIMART
    APIROUTES --> KLIKDOKTER
    APIROUTES --> WEBSTORE
    APIROUTES --> PAYMENT
```

### 3.2 App Router Structure

```
app/
├── (auth)/                    # Route group — tidak butuh layout utama
│   ├── login/
│   └── forgot-password/
├── (dashboard)/               # Route group — semua halaman butuh auth
│   ├── layout.tsx             # Sidebar + header layout
│   ├── page.tsx               # Dashboard utama
│   ├── master/                # Domain: Master Data & Stok
│   ├── pembelian/             # Domain: Transaksi Pembelian & PBF
│   ├── penjualan/             # Domain: Transaksi Penjualan & POS
│   ├── crm/                   # Domain: CRM & Marketing
│   └── laporan/               # Domain: Laporan & Akuntansi
├── (mobile)/                  # Route group — layout mobile-first
│   ├── kasir/                 # POS mobile
│   ├── input-pembelian/       # Input faktur mobile
│   └── opname/                # Stok opname mobile
└── api/
    └── v1/                    # Semua API routes
```

### 3.3 Request Flow & Middleware

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant NextAuth
    participant APIRoute
    participant Prisma
    participant PostgreSQL

    Client->>Middleware: HTTP Request
    Middleware->>NextAuth: Verifikasi Session Token
    NextAuth-->>Middleware: Session Valid / Invalid
    alt Session Invalid
        Middleware-->>Client: 401 Redirect ke /login
    else Session Valid
        Middleware->>Middleware: Cek RBAC Permission
        alt Permission Denied
            Middleware-->>Client: 403 Forbidden
        else Permission OK
            Middleware->>APIRoute: Forward Request
            APIRoute->>APIRoute: Zod Schema Validation
            APIRoute->>Prisma: DB Query (transaction)
            Prisma->>PostgreSQL: SQL Query
            PostgreSQL-->>Prisma: Result
            Prisma-->>APIRoute: Typed Response
            APIRoute-->>Client: JSON Response
        end
    end
```

---

## 4. Directory Structure

```
apotik-tamansari/
├── .env.local                        # Environment variables (tidak di-commit)
├── .env.example                      # Template environment variables
├── next.config.ts                    # Next.js config (PWA, image domains)
├── tailwind.config.ts                # Tailwind config + custom theme
├── tsconfig.json                     # TypeScript config
├── prisma/
│   ├── schema.prisma                 # Definisi seluruh model database
│   ├── migrations/                   # File migrasi otomatis Prisma
│   └── seed.ts                       # Seed data awal (CoA, roles, admin)
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       └── LoginForm.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Sidebar + TopNav layout
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   │
│   │   │   ├── master/
│   │   │   │   ├── obat/
│   │   │   │   │   ├── page.tsx      # Daftar master obat
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx  # Detail/edit obat
│   │   │   │   │   └── _components/
│   │   │   │   │       ├── ObatForm.tsx
│   │   │   │   │       ├── SatuanBertingkatForm.tsx
│   │   │   │   │       └── BarcodeLabel.tsx
│   │   │   │   ├── harga/
│   │   │   │   │   ├── page.tsx      # Pengaturan margin & harga jual
│   │   │   │   │   └── _components/
│   │   │   │   │       └── HargaForm.tsx
│   │   │   │   ├── batch/
│   │   │   │   │   ├── page.tsx      # Manajemen batch & expired date
│   │   │   │   │   └── _components/
│   │   │   │   │       └── BatchTable.tsx
│   │   │   │   ├── konsinyasi/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── _components/
│   │   │   │   │       └── KonsinyasiForm.tsx
│   │   │   │   ├── kartu-stok/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [obatId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── opname/
│   │   │   │       ├── page.tsx      # Stok opname (desktop)
│   │   │   │       └── _components/
│   │   │   │           └── OpnameTable.tsx
│   │   │   │
│   │   │   ├── pembelian/
│   │   │   │   ├── po/
│   │   │   │   │   ├── page.tsx      # Daftar PO ke PBF
│   │   │   │   │   ├── buat/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── faktur/
│   │   │   │   │   ├── page.tsx      # Daftar & input faktur pembelian
│   │   │   │   │   ├── baru/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── retur/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── penjualan/
│   │   │   │   ├── pos/
│   │   │   │   │   ├── page.tsx      # Kasir desktop (full POS)
│   │   │   │   │   └── _components/
│   │   │   │   │       ├── CartPanel.tsx
│   │   │   │   │       ├── ProductSearch.tsx
│   │   │   │   │       ├── ResepForm.tsx
│   │   │   │   │       ├── RacikanForm.tsx
│   │   │   │   │       └── PaymentModal.tsx
│   │   │   │   ├── transaksi/
│   │   │   │   │   ├── page.tsx      # Riwayat transaksi penjualan
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── retur/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── hutang-piutang/
│   │   │   │       ├── page.tsx
│   │   │   │       └── _components/
│   │   │   │           ├── HutangPBFTable.tsx
│   │   │   │           └── PiutangPelangganTable.tsx
│   │   │   │
│   │   │   ├── crm/
│   │   │   │   ├── member/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── whatsapp/
│   │   │   │   │   ├── page.tsx      # Template & log WA
│   │   │   │   │   └── _components/
│   │   │   │   │       ├── TemplateEditor.tsx
│   │   │   │   │       └── LogTable.tsx
│   │   │   │   └── online/
│   │   │   │       ├── page.tsx      # Order online masuk
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   └── laporan/
│   │   │       ├── shift/
│   │   │       │   └── page.tsx
│   │   │       ├── stok/
│   │   │       │   └── page.tsx
│   │   │       ├── analitik/
│   │   │       │   └── page.tsx
│   │   │       └── akuntansi/
│   │   │           ├── jurnal/
│   │   │           │   └── page.tsx
│   │   │           ├── buku-besar/
│   │   │           │   └── page.tsx
│   │   │           ├── laba-rugi/
│   │   │           │   └── page.tsx
│   │   │           └── neraca/
│   │   │               └── page.tsx
│   │   │
│   │   ├── (mobile)/
│   │   │   ├── layout.tsx            # Layout mobile (bottom nav)
│   │   │   ├── kasir/
│   │   │   │   ├── page.tsx          # POS mobile ringkas
│   │   │   │   └── _components/
│   │   │   │       ├── MobileCart.tsx
│   │   │   │       └── CameraScanner.tsx
│   │   │   ├── input-pembelian/
│   │   │   │   └── page.tsx
│   │   │   └── opname/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/
│   │       └── v1/
│   │           ├── auth/
│   │           │   └── [...nextauth]/
│   │           │       └── route.ts
│   │           ├── master/
│   │           │   ├── obat/
│   │           │   │   ├── route.ts        # GET list, POST create
│   │           │   │   └── [id]/
│   │           │   │       └── route.ts    # GET, PUT, DELETE
│   │           │   ├── harga/
│   │           │   │   └── route.ts
│   │           │   ├── batch/
│   │           │   │   └── route.ts
│   │           │   ├── konsinyasi/
│   │           │   │   └── route.ts
│   │           │   ├── kartu-stok/
│   │           │   │   └── [obatId]/
│   │           │   │       └── route.ts
│   │           │   └── opname/
│   │           │       └── route.ts
│   │           ├── pembelian/
│   │           │   ├── po/
│   │           │   │   └── route.ts
│   │           │   ├── faktur/
│   │           │   │   └── route.ts
│   │           │   └── retur/
│   │           │       └── route.ts
│   │           ├── penjualan/
│   │           │   ├── transaksi/
│   │           │   │   └── route.ts
│   │           │   ├── retur/
│   │           │   │   └── route.ts
│   │           │   └── hutang-piutang/
│   │           │       └── route.ts
│   │           ├── crm/
│   │           │   ├── member/
│   │           │   │   └── route.ts
│   │           │   ├── whatsapp/
│   │           │   │   └── route.ts
│   │           │   └── online-order/
│   │           │       └── route.ts
│   │           ├── laporan/
│   │           │   ├── shift/
│   │           │   │   └── route.ts
│   │           │   ├── stok/
│   │           │   │   └── route.ts
│   │           │   ├── analitik/
│   │           │   │   └── route.ts
│   │           │   └── akuntansi/
│   │           │       └── route.ts
│   │           └── webhooks/
│   │               ├── vmedimart/
│   │               │   └── route.ts
│   │               └── klikdokter/
│   │                   └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                       # Komponen Shadcn UI (auto-generated)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── MobileBottomNav.tsx
│   │   │   └── BreadCrumb.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx         # Generic TanStack Table wrapper
│   │   │   ├── SearchInput.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   ├── PrintButton.tsx
│   │   │   └── ExportButton.tsx
│   │   └── print/
│   │       ├── StrukPenjualan.tsx
│   │       ├── FakturPembelian.tsx
│   │       └── LaporanPDF.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── redis.ts                  # Redis client
│   │   ├── bullmq.ts                 # Queue definitions
│   │   ├── validations/              # Zod schemas per domain
│   │   │   ├── obat.schema.ts
│   │   │   ├── transaksi.schema.ts
│   │   │   └── akuntansi.schema.ts
│   │   └── utils/
│   │       ├── fifo.ts               # FIFO deduction algorithm
│   │       ├── akuntansi.ts          # Auto journal entry generator
│   │       ├── harga.ts              # Kalkulasi HPP, margin, harga jual
│   │       ├── shift.ts              # Shift open/close utilities
│   │       ├── formatter.ts          # Rupiah, tanggal, nomor formatter
│   │       └── whatsapp.ts           # WA message builder & sender
│   │
│   ├── hooks/
│   │   ├── useCart.ts                # Zustand cart store
│   │   ├── useShift.ts               # Active shift state
│   │   ├── useScanner.ts             # Barcode scanner hook
│   │   ├── useObat.ts                # TanStack Query hooks untuk obat
│   │   └── useAkuntansi.ts
│   │
│   ├── stores/
│   │   ├── cartStore.ts              # Zustand: POS cart items
│   │   ├── shiftStore.ts             # Zustand: shift aktif
│   │   └── offlineStore.ts           # Zustand + IndexedDB: offline queue
│   │
│   ├── types/
│   │   ├── index.ts                  # Re-export semua types
│   │   ├── obat.types.ts
│   │   ├── transaksi.types.ts
│   │   ├── akuntansi.types.ts
│   │   └── api.types.ts
│   │
│   ├── middleware.ts                  # Next.js middleware (auth + RBAC)
│   │
│   └── workers/                      # BullMQ worker processes
│       ├── whatsapp.worker.ts
│       ├── laporan.worker.ts
│       └── sync-online.worker.ts
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker (offline)
│   └── icons/
│
└── docs/
    ├── ARCHITECTURE.md               # File ini
    ├── API.md                        # Dokumentasi API endpoints
    └── ERD.md                        # Entity Relationship Diagram lengkap
```

---

## 5. Database Design Overview

### 5.1 Kelompok Entity Utama

```mermaid
erDiagram
    OBAT ||--o{ SATUAN_OBAT : "punya satuan bertingkat"
    OBAT ||--o{ BATCH : "punya batch"
    OBAT ||--o{ KARTU_STOK : "punya riwayat mutasi"
    OBAT ||--o{ HARGA_LOG : "punya log perubahan harga"
    OBAT ||--o{ KONSINYASI : "bisa berstatus konsinyasi"

    BATCH ||--o{ DETAIL_PEMBELIAN : "diisi dari faktur pembelian"
    BATCH ||--o{ DETAIL_PENJUALAN : "digunakan di penjualan (FIFO)"
    BATCH ||--o{ DETAIL_RETUR_BELI : "bisa diretur ke PBF"

    PEMBELIAN ||--o{ DETAIL_PEMBELIAN : "berisi item pembelian"
    PEMBELIAN }o--|| SUPPLIER : "dari supplier/PBF"
    PEMBELIAN }o--o| PO : "realisasi dari PO"

    PENJUALAN ||--o{ DETAIL_PENJUALAN : "berisi item penjualan"
    PENJUALAN ||--o{ PEMBAYARAN : "punya satu atau lebih pembayaran"
    PENJUALAN }o--o| MEMBER : "bisa punya member"
    PENJUALAN }o--|| SHIFT : "dalam satu shift kasir"

    JURNAL ||--o{ DETAIL_JURNAL : "punya debit-kredit entries"
    JURNAL }o--|| COA : "menggunakan chart of accounts"

    USER ||--o{ SHIFT : "buka/tutup shift"
    USER }o--|| ROLE : "punya role RBAC"
```

### 5.2 Deskripsi Kelompok Entity

| Kelompok | Tabel Utama | Deskripsi |
|---|---|---|
| **Master Obat** | `Obat`, `SatuanObat`, `Kategori`, `Supplier` | Data master produk farmasi dengan hierarki satuan |
| **Batch & Stok** | `Batch`, `KartuStok` | FIFO batch tracking, mutasi stok, stok opname |
| **Harga & Margin** | `HargaLog`, `MarginSetting` | Riwayat perubahan harga jual dan setting margin |
| **Konsinyasi** | `Konsinyasi`, `KonsinyasiLog` | Tracking stok titipan supplier dan tagihan terjual |
| **Pembelian** | `PurchaseOrder`, `Pembelian`, `DetailPembelian`, `ReturPembelian` | Alur pembelian dari PO hingga penerimaan dan retur |
| **Penjualan** | `Penjualan`, `DetailPenjualan`, `Pembayaran`, `ReturPenjualan` | Transaksi kasir, resep, racikan, multi-payment |
| **Hutang-Piutang** | `HutangPBF`, `PiutangPelanggan`, `Pembayaran` | AR/AP management dengan jatuh tempo |
| **CRM** | `Member`, `TierMember`, `Promo`, `PromoRule` | Loyalty program, diskon, promo member |
| **WhatsApp** | `WATemplate`, `WALog` | Template pesan dan log pengiriman |
| **Online Order** | `OnlineOrder`, `KanalOnline` | Order masuk dari platform eksternal |
| **Shift** | `Shift`, `ShiftKas` | Manajemen shift kasir dan rekonsiliasi kas |
| **Akuntansi** | `CoA`, `Jurnal`, `DetailJurnal` | Chart of accounts, buku jurnal ganda |
| **User & Auth** | `User`, `Role`, `Permission`, `RolePermission` | RBAC dan autentikasi |

---

## 6. Module Breakdown (30 Fitur)

### DOMAIN 1: Master Data & Stok

---

#### Fitur 1.1 — Menu Master Obat

| Atribut | Detail |
|---|---|
| **Path** | `/master/obat` |
| **Key Components** | `ObatForm`, `SatuanBertingkatForm`, `BarcodeLabel`, `KategoriSelect` |
| **DB Tables** | `Obat`, `SatuanObat`, `Kategori`, `Golongan` |
| **API Routes** | `GET/POST /api/v1/master/obat`, `GET/PUT/DELETE /api/v1/master/obat/[id]` |

**Deskripsi:** Modul ini mengelola data master seluruh obat dan produk farmasi. Setiap produk memiliki:
- **Satuan Bertingkat**: Hierarki konversi (mis. 1 Box = 10 Strip; 1 Strip = 10 Tablet). Konversi digunakan saat menerima faktur pembelian per Box tetapi menjual per Tablet.
- **Kategori & Golongan**: Obat Keras (K), Obat Bebas Terbatas (OBT), Narkotika (N), Psikotropika (P), Suplemen, dll.
- **Barcode**: Mendukung multiple barcode per produk (barcode Box, barcode Strip, barcode Tablet).

```prisma
model Obat {
  id              String       @id @default(cuid())
  kode            String       @unique
  nama            String
  namaGenerik     String?
  kategoriId      String
  golongan        Golongan     // enum: BEBAS, BEBAS_TERBATAS, KERAS, NARKOTIKA, PSIKOTROPIKA
  barcodes        String[]
  deskripsi       String?
  isKonsinyasi    Boolean      @default(false)
  isAktif         Boolean      @default(true)
  stokMinimum     Int          @default(0)
  satuan          SatuanObat[]
  batch           Batch[]
  kartuStok       KartuStok[]
  hargaLog        HargaLog[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model SatuanObat {
  id          String  @id @default(cuid())
  obatId      String
  nama        String  // "Box", "Strip", "Tablet"
  level       Int     // 1=Box (terbesar), 2=Strip, 3=Tablet (terkecil)
  konversi    Int     // 1 unit level ini = konversi unit level berikutnya
  barcode     String?
  hargaJual   Decimal
  obat        Obat    @relation(fields: [obatId], references: [id])
}
```

---

#### Fitur 1.2 — Pengaturan Margin & Ubah Harga Jual

| Atribut | Detail |
|---|---|
| **Path** | `/master/harga` |
| **Key Components** | `HargaForm`, `MarginCalculator`, `HargaLogTable` |
| **DB Tables** | `HargaLog`, `MarginSetting`, `SatuanObat` |
| **API Routes** | `GET/PUT /api/v1/master/harga`, `GET /api/v1/master/harga/log/[obatId]` |

**Kalkulasi Harga Jual:**

```
Harga Jual = HPP × (1 + Margin%)
HPP (per tablet) = Harga Beli Terakhir ÷ Total Unit Terkecil dalam Kemasan
```

Log perubahan menyimpan: harga lama, harga baru, margin yang digunakan, user yang mengubah, dan timestamp.

---

#### Fitur 1.3 — Pengaturan FIFO (Batch & Expired Date)

| Atribut | Detail |
|---|---|
| **Path** | `/master/batch` |
| **Key Components** | `BatchTable`, `BatchDetail`, `ExpiredAlert` |
| **DB Tables** | `Batch`, `KartuStok` |
| **API Routes** | `GET /api/v1/master/batch`, `GET /api/v1/master/batch/[obatId]` |

Lihat [Bagian 7](#7-fifo--batch-logic) untuk algoritma FIFO lengkap.

```prisma
model Batch {
  id              String   @id @default(cuid())
  obatId          String
  noBatch         String
  expiredDate     DateTime
  hargaBeli       Decimal  // harga beli per unit terkecil di batch ini
  stokMasuk       Int      // jumlah unit terkecil saat batch dibuat
  stokSisa        Int      // sisa stok unit terkecil (dikurangi tiap penjualan)
  pembelianId     String?
  obat            Obat     @relation(fields: [obatId], references: [id])
  @@unique([obatId, noBatch])
  @@index([obatId, expiredDate]) // Index untuk FIFO query
}
```

---

#### Fitur 1.4 — Sistem Konsinyasi

| Atribut | Detail |
|---|---|
| **Path** | `/master/konsinyasi` |
| **Key Components** | `KonsinyasiForm`, `KonsinyasiTable`, `TagihanKonsinyasi` |
| **DB Tables** | `Konsinyasi`, `KonsinyasiLog`, `Supplier` |
| **API Routes** | `GET/POST /api/v1/master/konsinyasi`, `POST /api/v1/master/konsinyasi/[id]/tagihan` |

Lihat [Bagian 8](#8-konsinyasi-logic) untuk logika konsinyasi lengkap.

---

#### Fitur 1.5 — Kartu Stok Otomatis

| Atribut | Detail |
|---|---|
| **Path** | `/master/kartu-stok`, `/master/kartu-stok/[obatId]` |
| **Key Components** | `KartuStokTable`, `MutasiFilter`, `SaldoChart` |
| **DB Tables** | `KartuStok` |
| **API Routes** | `GET /api/v1/master/kartu-stok/[obatId]` |

```prisma
model KartuStok {
  id            String         @id @default(cuid())
  obatId        String
  batchId       String?
  tanggal       DateTime
  jenis         JenisMutasi    // MASUK, KELUAR, RETUR_MASUK, RETUR_KELUAR, OPNAME
  referensiId   String?        // ID Pembelian / Penjualan / Opname
  referensiTipe String?        // "PEMBELIAN", "PENJUALAN", "OPNAME"
  jumlahMasuk   Int            @default(0)
  jumlahKeluar  Int            @default(0)
  saldoAkhir    Int            // dihitung otomatis
  keterangan    String?
  userId        String
  obat          Obat           @relation(fields: [obatId], references: [id])
}
```

Kartu stok ditulis otomatis melalui **Prisma Middleware** setiap kali ada operasi yang mengubah stok — tidak ada cara untuk mengubah stok tanpa mencatat kartu stok.

---

#### Fitur 1.6 — Stok Opname Mobile

| Atribut | Detail |
|---|---|
| **Path** | `/master/opname` (desktop), `/(mobile)/opname` (mobile) |
| **Key Components** | `OpnameTable`, `OpnameMobileInput`, `SelisihReport` |
| **DB Tables** | `StokOpname`, `DetailOpname`, `KartuStok` |
| **API Routes** | `POST /api/v1/master/opname`, `PUT /api/v1/master/opname/[id]/finalisasi` |

Alur:
1. Buat sesi opname baru → sistem mengambil stok sistem saat ini sebagai referensi
2. User input stok fisik per produk (mobile-friendly, barcode scan)
3. Sistem kalkulasi selisih (fisik − sistem)
4. Finalisasi opname → jurnal penyesuaian stok otomatis dibuat + KartuStok dicatat

---

### DOMAIN 2: Transaksi Pembelian & PBF

---

#### Fitur 2.1 — Belanja ke PBF Online (Purchase Order)

| Atribut | Detail |
|---|---|
| **Path** | `/pembelian/po` |
| **Key Components** | `POForm`, `POList`, `POStatus`, `POPrintable` |
| **DB Tables** | `PurchaseOrder`, `DetailPO`, `Supplier` |
| **API Routes** | `GET/POST /api/v1/pembelian/po`, `PUT /api/v1/pembelian/po/[id]/kirim` |

```prisma
model PurchaseOrder {
  id          String    @id @default(cuid())
  noPO        String    @unique // auto-generated: PO-YYYYMMDD-XXXX
  supplierId  String
  tanggal     DateTime
  status      POStatus  // DRAFT, TERKIRIM, SEBAGIAN_DITERIMA, SELESAI, BATAL
  catatan     String?
  items       DetailPO[]
  pembelian   Pembelian[]
  supplier    Supplier  @relation(fields: [supplierId], references: [id])
}
```

---

#### Fitur 2.2 — Transaksi Pembelian & Input Mobile

| Atribut | Detail |
|---|---|
| **Path** | `/pembelian/faktur` (desktop), `/(mobile)/input-pembelian` (mobile) |
| **Key Components** | `FakturForm`, `DetailFakturItem`, `BatchInputRow`, `MobileFakturInput` |
| **DB Tables** | `Pembelian`, `DetailPembelian`, `Batch`, `KartuStok`, `HutangPBF` |
| **API Routes** | `POST /api/v1/pembelian/faktur`, `GET /api/v1/pembelian/faktur/[id]` |

Saat faktur disimpan, sistem secara atomik (Prisma `$transaction`):
1. Membuat/mengupdate record `Batch` (noBatch, ED, harga beli)
2. Menambah `stokSisa` ke batch terkait
3. Mencatat `KartuStok` dengan jenis `MASUK`
4. Update `HargaLog` jika harga beli berubah
5. Membuat `HutangPBF` jika pembayaran belum lunas
6. Generate `Jurnal` akuntansi otomatis

---

#### Fitur 2.3 — Retur Pembelian

| Atribut | Detail |
|---|---|
| **Path** | `/pembelian/retur` |
| **Key Components** | `ReturPembelianForm`, `BatchSelector`, `ReturPreview` |
| **DB Tables** | `ReturPembelian`, `DetailReturPembelian`, `Batch`, `KartuStok`, `HutangPBF` |
| **API Routes** | `POST /api/v1/pembelian/retur`, `GET /api/v1/pembelian/retur/[id]` |

Saat retur pembelian:
1. Pilih faktur asal dan batch yang diretur
2. Kurangi `stokSisa` pada batch terkait
3. Catat `KartuStok` jenis `RETUR_KELUAR`
4. Kurangi/hapus `HutangPBF` atau catat `PiutangRetur` ke supplier
5. Generate jurnal koreksi akuntansi

---

### DOMAIN 3: Transaksi Penjualan & POS

---

#### Fitur 3.1 — Penjualan Umum, Resep, dan Racikan

| Atribut | Detail |
|---|---|
| **Path** | `/penjualan/pos` |
| **Key Components** | `CartPanel`, `ProductSearch`, `ResepForm`, `RacikanForm`, `PaymentModal` |
| **DB Tables** | `Penjualan`, `DetailPenjualan`, `DetailRacikan`, `Batch`, `KartuStok` |
| **API Routes** | `POST /api/v1/penjualan/transaksi` |

**Jenis Penjualan:**

| Jenis | Deskripsi |
|---|---|
| **Umum** | Penjualan OTC biasa tanpa resep |
| **Resep** | Input nomor resep dokter, nama dokter, nama pasien |
| **Racikan** | Bahan baku racikan dengan proporsi (mis. 50% Obat A + 30% Obat B + 20% Obat C), biaya jasa racik, biaya embalase |

**Racikan — Pecah Satuan:**
Racikan memungkinkan penggunaan sebagian tablet (mis. ½ tablet). Sistem menyimpan pecahan dalam format desimal dan mengurangi stok batch secara proporsional.

---

#### Fitur 3.2 — Input Transaksi Penjualan Mobile

| Atribut | Detail |
|---|---|
| **Path** | `/(mobile)/kasir` |
| **Key Components** | `MobileCart`, `CameraScanner`, `QuickProductGrid`, `SimplifiedPayment` |
| **DB Tables** | Sama dengan Fitur 3.1 |
| **API Routes** | `POST /api/v1/penjualan/transaksi` (endpoint sama) |

Fitur khusus mobile:
- **Camera Barcode Scan**: Menggunakan ZXing untuk scan barcode produk via kamera HP
- **Simplified UI**: Hanya tampilkan produk favorit dan search — tidak ada form resep/racikan kompleks
- **Offline Queue**: Transaksi disimpan ke IndexedDB jika offline, dikirim saat online kembali

---

#### Fitur 3.3 — Retur Penjualan

| Atribut | Detail |
|---|---|
| **Path** | `/penjualan/retur` |
| **Key Components** | `ReturPenjualanForm`, `TransaksiSearch`, `ReturPreview` |
| **DB Tables** | `ReturPenjualan`, `DetailReturPenjualan`, `Batch`, `KartuStok`, `Jurnal` |
| **API Routes** | `POST /api/v1/penjualan/retur` |

Saat retur penjualan:
1. Cari transaksi asal berdasarkan nomor transaksi
2. Pilih item yang diretur
3. Kembalikan stok ke batch asal (jika obat masih layak) atau catat sebagai kehilangan
4. Kembalikan uang atau catat sebagai kredit pelanggan
5. Generate jurnal koreksi (membalik entry penjualan asli)

---

#### Fitur 3.4 — Multi Payment & Hutang/Piutang

| Atribut | Detail |
|---|---|
| **Path** | `/penjualan/hutang-piutang` (dan modal dalam POS) |
| **Key Components** | `PaymentModal`, `SplitPaymentForm`, `HutangPBFTable`, `PiutangPelangganTable` |
| **DB Tables** | `Pembayaran`, `HutangPBF`, `PiutangPelanggan`, `JatuhTempo` |
| **API Routes** | `POST /api/v1/penjualan/transaksi`, `GET/POST /api/v1/penjualan/hutang-piutang` |

Lihat [Bagian 10](#10-multi-payment-logic) untuk logika lengkap.

---

### DOMAIN 4: CRM, Marketing & Integrasi Online

---

#### Fitur 4.1 — Promo Member

| Atribut | Detail |
|---|---|
| **Path** | `/crm/member` |
| **Key Components** | `MemberForm`, `TierBadge`, `PromoRuleEditor`, `MemberCard` |
| **DB Tables** | `Member`, `TierMember`, `Promo`, `PromoRule`, `HistoriPoint` |
| **API Routes** | `GET/POST /api/v1/crm/member`, `GET /api/v1/crm/member/[id]/histori` |

```prisma
model Member {
  id          String      @id @default(cuid())
  noMember    String      @unique
  nama        String
  telepon     String      @unique
  email       String?
  tierId      String
  totalPoint  Int         @default(0)
  totalBeli   Decimal     @default(0)
  tanggalGabung DateTime  @default(now())
  tier        TierMember  @relation(fields: [tierId], references: [id])
  penjualan   Penjualan[]
}

model TierMember {
  id              String    @id @default(cuid())
  nama            String    // "Regular", "Silver", "Gold", "Platinum"
  minPembelian    Decimal   // minimum total pembelian untuk naik ke tier ini
  persenDiskon    Decimal   // diskon otomatis untuk tier ini
  deskripsi       String?
}
```

---

#### Fitur 4.2 — WhatsApp Marketing

| Atribut | Detail |
|---|---|
| **Path** | `/crm/whatsapp` |
| **Key Components** | `TemplateEditor`, `TemplatePreview`, `BulkSendForm`, `WALogTable` |
| **DB Tables** | `WATemplate`, `WALog`, `WABroadcast` |
| **API Routes** | `GET/POST /api/v1/crm/whatsapp/template`, `POST /api/v1/crm/whatsapp/kirim` |

Lihat [Bagian 14](#14-whatsapp-integration) untuk logika lengkap.

---

#### Fitur 4.3 — Penjualan Online (Integrasi Kanal Eksternal)

| Atribut | Detail |
|---|---|
| **Path** | `/crm/online` |
| **Key Components** | `OnlineOrderList`, `OrderDetailPanel`, `SyncStatus`, `KanalConfig` |
| **DB Tables** | `OnlineOrder`, `KanalOnline`, `SyncLog` |
| **API Routes** | `GET /api/v1/crm/online-order`, `POST /api/v1/webhooks/vmedimart`, `POST /api/v1/webhooks/klikdokter` |

Lihat [Bagian 13](#13-online-sales-integration) untuk arsitektur integrasi lengkap.

---

### DOMAIN 5: Laporan Operasional, Analitik & Akuntansi

---

#### Fitur 5.1 — Laporan Pergantian Shift

| Atribut | Detail |
|---|---|
| **Path** | `/laporan/shift` |
| **Key Components** | `ShiftSummaryCard`, `KasByMetodeBayar`, `SelisihKasAlert` |
| **DB Tables** | `Shift`, `ShiftKas`, `Pembayaran` |
| **API Routes** | `GET /api/v1/laporan/shift/[shiftId]` |

Lihat [Bagian 12](#12-shift-management) untuk workflow shift lengkap.

---

#### Fitur 5.2 — Laporan Stok & Peringatan

| Atribut | Detail |
|---|---|
| **Path** | `/laporan/stok` |
| **Key Components** | `ExpiredTable`, `StokMinimumAlert`, `FastMovingChart` |
| **DB Tables** | `Batch`, `Obat`, `KartuStok` |
| **API Routes** | `GET /api/v1/laporan/stok/expired`, `GET /api/v1/laporan/stok/minimum`, `GET /api/v1/laporan/stok/fast-moving` |

```typescript
// Query obat expired dalam N hari ke depan
const expiredObat = await prisma.batch.findMany({
  where: {
    stokSisa: { gt: 0 },
    expiredDate: {
      lte: addDays(new Date(), hariKedepan), // H-30, H-90, H-180
    },
  },
  include: { obat: true },
  orderBy: { expiredDate: 'asc' },
});
```

---

#### Fitur 5.3 — Laporan Analitik Cerdas

| Atribut | Detail |
|---|---|
| **Path** | `/laporan/analitik` |
| **Key Components** | `ForecastChart`, `HargaKompetitorTable`, `DiskonProfitAnalysis` |
| **DB Tables** | `DetailPenjualan`, `HargaLog`, `Promo` |
| **API Routes** | `GET /api/v1/laporan/analitik/forecast`, `GET /api/v1/laporan/analitik/harga`, `GET /api/v1/laporan/analitik/diskon` |

**Smart Forecasting:**

```
Rata-rata Penjualan Harian = Total Terjual (90 hari) ÷ 90
Prediksi Stok Habis = Stok Saat Ini ÷ Rata-rata Penjualan Harian
Rekomendasi Restock = (Lead Time PBF × Rata-rata Harian) + Safety Stock
```

---

#### Fitur 5.4 — Akuntansi Otomatis

| Atribut | Detail |
|---|---|
| **Path** | `/laporan/akuntansi/jurnal`, `/laporan/akuntansi/buku-besar`, `/laporan/akuntansi/laba-rugi`, `/laporan/akuntansi/neraca` |
| **Key Components** | `JurnalTable`, `BukuBesarLedger`, `LabaRugiReport`, `NeracaReport`, `RasioKeuangan` |
| **DB Tables** | `CoA`, `Jurnal`, `DetailJurnal` |
| **API Routes** | `GET /api/v1/laporan/akuntansi/jurnal`, `GET /api/v1/laporan/akuntansi/buku-besar`, `GET /api/v1/laporan/akuntansi/laba-rugi`, `GET /api/v1/laporan/akuntansi/neraca` |

Lihat [Bagian 9](#9-accounting-engine) untuk mesin akuntansi lengkap.

---

## 7. FIFO & Batch Logic

### 7.1 Prinsip FIFO

**FIFO (First In, First Out)** berarti batch dengan **expired date paling awal** (paling cepat kedaluwarsa) harus **dikeluarkan terlebih dahulu**. Dalam farmasi, ini memastikan obat yang hampir expired terjual lebih dulu sebelum stok yang masih jauh expired date-nya.

### 7.2 Algoritma Deduction FIFO

```typescript
// lib/utils/fifo.ts

interface FIFODeductionResult {
  batchDeductions: Array<{
    batchId: string;
    noBatch: string;
    expiredDate: Date;
    jumlahDikurangi: number;
  }>;
  totalDikurangi: number;
  cukup: boolean;
}

async function deductStokFIFO(
  tx: PrismaTransactionClient,
  obatId: string,
  jumlahDibutuhkan: number, // dalam unit terkecil (tablet/pcs)
): Promise<FIFODeductionResult> {
  // 1. Ambil semua batch yang masih ada stok, diurutkan expired date ASC
  const batches = await tx.batch.findMany({
    where: {
      obatId,
      stokSisa: { gt: 0 },
      expiredDate: { gt: new Date() }, // skip expired
    },
    orderBy: { expiredDate: 'asc' }, // FIFO: expired paling dekat duluan
  });

  if (batches.length === 0) {
    return { batchDeductions: [], totalDikurangi: 0, cukup: false };
  }

  const deductions: FIFODeductionResult['batchDeductions'] = [];
  let sisaKebutuhan = jumlahDibutuhkan;

  for (const batch of batches) {
    if (sisaKebutuhan <= 0) break;

    const diambilDariBatch = Math.min(batch.stokSisa, sisaKebutuhan);
    
    // 2. Update stokSisa batch
    await tx.batch.update({
      where: { id: batch.id },
      data: { stokSisa: { decrement: diambilDariBatch } },
    });

    deductions.push({
      batchId: batch.id,
      noBatch: batch.noBatch,
      expiredDate: batch.expiredDate,
      jumlahDikurangi: diambilDariBatch,
    });

    sisaKebutuhan -= diambilDariBatch;
  }

  return {
    batchDeductions: deductions,
    totalDikurangi: jumlahDibutuhkan - sisaKebutuhan,
    cukup: sisaKebutuhan === 0,
  };
}
```

### 7.3 Integrasi dengan Penjualan

```typescript
// Dalam API route POST /api/v1/penjualan/transaksi
await prisma.$transaction(async (tx) => {
  for (const item of cartItems) {
    const jumlahUnitTerkecil = item.jumlah * item.konversiKeUnitTerkecil;

    const result = await deductStokFIFO(tx, item.obatId, jumlahUnitTerkecil);

    if (!result.cukup) {
      throw new Error(`Stok ${item.namaObat} tidak mencukupi`);
    }

    // Simpan detail penjualan per batch (traceability)
    for (const deduction of result.batchDeductions) {
      await tx.detailPenjualan.create({
        data: {
          penjualanId,
          obatId: item.obatId,
          batchId: deduction.batchId,
          noBatch: deduction.noBatch,
          expiredDate: deduction.expiredDate,
          jumlah: deduction.jumlahDikurangi,
          hargaJual: item.hargaJual,
          diskon: item.diskon,
        },
      });

      // Catat KartuStok otomatis
      await catatKartuStok(tx, {
        obatId: item.obatId,
        batchId: deduction.batchId,
        jenis: 'KELUAR',
        referensiId: penjualanId,
        referensiTipe: 'PENJUALAN',
        jumlahKeluar: deduction.jumlahDikurangi,
      });
    }
  }
});
```

### 7.4 Diagram Alur FIFO

```mermaid
flowchart TD
    A["Request Penjualan\nObat X: 25 Tablet"] --> B["Query Batch ORDER BY expiredDate ASC"]
    B --> C{"Batch 1: ED Jan 2025\nStok Sisa: 10 tablet"}
    C --> D["Ambil 10 tablet dari Batch 1\nSisa kebutuhan: 15"]
    D --> E{"Batch 2: ED Maret 2025\nStok Sisa: 20 tablet"}
    E --> F["Ambil 15 tablet dari Batch 2\nSisa kebutuhan: 0"]
    F --> G["Update stokSisa Batch 1 → 0\nUpdate stokSisa Batch 2 → 5"]
    G --> H["Buat 2 record DetailPenjualan\n(Batch 1: 10 tab, Batch 2: 15 tab)"]
    H --> I["Catat KartuStok\n2 entri KELUAR"]
    I --> J["Selesai ✓"]
```

### 7.5 Proteksi Konsistensi

- Seluruh operasi FIFO berjalan dalam **satu Prisma `$transaction`** — jika salah satu langkah gagal, semua di-rollback
- Stok minimum check dilakukan **sebelum** deduction — jika stok tidak cukup, transaksi dibatalkan dengan pesan error yang jelas
- **Optimistic Locking**: Menggunakan `@@index([obatId, expiredDate])` untuk performa query FIFO

---

## 8. Konsinyasi Logic

### 8.1 Konsep Konsinyasi

Obat konsinyasi adalah produk yang **dititipkan supplier** ke apotek. Apotek hanya membayar untuk produk yang **sudah terjual** — produk yang tidak terjual dikembalikan tanpa biaya.

### 8.2 Data Model

```prisma
model Konsinyasi {
  id              String    @id @default(cuid())
  obatId          String    @unique
  supplierId      String
  persenBagiHasil Decimal   // % yang menjadi hak apotek dari penjualan
  hargaTitip      Decimal   // harga per unit yang akan ditagih supplier
  tanggalMulai    DateTime
  tanggalSelesai  DateTime?
  status          KonsinyasiStatus // AKTIF, SELESAI, DIBATALKAN
  log             KonsinyasiLog[]
  obat            Obat      @relation(fields: [obatId], references: [id])
  supplier        Supplier  @relation(fields: [supplierId], references: [id])
}

model KonsinyasiLog {
  id            String    @id @default(cuid())
  konsinyasiId  String
  penjualanId   String?
  tanggal       DateTime
  jenis         String    // TERJUAL, RETUR_KE_SUPPLIER, TAGIHAN_DIBUAT
  jumlah        Int
  nilaiTagihan  Decimal   // = jumlah × hargaTitip
  nilaiBagiHasil Decimal  // = nilaiTagihan × (1 - persenBagiHasil/100)
  konsinyasi    Konsinyasi @relation(fields: [konsinyasiId], references: [id])
}
```

### 8.3 Alur Konsinyasi

```mermaid
flowchart TD
    A["Supplier mengirim obat titipan"] --> B["Buat record Konsinyasi\n+ tandai obat isKonsinyasi=true"]
    B --> C["Stok masuk via Penerimaan Barang Konsinyasi\n(bukan faktur biasa — tidak ada hutang PBF)"]
    C --> D{"Produk terjual\ndi kasir?"}
    D -->|Ya| E["DetailPenjualan dicatat normal\n+ trigger KonsinyasiLog jenis TERJUAL"]
    E --> F["Hitung: nilaiTagihan = jumlah × hargaTitip\nBagiHasil apotek = nilaiTagihan × persenBagiHasil%"]
    D -->|Tidak terjual| G["Akhir periode konsinyasi\nBuat Retur Konsinyasi ke Supplier"]
    F --> H["Periode tagihan (mis. bulanan)\nGenerate Tagihan Konsinyasi PDF"]
    H --> I["Bayar tagihan ke supplier\nCatat pelunasan HutangKonsinyasi"]
    G --> J["Kurangi stok\nTidak ada tagihan untuk obat diretur"]
```

### 8.4 Generasi Tagihan Konsinyasi

```typescript
// Fungsi generate tagihan konsinyasi untuk periode tertentu
async function generateTagihanKonsinyasi(
  konsinyasiId: string,
  periodeAwal: Date,
  periodeAkhir: Date
) {
  const logs = await prisma.konsinyasiLog.findMany({
    where: {
      konsinyasiId,
      jenis: 'TERJUAL',
      tanggal: { gte: periodeAwal, lte: periodeAkhir },
    },
  });

  const totalTerjual = logs.reduce((sum, l) => sum + l.jumlah, 0);
  const totalTagihan = logs.reduce((sum, l) => sum + Number(l.nilaiTagihan), 0);
  const totalBagiHasilApotek = logs.reduce((sum, l) => sum + Number(l.nilaiBagiHasil), 0);

  return {
    totalTerjual,
    totalTagihan,
    totalBagiHasilApotek,
    yangHarusDibayar: totalTagihan - totalBagiHasilApotek,
  };
}
```

---

## 9. Accounting Engine

### 9.1 Chart of Accounts (CoA) Default

| Kode | Nama Akun | Tipe | Kategori |
|---|---|---|---|
| `1-1000` | Kas | DEBIT | Aset Lancar |
| `1-1001` | Kas QRIS | DEBIT | Aset Lancar |
| `1-1002` | Kas Kartu Debit | DEBIT | Aset Lancar |
| `1-1003` | Kas Kartu Kredit | DEBIT | Aset Lancar |
| `1-1100` | Piutang Pelanggan | DEBIT | Aset Lancar |
| `1-1200` | Persediaan Obat | DEBIT | Aset Lancar |
| `1-1201` | Persediaan Konsinyasi | DEBIT | Aset Lancar |
| `2-1000` | Hutang PBF | KREDIT | Kewajiban |
| `2-1100` | Hutang Konsinyasi | KREDIT | Kewajiban |
| `4-1000` | Pendapatan Penjualan | KREDIT | Pendapatan |
| `4-1001` | Pendapatan Jasa Racik | KREDIT | Pendapatan |
| `4-1002` | Diskon Penjualan | DEBIT | Kontra Pendapatan |
| `5-1000` | HPP (Harga Pokok Penjualan) | DEBIT | Beban |
| `5-1001` | Beban Retur Pembelian | DEBIT | Beban |

### 9.2 Mapping Transaksi → Jurnal Otomatis

#### 9.2.1 Penjualan Tunai

| Debit | Kredit | Nominal |
|---|---|---|
| Kas (1-1000) | Pendapatan Penjualan (4-1000) | Total Penjualan |
| HPP (5-1000) | Persediaan Obat (1-1200) | Nilai HPP |
| Diskon Penjualan (4-1002) | Kas (1-1000) | Nominal Diskon |

#### 9.2.2 Penjualan Kredit (Piutang)

| Debit | Kredit | Nominal |
|---|---|---|
| Piutang Pelanggan (1-1100) | Pendapatan Penjualan (4-1000) | Total Penjualan |
| HPP (5-1000) | Persediaan Obat (1-1200) | Nilai HPP |

#### 9.2.3 Pembelian Obat — Hutang ke PBF

| Debit | Kredit | Nominal |
|---|---|---|
| Persediaan Obat (1-1200) | Hutang PBF (2-1000) | Total Pembelian |

#### 9.2.4 Retur Penjualan

| Debit | Kredit | Nominal |
|---|---|---|
| Pendapatan Penjualan (4-1000) | Kas (1-1000) | Nilai Retur |
| Persediaan Obat (1-1200) | HPP (5-1000) | Nilai HPP Retur |

#### 9.2.5 Stok Opname — Penyesuaian Negatif

| Debit | Kredit | Nominal |
|---|---|---|
| Beban Penyesuaian Stok (5-1002) | Persediaan Obat (1-1200) | Selisih × HPP |

### 9.3 Implementasi Journal Generator

```typescript
// lib/utils/akuntansi.ts

type JurnalEntry = {
  coaId: string;
  posisi: 'DEBIT' | 'KREDIT';
  nominal: Decimal;
  keterangan?: string;
};

async function generateJurnalPenjualan(
  tx: PrismaTransactionClient,
  penjualan: PenjualanWithRelations,
) {
  const entries: JurnalEntry[] = [];

  for (const pembayaran of penjualan.pembayaran) {
    const coaKas = getCoAByMetodeBayar(pembayaran.metode);
    entries.push({ coaId: coaKas, posisi: 'DEBIT', nominal: pembayaran.jumlah });
  }

  entries.push({
    coaId: COA_PENDAPATAN_PENJUALAN,
    posisi: 'KREDIT',
    nominal: penjualan.subtotal,
  });

  if (penjualan.totalDiskon > 0) {
    entries.push({ coaId: COA_DISKON_PENJUALAN, posisi: 'DEBIT', nominal: penjualan.totalDiskon });
    entries.push({ coaId: getCoAByMetodeBayar(penjualan.metodeBayarUtama), posisi: 'KREDIT', nominal: penjualan.totalDiskon });
  }

  // Jurnal HPP
  entries.push({ coaId: COA_HPP, posisi: 'DEBIT', nominal: penjualan.totalHPP });
  entries.push({ coaId: COA_PERSEDIAAN, posisi: 'KREDIT', nominal: penjualan.totalHPP });

  await tx.jurnal.create({
    data: {
      tanggal: penjualan.tanggal,
      keterangan: `Penjualan #${penjualan.noTransaksi}`,
      referensiId: penjualan.id,
      referensiTipe: 'PENJUALAN',
      detail: { create: entries },
    },
  });
}
```

### 9.4 Laporan Keuangan

| Laporan | Deskripsi | Periode |
|---|---|---|
| **Jurnal Umum** | Semua entri jurnal ganda berurutan | Harian / Rentang |
| **Buku Besar** | Mutasi per akun CoA + saldo berjalan | Bulanan / Rentang |
| **Laba/Rugi** | Pendapatan − HPP − Beban = Laba Bersih | Bulanan / Tahunan |
| **Neraca** | Aset = Kewajiban + Ekuitas | Snapshot tanggal tertentu |
| **Rasio Keuangan** | Gross Margin, Net Margin, Current Ratio, Inventory Turnover | Bulanan |

---

## 10. Multi-Payment Logic

### 10.1 Metode Pembayaran yang Didukung

| Metode | Kode | CoA |
|---|---|---|
| Tunai | `CASH` | `1-1000` Kas |
| Kartu Debit | `DEBIT_CARD` | `1-1002` Kas Kartu Debit |
| Kartu Kredit | `CREDIT_CARD` | `1-1003` Kas Kartu Kredit |
| QRIS | `QRIS` | `1-1001` Kas QRIS |
| Kredit Pelanggan | `CREDIT` | `1-1100` Piutang Pelanggan |

### 10.2 Split Payment

Split payment memungkinkan satu transaksi dibayar dengan **beberapa metode** sekaligus.

```typescript
// Contoh: Total Rp 150.000 dibayar:
// - Rp 100.000 Tunai
// - Rp 50.000 QRIS

const pembayaran = [
  { metode: 'CASH', jumlah: 100_000 },
  { metode: 'QRIS', jumlah: 50_000 },
];

// Validasi:
const totalBayar = pembayaran.reduce((s, p) => s + p.jumlah, 0);
if (totalBayar < totalTransaksi) {
  // Ada sisa → tanya apakah kredit (piutang) atau batalkan
}
if (totalBayar > totalTransaksi) {
  // Kembalian = totalBayar - totalTransaksi
}
```

### 10.3 Manajemen Hutang ke PBF

```mermaid
flowchart LR
    A["Faktur Pembelian Diterima"] --> B["Buat HutangPBF\nstatus: BELUM_LUNAS\njatuh_tempo: +30 hari"]
    B --> C{"Jatuh Tempo\nTercapai?"}
    C -->|Ya| D["Alert: Hutang Jatuh Tempo\nKirim notif WA ke pemilik"]
    C -->|Bayar Sebagian| E["Update HutangPBF\nsisaHutang dikurangi\nstatus: SEBAGIAN"]
    C -->|Bayar Lunas| F["Update HutangPBF status: LUNAS\nGenerate Jurnal Pelunasan"]
```

### 10.4 Manajemen Piutang Pelanggan

```prisma
model PiutangPelanggan {
  id            String    @id @default(cuid())
  penjualanId   String    @unique
  pelangganId   String?
  memberId      String?
  jumlahPiutang Decimal
  sisaPiutang   Decimal
  jatuhTempo    DateTime
  status        PiutangStatus // BELUM_LUNAS, SEBAGIAN, LUNAS
  pembayaran    PembayaranPiutang[]
}
```

---

## 11. Mobile-First Strategy

### 11.1 Modul dengan Dedicated Mobile View

| Modul | Desktop Path | Mobile Path | Perbedaan Mobile |
|---|---|---|---|
| **Kasir POS** | `/penjualan/pos` | `/(mobile)/kasir` | UI ringkas, bottom sheet cart, kamera scan |
| **Input Pembelian** | `/pembelian/faktur/baru` | `/(mobile)/input-pembelian` | Form satu per satu, barcode scan item |
| **Stok Opname** | `/master/opname` | `/(mobile)/opname` | Scan barcode untuk cari produk, input angka besar |

### 11.2 Barcode Scanning Implementation

```typescript
// hooks/useScanner.ts
import { BrowserMultiFormatReader } from '@zxing/library';

export function useScanner(onDetected: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader>();

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    readerRef.current.decodeFromVideoDevice(
      null, // null = default camera
      videoRef.current!,
      (result, error) => {
        if (result) {
          onDetected(result.getText());
          // Cooldown: 1.5 detik sebelum scan berikutnya (hindari double scan)
        }
      }
    );

    return () => {
      readerRef.current?.reset();
    };
  }, [onDetected]);

  return { videoRef };
}
```

### 11.3 PWA & Offline Support

```typescript
// next.config.ts — menggunakan next-pwa
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  runtimeCaching: [
    {
      urlPattern: /^\/api\/v1\/master\/obat/,
      handler: 'StaleWhileRevalidate', // Cache daftar obat
      options: { cacheName: 'obat-cache', expiration: { maxAgeSeconds: 3600 } },
    },
  ],
});
```

**Offline Queue (IndexedDB via Zustand persist):**

```typescript
// stores/offlineStore.ts
interface OfflineTransaction {
  id: string;
  payload: CreateTransaksiDTO;
  createdAt: Date;
  retryCount: number;
}

const useOfflineStore = create(
  persist<{ queue: OfflineTransaction[]; enqueue: (t: OfflineTransaction) => void }>(
    (set) => ({
      queue: [],
      enqueue: (t) => set((s) => ({ queue: [...s.queue, t] })),
    }),
    { name: 'offline-queue', storage: createJSONStorage(() => indexedDBStorage) }
  )
);
```

### 11.4 Responsive Layout Strategy

- **Desktop (≥1024px)**: Sidebar + konten utama; tabel penuh dengan semua kolom
- **Tablet (768–1023px)**: Sidebar tersembunyi (drawer), tabel kolom dikurangi
- **Mobile (<768px)**: Bottom navigation; POS menggunakan layout vertikal — search di atas, cart di bawah sebagai bottom sheet

---

## 12. Shift Management

### 12.1 Workflow Shift

```mermaid
stateDiagram-v2
    [*] --> BUKA_SHIFT: Kasir login & mulai shift
    BUKA_SHIFT --> SHIFT_AKTIF: Input Kas Awal
    SHIFT_AKTIF --> SHIFT_AKTIF: Transaksi berlangsung
    SHIFT_AKTIF --> TUTUP_SHIFT: Kasir minta tutup shift
    TUTUP_SHIFT --> REKONSILIASI: Input Kas Akhir Fisik
    REKONSILIASI --> SHIFT_SELESAI: Selisih dihitung & disetujui
    REKONSILIASI --> REKONSILIASI: Ada selisih → perlu approval
    SHIFT_SELESAI --> [*]
```

### 12.2 Data Model Shift

```prisma
model Shift {
  id            String      @id @default(cuid())
  userId        String      // kasir yang membuka shift
  kasirNama     String
  waktuBuka     DateTime    @default(now())
  waktuTutup    DateTime?
  kasAwal       Decimal     // uang di laci saat buka shift
  kasAkhirFisik Decimal?    // uang fisik saat tutup shift (input manual)
  kasAkhirSistem Decimal?   // kalkulasi otomatis dari transaksi
  selisih       Decimal?    // kasAkhirFisik - kasAkhirSistem
  status        ShiftStatus // AKTIF, SELESAI, TERKUNCI
  catatan       String?
  penjualan     Penjualan[]
  user          User        @relation(fields: [userId], references: [id])
}
```

### 12.3 Rekonsiliasi Kas

```typescript
// Kalkulasi kasAkhirSistem saat tutup shift
async function hitungKasAkhirSistem(shiftId: string) {
  const penjualan = await prisma.penjualan.findMany({
    where: { shiftId },
    include: { pembayaran: true },
  });

  const totalPerMetode = penjualan.reduce((acc, p) => {
    p.pembayaran.forEach((bay) => {
      acc[bay.metode] = (acc[bay.metode] || 0) + Number(bay.jumlah);
    });
    return acc;
  }, {} as Record<string, number>);

  const kasAkhirSistem =
    shift.kasAwal +
    (totalPerMetode['CASH'] || 0) -
    totalReturTunai;

  return { totalPerMetode, kasAkhirSistem };
}
```

### 12.4 Laporan Shift

Laporan shift mencakup:
- Kas awal
- Total transaksi per metode bayar (Tunai, Kartu, QRIS)
- Total retur
- Kas akhir sistem (otomatis)
- Kas akhir fisik (input kasir)
- **Selisih** (perbedaan antara fisik dan sistem)
- Daftar semua transaksi dalam shift

---

## 13. Online Sales Integration

### 13.1 Arsitektur Integrasi

```mermaid
flowchart TD
    subgraph Eksternal["Platform Eksternal"]
        VM["VMedisMart\nWebhook"]
        KD["KlikDokter\nWebhook"]
        WS["Webstore\nApotik Tamansari\n(Next.js storefront)"]
    end

    subgraph Sistem["Apotik Tamansari Core"]
        WH_VM["POST /api/v1/webhooks/vmedimart"]
        WH_KD["POST /api/v1/webhooks/klikdokter"]
        WH_WS["Internal API Call"]
        
        PARSER["Order Parser\n(Normalisasi format berbeda)"]
        VALIDATOR["Stok Validator\n(Cek ketersediaan)"]
        QUEUE["BullMQ Queue\n(Async Processing)"]
        ORDER_PROC["Order Processor\n(Buat transaksi)"]
        
        WH_VM --> PARSER
        WH_KD --> PARSER
        WH_WS --> PARSER
        PARSER --> VALIDATOR
        VALIDATOR --> QUEUE
        QUEUE --> ORDER_PROC
        ORDER_PROC --> NOTIF["Notifikasi WA\nke Apoteker"]
    end

    VM --> WH_VM
    KD --> WH_KD
    WS --> WH_WS
```

### 13.2 Webhook Handler

```typescript
// app/api/v1/webhooks/vmedimart/route.ts
export async function POST(request: Request) {
  // 1. Verifikasi signature HMAC dari VMedisMart
  const signature = request.headers.get('x-vmedimart-signature');
  const isValid = verifyWebhookSignature(await request.text(), signature!);
  if (!isValid) return new Response('Unauthorized', { status: 401 });

  const rawOrder = await request.json();

  // 2. Normalisasi order ke format internal
  const normalizedOrder = normalizeVmedisMartOrder(rawOrder);

  // 3. Simpan sebagai OnlineOrder dengan status PENDING
  const onlineOrder = await prisma.onlineOrder.create({
    data: {
      kanal: 'VMEDIMART',
      externalId: rawOrder.order_id,
      payload: rawOrder,
      status: 'PENDING',
      normalizedData: normalizedOrder,
    },
  });

  // 4. Push ke queue untuk diproses async
  await onlineOrderQueue.add('process-order', { onlineOrderId: onlineOrder.id });

  return Response.json({ received: true, id: onlineOrder.id });
}
```

### 13.3 Status Order Online

| Status | Deskripsi |
|---|---|
| `PENDING` | Order masuk, belum diproses |
| `DIVERIFIKASI` | Stok tersedia, apoteker menyetujui |
| `DIPROSES` | Obat sedang disiapkan / racikan |
| `SIAP_KIRIM` | Obat siap — menunggu kurir |
| `SELESAI` | Transaksi selesai, stok sudah dipotong |
| `DIBATALKAN` | Order dibatalkan (stok habis / pelanggan batal) |

---

## 14. WhatsApp Integration

### 14.1 Arsitektur WA

```mermaid
flowchart LR
    TRIGGER["Event Trigger\n(Penjualan, Promo, Reminder)"]
    BUILDER["Message Builder\n(Template + Data)"]
    QUEUE["BullMQ WA Queue"]
    WORKER["WA Worker"]
    FONNTE["Fonnte API\n(WhatsApp Gateway)"]
    LOG["WALog\n(Database)"]

    TRIGGER --> BUILDER
    BUILDER --> QUEUE
    QUEUE --> WORKER
    WORKER --> FONNTE
    FONNTE --> LOG
    FONNTE --> PELANGGAN["Pelanggan\n(WhatsApp)"]
```

### 14.2 Template Sistem

```typescript
// Tipe-tipe template WA
type WATemplateType =
  | 'STRUK_DIGITAL'        // Struk setelah transaksi
  | 'PROMO_MEMBER'         // Broadcast promo ke member
  | 'REMINDER_TEBUS'       // Reminder tebus resep
  | 'HUTANG_JATUH_TEMPO'   // Notif hutang PBF hampir jatuh tempo
  | 'STOK_MINIMUM'         // Notif stok di bawah minimum
  | 'EXPIRED_ALERT';       // Notif obat akan expired

// Contoh template struk digital dengan variable substitution
const templateStrukDigital = `
Halo {{nama_pelanggan}} 👋

Terima kasih telah berbelanja di *Apotik Tamansari* 🏥

📋 *Struk Digital*
No. Transaksi: {{no_transaksi}}
Tanggal: {{tanggal}}

{{daftar_item}}

─────────────────
Subtotal: Rp {{subtotal}}
Diskon: Rp {{diskon}}
*Total: Rp {{total}}*
─────────────────
Pembayaran: {{metode_bayar}}

Semoga lekas sembuh & sehat selalu! 🌿
`;
```

### 14.3 WA Worker Implementation

```typescript
// workers/whatsapp.worker.ts
export const waWorker = new Worker('wa-queue', async (job) => {
  const { templateType, targetPhone, variables } = job.data;

  const template = await prisma.wATemplate.findFirst({
    where: { tipe: templateType, isAktif: true },
  });

  const message = substituteVariables(template!.isi, variables);

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: process.env.FONNTE_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: targetPhone, message }),
    });

    const result = await response.json();

    await prisma.wALog.create({
      data: {
        targetPhone,
        templateType,
        status: result.status ? 'TERKIRIM' : 'GAGAL',
        response: result,
      },
    });
  } catch (error) {
    await prisma.wALog.create({
      data: { targetPhone, templateType, status: 'GAGAL', errorMessage: String(error) },
    });
    throw error; // BullMQ akan retry otomatis
  }
}, { connection: redisConnection, concurrency: 5 });
```

---

## 15. Security & RBAC

### 15.1 Role Definitions

| Role | Deskripsi |
|---|---|
| `ADMIN` | Pemilik apotek — akses penuh ke semua modul |
| `APOTEKER` | Verifikasi resep, approval retur, akses laporan |
| `TTK` | Teknisi Teknis Kefarmasian / Kasir — POS, pembelian, opname |
| `MANAJER` | Laporan, analitik, dashboard — read-only untuk operasional |

### 15.2 Permission Matrix

| Modul | ADMIN | APOTEKER | TTK | MANAJER |
|---|---|---|---|---|
| Master Obat — Lihat | ✅ | ✅ | ✅ | ✅ |
| Master Obat — Edit | ✅ | ✅ | ❌ | ❌ |
| Harga Jual — Edit | ✅ | ✅ | ❌ | ❌ |
| Pembelian — Input | ✅ | ✅ | ✅ | ❌ |
| Pembelian — Approval Retur | ✅ | ✅ | ❌ | ❌ |
| Penjualan — POS | ✅ | ✅ | ✅ | ❌ |
| Penjualan — Retur | ✅ | ✅ | ❌ | ❌ |
| Stok Opname | ✅ | ✅ | ✅ | ❌ |
| CRM / Member | ✅ | ✅ | ✅ | ✅ |
| WhatsApp — Broadcast | ✅ | ✅ | ❌ | ❌ |
| Laporan Shift | ✅ | ❌ | ✅ (shift sendiri) | ✅ |
| Laporan Keuangan | ✅ | ❌ | ❌ | ✅ |
| Akuntansi | ✅ | ❌ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Konfigurasi Sistem | ✅ | ❌ | ❌ | ❌ |

### 15.3 Implementasi RBAC di Middleware

```typescript
// src/middleware.ts
import { getToken } from 'next-auth/jwt';
import { ROUTE_PERMISSIONS } from './lib/rbac';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Redirect ke login jika belum auth
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userRole = token.role as string;
  const path = request.nextUrl.pathname;

  // Cek permission berdasarkan route
  const requiredPermission = ROUTE_PERMISSIONS[path];
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(dashboard)/:path*', '/api/v1/:path*'],
};
```

### 15.4 Security Measures Tambahan

| Measure | Implementasi |
|---|---|
| **HTTPS Only** | Enforced di Vercel + HSTS header |
| **Rate Limiting** | Redis-based rate limit di API routes (100 req/menit per IP) |
| **Input Validation** | Zod schema validation di setiap API route |
| **SQL Injection** | Prisma parameterized queries — tidak ada raw SQL |
| **XSS Protection** | Next.js built-in + Content Security Policy header |
| **Audit Log** | Semua aksi sensitif dicatat (siapa, apa, kapan) |
| **Session Timeout** | NextAuth session expires dalam 8 jam (1 shift) |
| **Environment Secrets** | Semua secret di `.env` — tidak ada hardcoded credential |

---

## 16. Performance Considerations

### 16.1 Database Indexing Strategy

```prisma
model Batch {
  @@index([obatId, expiredDate])      // FIFO query
  @@index([obatId, stokSisa])         // Stok minimum check
}

model KartuStok {
  @@index([obatId, tanggal])          // Kartu stok filter per obat & periode
  @@index([referensiId])              // Lookup by transaksi
}

model Penjualan {
  @@index([shiftId])                  // Laporan shift
  @@index([tanggal])                  // Laporan harian/bulanan
  @@index([memberId])                 // Riwayat pembelian member
}

model DetailJurnal {
  @@index([coaId, tanggal])           // Buku besar per akun
}

model OnlineOrder {
  @@index([kanal, status])            // Filter order per kanal
  @@index([externalId])               // Dedup check
}
```

### 16.2 Pagination Strategy

Semua endpoint list menggunakan **cursor-based pagination** untuk performa konsisten:

```typescript
// Cursor-based pagination (lebih efisien dari OFFSET untuk dataset besar)
const obatList = await prisma.obat.findMany({
  take: pageSize + 1, // ambil satu extra untuk cek apakah ada halaman berikutnya
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { nama: 'asc' },
  where: filters,
});

const hasNextPage = obatList.length > pageSize;
const data = hasNextPage ? obatList.slice(0, -1) : obatList;
const nextCursor = hasNextPage ? data[data.length - 1].id : null;
```

### 16.3 Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Daftar master obat | Redis + TanStack Query | 1 jam (invalidate saat edit) |
| Chart of Accounts | Redis | 24 jam |
| Laporan analitik | Redis | 15 menit |
| Harga obat | TanStack Query | 30 menit |
| Session user | NextAuth JWT | 8 jam |

```typescript
// Contoh Redis caching di API route
const cacheKey = `obat-list:${JSON.stringify(filters)}`;
const cached = await redis.get(cacheKey);

if (cached) return Response.json(JSON.parse(cached));

const data = await prisma.obat.findMany({ where: filters });
await redis.setex(cacheKey, 3600, JSON.stringify(data)); // TTL 1 jam

return Response.json(data);
```

### 16.4 Query Optimization

- **Select hanya kolom yang dibutuhkan**: Gunakan Prisma `select` bukan `include` untuk daftar/tabel
- **Lazy loading**: Gunakan React Suspense + streaming untuk komponen berat (laporan PDF)
- **Virtualized lists**: `@tanstack/react-virtual` untuk daftar obat > 1000 item
- **Image optimization**: Gambar produk via Next.js `<Image>` dengan lazy loading otomatis
- **Background reports**: Laporan besar digenerate via BullMQ worker, hasilnya di-download — tidak memblok request utama

---

## 17. Deployment Architecture

### 17.1 Recommended Stack Deployment

```mermaid
flowchart TD
    subgraph Internet
        USER["Pengguna\n(Browser / Mobile)"]
        CDN["Vercel Edge Network\n(CDN + SSL)"]
    end

    subgraph Vercel["Vercel Platform"]
        NEXT["Next.js App\n(Serverless Functions + Edge)"]
        STATIC["Static Assets\n(Tailwind CSS, JS bundles)"]
    end

    subgraph DataServices["Data Services"]
        SUPABASE["Supabase\n(PostgreSQL 16 + pgvector)"]
        REDIS_CLOUD["Upstash Redis\n(Serverless Redis)"]
    end

    subgraph Workers["Background Workers — Railway / VPS"]
        WORKER_WA["WA Worker\n(BullMQ)"]
        WORKER_LAPORAN["Report Worker\n(BullMQ)"]
        WORKER_SYNC["Online Sync Worker\n(BullMQ)"]
    end

    USER --> CDN
    CDN --> NEXT
    CDN --> STATIC
    NEXT --> SUPABASE
    NEXT --> REDIS_CLOUD
    NEXT --> Workers
    Workers --> SUPABASE
    Workers --> REDIS_CLOUD
```

### 17.2 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/apotik_tamansari?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/apotik_tamansari"  # Untuk migrasi Prisma

# Auth
NEXTAUTH_SECRET="your-super-secret-32-char-min"
NEXTAUTH_URL="https://apotik-tamansari.vercel.app"

# Redis
REDIS_URL="redis://default:pass@endpoint.upstash.io:6379"

# WhatsApp
FONNTE_TOKEN="your-fonnte-api-token"

# Webhook Secrets
VMEDIMART_WEBHOOK_SECRET="your-vmedimart-secret"
KLIKDOKTER_WEBHOOK_SECRET="your-klikdokter-secret"

# App Config
NEXT_PUBLIC_APP_NAME="Apotik Tamansari"
NEXT_PUBLIC_APP_URL="https://apotik-tamansari.vercel.app"
```

### 17.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml (GitHub Actions)
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test

  migrate:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 17.4 Monitoring & Observability

| Tool | Fungsi |
|---|---|
| **Vercel Analytics** | Web Vitals (LCP, FID, CLS) monitoring |
| **Sentry** | Error tracking & alerting |
| **Upstash Redis Console** | Queue monitoring & Redis metrics |
| **Supabase Dashboard** | DB performance, slow queries |
| **BullMQ Dashboard** | Job queue status & failed jobs |

### 17.5 Backup Strategy

| Data | Frekuensi | Metode |
|---|---|---|
| PostgreSQL | Setiap hari, otomatis | Supabase Point-in-Time Recovery (PITR) |
| File upload (gambar produk) | Real-time | Supabase Storage (redundant) |
| Redis | Tidak perlu backup | Hanya cache — dapat direcreate dari DB |

---

## Appendix A — Nomor Dokumen Otomatis

Setiap transaksi mendapat nomor unik otomatis:

| Jenis | Format | Contoh |
|---|---|---|
| Penjualan | `JL-YYYYMMDD-XXXX` | `JL-20261114-0001` |
| Pembelian | `PB-YYYYMMDD-XXXX` | `PB-20261114-0001` |
| Purchase Order | `PO-YYYYMMDD-XXXX` | `PO-20261114-0001` |
| Retur Penjualan | `RP-YYYYMMDD-XXXX` | `RP-20261114-0001` |
| Retur Pembelian | `RB-YYYYMMDD-XXXX` | `RB-20261114-0001` |
| Stok Opname | `OP-YYYYMMDD-XXXX` | `OP-20261114-0001` |
| Jurnal Akuntansi | `JU-YYYYMMDD-XXXX` | `JU-20261114-0001` |

```typescript
async function generateNomor(prefix: string, tx: PrismaTransactionClient) {
  const today = format(new Date(), 'yyyyMMdd');
  const counter = await tx.counter.upsert({
    where: { key: `${prefix}-${today}` },
    update: { value: { increment: 1 } },
    create: { key: `${prefix}-${today}`, value: 1 },
  });
  return `${prefix}-${today}-${String(counter.value).padStart(4, '0')}`;
}
```

---

## Appendix B — Glossary

| Istilah | Definisi |
|---|---|
| **PBF** | Pedagang Besar Farmasi — distributor obat resmi |
| **FIFO** | First In, First Out — metode pengurangan stok batch tertua/paling dekat expired |
| **Konsinyasi** | Sistem titip-jual; apotek membayar supplier hanya untuk yang terjual |
| **Racikan** | Obat yang diracik/dicampur sesuai resep dokter dengan proporsi tertentu |
| **Embalase** | Biaya kemasan/wadah untuk obat racikan |
| **HPP** | Harga Pokok Penjualan — biaya perolehan barang yang terjual |
| **CoA** | Chart of Accounts — daftar akun buku besar standar akuntansi |
| **TTK** | Tenaga Teknis Kefarmasian — asisten apoteker / kasir apotek |
| **QRIS** | Quick Response Code Indonesian Standard — sistem pembayaran QR unified |
| **PWA** | Progressive Web App — web app yang bisa diinstall dan berjalan offline |
| **BullMQ** | Message queue berbasis Redis untuk background job di Node.js |
| **RSC** | React Server Components — komponen React yang dirender di server |

---

*Dokumen ini dikelola oleh tim pengembang Apotik Tamansari. Untuk pertanyaan arsitektur, hubungi lead developer.*

---

**Apotik Tamansari** © 2026 — All Rights Reserved
