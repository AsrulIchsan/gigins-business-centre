"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  User,
  Pill,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Percent,
  Loader2,
  Store,
  Building2,
  Coins,
  FileText,
  Info,
  Pencil,
  Boxes,
  Tag,
  Save,
  PackagePlus,
  Layers,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import { useBusinessStore } from "@/lib/business-store";
import { useMasterDataStore } from "@/lib/master-data-store";
import {
  INITIAL_PRODUCTS,
  ACTIVE_SHIFT,
  MockProduct,
  MockProductUnit,
  MockCustomer,
} from "@/lib/mock-data";
import { formatRupiah, calculateSellPrice } from "@/lib/utils";
import { printThermalReceipt, ThermalPaperWidth } from "@/lib/thermal-printer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CartItem {
  productId: string;
  name: string;
  unitName: string;
  conversionFactor: number;
  qty: number;
  sellPrice: number;
  subtotal: number;
  isCompounding?: boolean;
  selectedBatchNumber: string;
  expiredDate: string;
}

export default function PosPage() {
  const { activeBusiness } = useBusinessStore();
  const {
    customers,
    doctors,
    addCustomer,
    addDoctor,
    categories,
    addCategory,
    products,
    addProduct,
    updateProduct,
    updateProductStock,
    updateProductPrice,
  } = useMasterDataStore();
  const [saleType, setSaleType] = useState<"GENERAL" | "PRESCRIPTION" | "COMPOUNDING">("GENERAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Owner Mode State (Owner can edit stock, prices, drug details, & input new drugs)
  const isOwner = activeBusiness?.role === "OWNER";
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(true);

  // Products from Master Data Store (persistent)
  const productList = products && products.length > 0 ? products : INITIAL_PRODUCTS;

  // Filter products by search
  const filteredProducts = productList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── OWNER DRUG EDIT MODAL STATE & HANDLERS ──────────────────────────────
  const [isEditDrugModalOpen, setIsEditDrugModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<MockProduct | null>(null);
  const [editDrugForm, setEditDrugForm] = useState<{
    name: string;
    genericName: string;
    category: string;
    barcode: string;
    baseUnit: string;
    totalStock: number;
    stockAdjustmentReason: string;
    units: MockProductUnit[];
  }>({
    name: "",
    genericName: "",
    category: "",
    barcode: "",
    baseUnit: "",
    totalStock: 0,
    stockAdjustmentReason: "Penyesuaian stok fisik kasir",
    units: [],
  });

  const handleOpenEditDrugModal = (product: MockProduct) => {
    setEditingDrug(product);
    setEditDrugForm({
      name: product.name,
      genericName: product.genericName || "",
      category: product.category || "Analgesik & Antipiretik",
      barcode: product.barcode,
      baseUnit: product.baseUnit,
      totalStock: product.totalStock,
      stockAdjustmentReason: "Penyesuaian stok fisik kasir langsung oleh Owner",
      units: JSON.parse(JSON.stringify(product.units)),
    });
    setIsEditDrugModalOpen(true);
  };

  const handleSaveEditDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrug) return;

    const oldData = {
      name: editingDrug.name,
      genericName: editingDrug.genericName,
      category: editingDrug.category,
      barcode: editingDrug.barcode,
      totalStock: editingDrug.totalStock,
      sellPrice: editingDrug.units[0]?.sellPrice || 0,
      buyPrice: editingDrug.units[0]?.buyPrice || 0,
    };

    const newData = {
      name: editDrugForm.name.trim(),
      genericName: editDrugForm.genericName.trim(),
      category: editDrugForm.category.trim(),
      barcode: editDrugForm.barcode.trim(),
      totalStock: Number(editDrugForm.totalStock),
      sellPrice: editDrugForm.units[0]?.sellPrice || 0,
      buyPrice: editDrugForm.units[0]?.buyPrice || 0,
    };

    // Update in Zustand store
    updateProduct(editingDrug.id, {
      name: editDrugForm.name.trim(),
      genericName: editDrugForm.genericName.trim(),
      category: editDrugForm.category.trim(),
      barcode: editDrugForm.barcode.trim(),
      baseUnit: editDrugForm.baseUnit.trim(),
      totalStock: Number(editDrugForm.totalStock),
      units: editDrugForm.units,
    });

    // If stock changed, adjust batches
    if (editingDrug.totalStock !== Number(editDrugForm.totalStock)) {
      updateProductStock(editingDrug.id, Number(editDrugForm.totalStock));
    }

    // Call API for Activity Log
    try {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness?.id || "biz-apotik-tamansari",
          userId: "user-owner-gigin",
          productId: editingDrug.id,
          productName: editDrugForm.name.trim(),
          oldData,
          newData,
          reason: editDrugForm.stockAdjustmentReason,
        }),
      });
    } catch (err) {
      console.warn("Product edit logged locally:", err);
    }

    setIsEditDrugModalOpen(false);
    alert(`Data obat "${editDrugForm.name}" (Stok: ${editDrugForm.totalStock}, Harga & Info) berhasil diperbarui oleh Owner!`);
  };

  // ─── OWNER NEW DRUG MODAL STATE & HANDLERS ───────────────────────────────
  const [isAddDrugModalOpen, setIsAddDrugModalOpen] = useState(false);
  const [newDrugForm, setNewDrugForm] = useState({
    name: "",
    genericName: "",
    category: "Analgesik & Antipiretik",
    barcode: "",
    baseUnit: "Tablet",
    buyPrice: 1000,
    marginPct: 25,
    sellPrice: 1250,
    initialStock: 100,
    batchNumber: "",
    expiredDate: "2027-12-31",
    supplierName: "PT Kimia Farma Trading & Dist",
    hasSecondUnit: false,
    secondUnitName: "Strip",
    secondConversionFactor: 10,
    secondSellPrice: 12000,
  });

  const handleOpenAddDrugModal = () => {
    const randomBarcode = `899${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomBatch = `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setNewDrugForm({
      name: "",
      genericName: "",
      category: categories[0] || "Analgesik & Antipiretik",
      barcode: randomBarcode,
      baseUnit: "Tablet",
      buyPrice: 1000,
      marginPct: 25,
      sellPrice: 1250,
      initialStock: 100,
      batchNumber: randomBatch,
      expiredDate: "2027-12-31",
      supplierName: "PT Kimia Farma Trading & Dist",
      hasSecondUnit: false,
      secondUnitName: "Strip",
      secondConversionFactor: 10,
      secondSellPrice: 12000,
    });
    setIsAddDrugModalOpen(true);
  };

  const handleSaveNewDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugForm.name.trim()) {
      alert("Nama obat wajib diisi!");
      return;
    }

    const baseUnit = newDrugForm.baseUnit.trim() || "Tablet";
    const buyPrice = Number(newDrugForm.buyPrice) || 0;
    const sellPrice = Number(newDrugForm.sellPrice) || 0;

    const units: MockProductUnit[] = [
      {
        id: `u-${Date.now()}-1`,
        unitName: baseUnit,
        conversionFactor: 1,
        isBaseUnit: true,
        buyPrice,
        sellPrice,
      },
    ];

    if (newDrugForm.hasSecondUnit && newDrugForm.secondUnitName) {
      const conv = Number(newDrugForm.secondConversionFactor) || 10;
      units.push({
        id: `u-${Date.now()}-2`,
        unitName: newDrugForm.secondUnitName.trim(),
        conversionFactor: conv,
        isBaseUnit: false,
        buyPrice: buyPrice * conv,
        sellPrice: Number(newDrugForm.secondSellPrice) || sellPrice * conv,
      });
    }

    const createdProd = addProduct({
      name: newDrugForm.name.trim(),
      genericName: newDrugForm.genericName.trim() || newDrugForm.name.trim(),
      category: newDrugForm.category.trim(),
      barcode: newDrugForm.barcode.trim(),
      baseUnit,
      buyPrice,
      sellPrice,
      initialStock: Number(newDrugForm.initialStock) || 0,
      batchNumber: newDrugForm.batchNumber.trim(),
      expiredDate: newDrugForm.expiredDate,
      supplierName: newDrugForm.supplierName,
      units,
    });

    // Call API for Activity Log
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness?.id || "biz-apotik-tamansari",
          userId: "user-owner-gigin",
          name: createdProd.name,
          genericName: createdProd.genericName,
          category: createdProd.category,
          barcode: createdProd.barcode,
          baseUnit: createdProd.baseUnit,
          buyPrice,
          sellPrice,
          initialStock: createdProd.totalStock,
        }),
      });
    } catch (err) {
      console.warn("Product add logged locally:", err);
    }

    setIsAddDrugModalOpen(false);
    setSearchQuery(createdProd.name);
    alert(`Obat baru "${createdProd.name}" berhasil ditambahkan dan siap dijual di kasir!`);
  };

  // Prescription specifics
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [prescriptionNumber, setPrescriptionNumber] = useState<string>("");

  // Modal Tambah Pelanggan Baru Langsung di POS
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTier, setNewCustTier] = useState<"REGULAR" | "SILVER" | "GOLD" | "PLATINUM">("REGULAR");

  // Modal Tambah Dokter Baru Langsung di POS
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocClinic, setNewDocClinic] = useState("");
  const [newDocSip, setNewDocSip] = useState("");

  const handleOpenAddCustomer = (searchVal?: string) => {
    setNewCustName(searchVal || "");
    setNewCustPhone("");
    setNewCustTier("REGULAR");
    setIsAddCustModalOpen(true);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      tier: newCustTier,
    });
    setSelectedCustomer(created);
    setIsAddCustModalOpen(false);
  };

  const handleOpenAddDoctor = (searchVal?: string) => {
    setNewDocName(searchVal || "");
    setNewDocClinic("");
    setNewDocSip("");
    setIsAddDocModalOpen(true);
  };

  const handleSaveNewDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const created = addDoctor({
      name: newDocName.trim(),
      clinic: newDocClinic.trim(),
      sip: newDocSip.trim(),
    });
    setSelectedDoctorId(created.id);
    setIsAddDocModalOpen(false);
  };

  // Compounding specifics (Racikan)
  const [compoundingFee, setCompoundingFee] = useState<number>(5000); // Tuslah / Jasa Racik
  const [embalaseFee, setEmbalaseFee] = useState<number>(2000); // Wadah / Pot / Cangkang Kapsul
  const [compoundingName, setCompoundingName] = useState<string>("Racikan Salep Eksim");

  // Payment state (Langsung di layar utama POS, tanpa popup)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TF" | "DEBIT" | "SPLIT" | "CREDIT">("CASH");
  const [paymentNote, setPaymentNote] = useState<string>("Tunai (Cash)");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitNonCash, setSplitNonCash] = useState<number>(0);
  const [creditDueDate, setCreditDueDate] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("BCA");

  // Receipt Modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [thermalPaperWidth, setThermalPaperWidth] = useState<ThermalPaperWidth>("58mm");

  const handlePrintReceipt = (width: ThermalPaperWidth = thermalPaperWidth) => {
    if (!completedSale) return;
    printThermalReceipt(
      {
        businessName: completedSale.businessName || activeBusiness?.name || "APOTIK TAMANSARI",
        businessAddress: activeBusiness?.address || "Jl. Tamansari No. 45, Bandung",
        businessPhone: activeBusiness?.phone || "022-2501234",
        licenseNumber: activeBusiness?.licenseNumber || "SIPA: 19850412/SIPA-32.73/2022",
        saleNumber: completedSale.saleNumber,
        date: completedSale.date,
        cashier: completedSale.cashier,
        customerName: completedSale.customer?.name || "Pelanggan Umum",
        customerTier: completedSale.customer?.tier,
        doctorName: completedSale.doctor?.name,
        saleType: completedSale.saleType,
        items: completedSale.items.map((it: any) => ({
          name: it.name,
          qty: it.qty,
          unitName: it.unitName,
          sellPrice: it.sellPrice,
          subtotal: it.subtotal,
        })),
        subtotal: completedSale.subtotal,
        compoundingFee: completedSale.compoundingFee,
        embalaseFee: completedSale.embalaseFee,
        discountAmount: completedSale.discountAmount,
        totalAmount: completedSale.totalAmount,
        paymentMethod: completedSale.paymentMethod,
        paymentNote: completedSale.paymentNote,
        cashGiven: completedSale.cashGiven,
        roundingAmount: completedSale.roundingAmount,
        change: completedSale.change,
        footerNote: activeBusiness?.type === "PHARMACY" ? "Semoga Lekas Sembuh" : "Terima Kasih atas Kunjungan Anda",
      },
      width
    );
  };

  // Add item to cart with FIFO batch assignment
  const addToCart = (product: MockProduct, unitIndex = 0) => {
    const selectedUnit = product.units[unitIndex] || product.units[0];
    // Earliest expiring batch according to FIFO
    const fifoBatch = product.batches[0];

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.unitName === selectedUnit.unitName
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].sellPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          unitName: selectedUnit.unitName,
          conversionFactor: selectedUnit.conversionFactor,
          qty: 1,
          sellPrice: selectedUnit.sellPrice,
          subtotal: selectedUnit.sellPrice,
          selectedBatchNumber: fifoBatch ? fifoBatch.batchNumber : "BATCH-GEN",
          expiredDate: fifoBatch ? fifoBatch.expiredDate : "2027-12-31",
          isCompounding: saleType === "COMPOUNDING",
        },
      ]);
    }
  };

  const updateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    updated[index].qty = newQty;
    updated[index].subtotal = newQty * updated[index].sellPrice;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Subtotal calculations
  const itemsSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalFees = saleType === "COMPOUNDING" ? compoundingFee + embalaseFee : 0;
  const grossTotal = itemsSubtotal + totalFees;

  // Member discount
  const discountPct = selectedCustomer ? selectedCustomer.discountPct : 0;
  const discountAmount = Math.round(grossTotal * (discountPct / 100));
  const finalTotal = Math.max(0, grossTotal - discountAmount);

  // Helper template note per payment method
  const getDefaultNote = (method: "CASH" | "QRIS" | "TF" | "DEBIT" | "SPLIT" | "CREDIT", bank = "BCA") => {
    switch (method) {
      case "CASH":
        return "Tunai (Cash)";
      case "QRIS":
        return "QRIS Dinamis Apotik";
      case "TF":
        return `Transfer Bank ${bank}`;
      case "DEBIT":
        return "Debit / Mesin EDC";
      case "SPLIT":
        return "Split Tunai & Non-Tunai";
      case "CREDIT":
        return "Hutang Pasien (Tempo 30 Hari)";
      default:
        return "";
    }
  };

  const handleSelectPaymentMethod = (method: "CASH" | "QRIS" | "TF" | "DEBIT" | "SPLIT" | "CREDIT") => {
    setPaymentMethod(method);
    setPaymentNote(getDefaultNote(method, selectedBank));
    if (method !== "CASH") {
      setCashGiven(finalTotal);
    }
  };

  const handleBarcodeSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0], 0);
        setSearchQuery("");
      }
    }
  };

  // =========================================================================
  // Perhitungan Kasir: Cust Bayar, Kembalian, dan Pembulatan (+Rp 500 keatas)
  // Aturan: Pembulatan ke atas per Rp 500 untuk kembalian kasir (Cash), KECUALI QRIS & Non-Tunai.
  // =========================================================================
  const isCash = paymentMethod === "CASH";
  const rawChange = isCash ? Math.max(0, cashGiven - finalTotal) : 0;
  // Pembulatan ke atas per Rp 500 untuk kembalian cash jika rawChange > 0
  const finalChange = isCash && rawChange > 0 ? Math.ceil(rawChange / 500) * 500 : 0;
  const roundingAmount = isCash && rawChange > 0 ? finalChange - rawChange : 0;
  const effectiveCashGiven = isCash ? cashGiven : finalTotal;
  const isCashSufficient = !isCash || cashGiven >= finalTotal;
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || null;

  const handleFinishPayment = async () => {
    setIsProcessing(true);
    const saleNumber = `SL-${activeBusiness?.type === "PHARMACY" ? "TS" : "ML"}-${Date.now().toString().slice(-6)}`;
    const effectiveNote = paymentNote || getDefaultNote(paymentMethod, selectedBank);
    const saleRecord = {
      saleNumber,
      date: new Date(),
      saleType,
      items: cart,
      customer: selectedCustomer,
      doctor: selectedDoctor,
      subtotal: itemsSubtotal,
      compoundingFee: saleType === "COMPOUNDING" ? compoundingFee : 0,
      embalaseFee: saleType === "COMPOUNDING" ? embalaseFee : 0,
      discountAmount,
      totalAmount: finalTotal,
      paymentMethod,
      paymentNote: effectiveNote,
      cashGiven: effectiveCashGiven,
      rawChange,
      roundingAmount,
      change: finalChange,
      cashier: ACTIVE_SHIFT.cashierName,
      businessName: activeBusiness?.name || "Apotik Tamansari",
    };

    try {
      await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: activeBusiness?.id || "biz-apotik-tamansari",
          saleType,
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            unitName: i.unitName,
            qty: i.qty,
            sellPrice: i.sellPrice,
            selectedBatchNumber: i.selectedBatchNumber,
          })),
          subtotal: itemsSubtotal,
          compoundingFee: saleType === "COMPOUNDING" ? compoundingFee : 0,
          embalaseFee: saleType === "COMPOUNDING" ? embalaseFee : 0,
          discountAmount,
          paymentMethod,
          paymentNote: effectiveNote,
          cashGiven: effectiveCashGiven,
          roundingAmount,
          change: finalChange,
          userId: "user-kasir-siti",
        }),
      });
    } catch (err) {
      console.warn("Checkout completed in local mode:", err);
    } finally {
      setIsProcessing(false);
      setCompletedSale(saleRecord);
      setIsReceiptOpen(true);
      setCart([]);
      setCashGiven(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Kasir Point of Sale (POS)
            </h1>
            {isOwner && (
              <Badge
                variant={isOwnerMode ? "success" : "outline"}
                className="cursor-pointer gap-1 py-0.5 px-2 text-[10px] font-bold select-none transition-all"
                onClick={() => setIsOwnerMode(!isOwnerMode)}
                title="Klik untuk beralih mode Owner / Kasir"
              >
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                {isOwnerMode ? "Mode Owner: Hak Akses Penuh (Edit & Input Aktif)" : "Mode Kasir Standar"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift: {ACTIVE_SHIFT.shiftNumber} &bull; Kasir: {ACTIVE_SHIFT.cashierName} &bull; Bisnis:{" "}
            <strong>{activeBusiness?.name || "Apotik Tamansari"}</strong>
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSaleType("GENERAL")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              saleType === "GENERAL" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
            }`}
          >
            Obat Bebas (OTC)
          </button>
          <button
            onClick={() => setSaleType("PRESCRIPTION")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              saleType === "PRESCRIPTION" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
            }`}
          >
            Resep Dokter
          </button>
          <button
            onClick={() => setSaleType("COMPOUNDING")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              saleType === "COMPOUNDING" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
            }`}
          >
            Obat Racikan
          </button>
        </div>
      </div>

      {/* ALFAMART STYLE DIGITAL REGISTER DISPLAY MONITOR (TAMPILAN MONITOR KASIR RITEL) */}
      <div className="bg-slate-950 border-2 border-slate-800 text-white rounded-xl p-3 sm:p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Status Counter */}
          <div className="md:col-span-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  REGISTER AKTIF
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {cart.length} Item ({cart.reduce((s, it) => s + it.qty, 0)} Pcs)
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-1 truncate">
                {selectedCustomer ? `Pelanggan: ${selectedCustomer.name} (${selectedCustomer.tier})` : "Pelanggan: Umum (Non-Member)"}
              </p>
            </div>
          </div>

          {/* Cust Bayar Display */}
          <div className="md:col-span-2 text-left md:text-right bg-slate-900/60 rounded-lg p-2 border border-slate-800">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              UANG DITERIMA
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-sky-400">
              {formatRupiah(isCash ? cashGiven : finalTotal)}
            </span>
          </div>

          {/* Kembalian Display */}
          <div className="md:col-span-3 text-left md:text-right bg-slate-900/60 rounded-lg p-2 border border-slate-800">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
              KEMBALIAN (BULAT +500)
            </span>
            <span className={`text-lg sm:text-xl font-mono font-black ${isCash && finalChange > 0 ? "text-amber-400" : "text-slate-500"}`}>
              {formatRupiah(isCash ? finalChange : 0)}
            </span>
          </div>

          {/* Total Tagihan LED Display (Alfamart Big Green LED) */}
          <div className="md:col-span-3 bg-emerald-950/90 border-2 border-emerald-500/60 rounded-lg px-3 py-1.5 text-right shadow-inner">
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-300 block font-bold">
              TOTAL TAGIHAN
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-tight">
              {formatRupiah(finalTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN GRID: LEFT (SALES ITEMIZATION & CATALOG), RIGHT (IN-SCREEN PAYMENT PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: 7 COLS (Sales Transaction Table + Drug Quick Catalog) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Prescription specifics */}
          {saleType === "PRESCRIPTION" && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-emerald-900 block">
                      Dokter Penulis Resep:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddDoctor()}
                      className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Tambah Dokter
                    </button>
                  </div>
                  <SearchableCombobox
                    iconType="doctor"
                    placeholder="-- Pilih atau cari dokter penulis --"
                    searchPlaceholder="Cari nama dokter, klinik, atau SIP..."
                    emptyText="Dokter belum terdaftar di sistem"
                    addNewButtonText="Tambah Dokter Baru"
                    onAddNew={(searchVal) => handleOpenAddDoctor(searchVal)}
                    value={selectedDoctorId}
                    onChange={(val) => setSelectedDoctorId(val)}
                    allowClear
                    clearLabel="-- Batal Pilih Dokter --"
                    options={doctors.map((doc) => ({
                      value: doc.id,
                      label: doc.name,
                      description: `${doc.clinic} • SIP: ${doc.sip}`,
                    }))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                    Nomor Resep Dokter:
                  </label>
                  <Input
                    placeholder="Contoh: R/2026/11/045"
                    value={prescriptionNumber}
                    onChange={(e) => setPrescriptionNumber(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {saleType === "COMPOUNDING" && (
            <Card className="border-teal-200 bg-teal-50/50">
              <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-teal-900 block mb-1">
                    Nama Formula Racikan:
                  </label>
                  <Input
                    value={compoundingName}
                    onChange={(e) => setCompoundingName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-teal-900 block mb-1">
                    Tuslah / Jasa Racik (Rp):
                  </label>
                  <Input
                    type="number"
                    value={compoundingFee}
                    onChange={(e) => setCompoundingFee(Number(e.target.value))}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-teal-900 block mb-1">
                    Embalase / Pot Kapsul (Rp):
                  </label>
                  <Input
                    type="number"
                    value={embalaseFee}
                    onChange={(e) => setEmbalaseFee(Number(e.target.value))}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Barcode Scanner & Search Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Scan barcode [Enter] atau ketik nama obat / zat aktif..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeSearchKeyDown}
                className="pl-9 bg-white h-10 text-sm font-medium"
                autoFocus
              />
            </div>
            {isOwnerMode && (
              <Button
                type="button"
                onClick={handleOpenAddDrugModal}
                className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
                title="Owner: Tambah Obat Baru Langsung dari Layar POS"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">+ Input Obat Baru</span>
                <span className="sm:hidden">+ Obat Baru</span>
              </Button>
            )}
          </div>

          {/* TABEL RINCIAN BELANJA KASIR (Alfamart Sales Itemization Table) */}
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="py-2.5 px-3 bg-slate-50 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                  Rincian Penjualan (Sales Items) &bull; {cart.length} Item
                </CardTitle>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setCashGiven(0);
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Kosongkan Tabel
                </button>
              )}
            </CardHeader>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <th className="py-2 px-3">Nama Barang / Obat</th>
                    <th className="py-2 px-2 text-center">Satuan</th>
                    <th className="py-2 px-3 text-right">Harga</th>
                    <th className="py-2 px-3 text-center w-28">Qty</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                    <th className="py-2 px-2 text-center w-8">Batal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                        <ShoppingBag className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700 text-xs">Belum ada item belanja di-scan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Scan barcode atau klik pilihan obat pada katalog cepat di bawah untuk menambahkan item
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-800 font-sans">{item.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <span>Batch: {item.selectedBatchNumber}</span>
                            <span>&bull;</span>
                            <span>Exp: {item.expiredDate?.slice(0, 10)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium text-slate-600 font-sans">{item.unitName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(item.sellPrice)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1 bg-slate-50 border rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.qty - 1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-slate-800 text-xs font-sans">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.qty + 1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatRupiah(item.subtotal)}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotal Footer Bar */}
            {cart.length > 0 && (
              <div className="bg-slate-50 px-4 py-2 border-t flex flex-wrap justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">
                  Total Fisik: <strong>{cart.reduce((s, it) => s + it.qty, 0)} Pcs</strong> ({cart.length} Baris Obat)
                </span>
                <span className="font-bold text-slate-800">
                  Subtotal: <strong className="text-emerald-700">{formatRupiah(itemsSubtotal)}</strong>
                </span>
              </div>
            )}
          </Card>

          {/* KATALOG CEPAT OBAT (Quick Drug Catalog Grid) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-emerald-600" />
                Pilihan Cepat Obat / Katalog Fisik
              </span>
              <span className="text-[10px] text-slate-400">
                Klik satuan obat untuk langsung masuk ke tabel sales
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const fifoBatch = product.batches[0];
                return (
                  <div
                    key={product.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {product.barcode}
                        </span>
                        <div className="flex items-center gap-1">
                          {product.isConsignment && (
                            <Badge variant="purple" className="text-[9px]">
                              Konsinyasi
                            </Badge>
                          )}
                          {isOwnerMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDrugModal(product);
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 flex items-center gap-1 transition-colors"
                              title="Owner: Edit Nama, Stok, Harga & Info Obat"
                            >
                              <Pencil className="h-2.5 w-2.5 text-amber-600" />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-xs text-slate-800 mt-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 italic">
                        {product.genericName || product.category}
                      </p>

                      {/* Stock & FIFO Batch Tag */}
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        <span className="text-slate-600">
                          Stok Total:{" "}
                          <strong className={product.totalStock <= product.minStock ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                            {product.totalStock} {product.baseUnit}
                          </strong>
                        </span>
                        {isOwnerMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDrugModal(product);
                            }}
                            className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5 font-medium"
                            title="Klik untuk ubah stok langsung"
                          >
                            <Boxes className="h-3 w-3 text-amber-600" /> Ubah Stok
                          </button>
                        )}
                      </div>

                      {fifoBatch && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="font-mono">FIFO: {fifoBatch.batchNumber}</span>
                          <span>(Sisa: {fifoBatch.quantity} {product.baseUnit})</span>
                        </div>
                      )}
                    </div>

                    {/* Units conversion buttons */}
                    <div className="mt-2.5 pt-2 border-t flex flex-wrap gap-1.5">
                      {product.units.map((unit, uIdx) => (
                        <button
                          key={unit.id}
                          onClick={() => addToCart(product, uIdx)}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex justify-between items-center"
                        >
                          <span>{unit.unitName}</span>
                          <span className="font-bold">{formatRupiah(unit.sellPrice)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 COLS (PANEL PEMBAYARAN LANGSUNG — TANPA POPUP!) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Member / Pelanggan CRM */}
          <Card className="border-slate-200 bg-white shadow-2xs">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  Pelanggan / Member Apotek
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedCustomer && (
                    <Badge variant="success" className="text-[10px]">
                      Diskon {selectedCustomer.discountPct}% ({selectedCustomer.tier})
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAddCustomer()}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>
              </div>

              <SearchableCombobox
                iconType="user"
                placeholder="Pilih atau cari nama / no HP pelanggan..."
                searchPlaceholder="Cari nama, no HP, atau kode member..."
                emptyText="Pelanggan belum terdaftar di sistem"
                addNewButtonText="Tambah Pelanggan Baru"
                onAddNew={(searchVal) => handleOpenAddCustomer(searchVal)}
                value={selectedCustomer ? selectedCustomer.id : ""}
                onChange={(val) => {
                  const cust = customers.find((c) => c.id === val) || null;
                  setSelectedCustomer(cust);
                }}
                options={[
                  {
                    value: "",
                    label: "Umum (Non-Member)",
                    description: "Pelanggan umum tanpa kartu member",
                  },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    description: `HP: ${c.phone} • Diskon ${c.discountPct}% (${c.points} Poin)`,
                    badge: c.tier,
                    badgeColor:
                      c.tier === "PLATINUM"
                        ? "bg-purple-100 text-purple-800"
                        : c.tier === "GOLD"
                        ? "bg-amber-100 text-amber-800"
                        : c.tier === "SILVER"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-emerald-100 text-emerald-800",
                  })),
                ]}
              />
            </CardContent>
          </Card>

          {/* PANEL KASIR UTAMA: RINCIAN TAGIHAN & PEMBAYARAN LANGSUNG */}
          <Card className="border-slate-300 bg-white shadow-sm overflow-hidden">
            {/* Header Tagihan */}
            <div className="bg-emerald-900 text-white p-3.5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-300 block font-bold">
                  TOTAL YANG HARUS DIBAYAR
                </span>
                <span className="text-xs text-emerald-100">
                  {cart.length} Item Barang &bull; {cart.reduce((s, it) => s + it.qty, 0)} Pcs
                </span>
              </div>
              <span className="text-2xl font-mono font-black text-white">
                {formatRupiah(finalTotal)}
              </span>
            </div>

            <CardContent className="p-3.5 space-y-3.5">
              {/* Rincian Komponen Tagihan */}
              <div className="space-y-1 text-xs text-slate-600 pb-2 border-b">
                <div className="flex justify-between">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono">{formatRupiah(itemsSubtotal)}</span>
                </div>
                {saleType === "COMPOUNDING" && (
                  <>
                    <div className="flex justify-between">
                      <span>Jasa Racik / Tuslah:</span>
                      <span className="font-mono">{formatRupiah(compoundingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Embalase:</span>
                      <span className="font-mono">{formatRupiah(embalaseFee)}</span>
                    </div>
                  </>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Member ({discountPct}%):</span>
                    <span className="font-mono">-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Pilihan Metode Bayar Langsung */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: "CASH", label: "Tunai", icon: Banknote },
                    { id: "QRIS", label: "QRIS", icon: QrCode },
                    { id: "TF", label: "Transfer", icon: Building2 },
                    { id: "DEBIT", label: "Debit/EDC", icon: CreditCard },
                    { id: "CREDIT", label: "Hutang", icon: Clock },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectPaymentMethod(m.id as any)}
                        className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500 shadow-2xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-0.5" />
                        <span className="text-[10px] leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Pembayaran Aktif Langsung */}
              {paymentMethod === "CASH" && (
                <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-800">
                        Cust Bayar (Uang Diterima dari Pasien):
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Tagihan: {formatRupiah(finalTotal)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={cashGiven || ""}
                        onChange={(e) => setCashGiven(Number(e.target.value))}
                        placeholder="Ketik uang diterima..."
                        className="pl-10 text-lg font-black h-11 bg-white text-slate-900 border-slate-300 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Tombol Cepat Nominal */}
                  <div>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Pilihan Cepat Uang Pas & Pecahan:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setCashGiven(finalTotal)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                          cashGiven === finalTotal
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        Uang Pas ({formatRupiah(finalTotal)})
                      </button>
                      {[10000, 20000, 50000, 100000, 200000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCashGiven(preset)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                            cashGiven === preset
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                              : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500"
                          }`}
                        >
                          {formatRupiah(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rincian Kembalian & Rounding (+Rp 500 keatas) */}
                  <div className="rounded-lg bg-white border border-slate-200 p-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Kembalian Asli (Mentah):</span>
                      <span className="font-mono font-medium">
                        {rawChange > 0 ? formatRupiah(rawChange) : "Rp 0"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        Pembulatan (+Rp 500 keatas):
                      </span>
                      <span className={`font-mono font-bold ${roundingAmount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {roundingAmount > 0 ? `+${formatRupiah(roundingAmount)}` : "Rp 0"}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          Kembalian Diserahkan:
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {finalChange > 0 ? "(Sudah dibulatkan per Rp 500 keatas)" : "(Uang Pas / Kembalian Rp 0)"}
                        </span>
                      </div>
                      <span
                        className={`text-xl font-black font-mono ${
                          !isCashSufficient
                            ? "text-rose-600"
                            : finalChange > 0
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        {formatRupiah(finalChange)}
                      </span>
                    </div>

                    {!isCashSufficient && (
                      <div className="bg-rose-50 border border-rose-200 rounded p-1 text-[11px] text-rose-700 font-semibold text-center">
                        Uang diterima masih kurang {formatRupiah(finalTotal - cashGiven)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "QRIS" && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-sky-800 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-sky-600" />
                    <span>Kecuali QRIS: Bayar Pas. Tanpa Pembulatan & Kembalian Rp 0.</span>
                  </div>
                  <div className="w-24 h-24 mx-auto bg-white p-1 rounded-lg border flex items-center justify-center">
                    <QrCode className="h-20 w-20 text-slate-800" />
                  </div>
                  <p className="font-bold text-xs text-slate-800">
                    Scan QRIS: {formatRupiah(finalTotal)}
                  </p>
                </div>
              )}

              {paymentMethod === "TF" && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                    <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Transfer Bank: Bayar Pas Sesuai Tagihan.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { bank: "BCA", acc: "139-088-2190" },
                      { bank: "Mandiri", acc: "131-001-9283" },
                      { bank: "BRI", acc: "0021-01-09827" },
                    ].map((b) => (
                      <button
                        key={b.bank}
                        type="button"
                        onClick={() => {
                          setSelectedBank(b.bank);
                          setPaymentNote(`Transfer ${b.bank}`);
                        }}
                        className={`p-1.5 rounded border text-left ${
                          selectedBank === b.bank ? "bg-blue-100 border-blue-500 font-bold" : "bg-white border-slate-200"
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-800">{b.bank}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{b.acc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note / Catatan Pembayaran Langsung */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="h-3 w-3 text-slate-400" />
                    Note / Catatan Pembayaran ({paymentMethod}):
                  </label>
                  <span className="text-[9px] text-slate-400">Tercetak di struk</span>
                </div>
                <Input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Contoh: Uang Pas / QRIS BCA #124..."
                  className="bg-white h-8 text-xs"
                />
              </div>

              {/* TOMBOL AKSI UTAMA: SELESAI & CETAK STRUK LANGSUNG */}
              <Button
                type="button"
                onClick={handleFinishPayment}
                disabled={isProcessing || cart.length === 0 || !isCashSufficient}
                className="w-full h-12 text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses & Mencetak Struk...
                  </>
                ) : cart.length === 0 ? (
                  "Keranjang Belanja Masih Kosong"
                ) : !isCashSufficient ? (
                  `Uang Kurang ${formatRupiah(finalTotal - cashGiven)}`
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Selesaikan & Cetak Struk ({formatRupiah(finalTotal)})
                  </>
                )}
              </Button>

              {/* Banner Transaksi Terakhir (Jika Baru Selesai) */}
              {completedSale && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-800 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Transaksi Terakhir Berhasil!
                    </span>
                    <span className="font-mono text-[11px]">{completedSale.saleNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[11px]">
                    <span>Total: {formatRupiah(completedSale.totalAmount)}</span>
                    <span>Kembalian: <strong className="text-emerald-700">{formatRupiah(completedSale.change)}</strong></span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReceipt()}
                      className="h-8 text-[11px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50"
                    >
                      <Printer className="w-3 h-3 mr-1" />
                      Cetak Struk Thermal
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompletedSale(null);
                        setCashGiven(0);
                      }}
                      className="h-8 text-[11px] font-bold border-slate-300 text-slate-700 bg-white"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Transaksi Baru
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RECEIPT MODAL & WHATSAPP SHARE */}
      {completedSale && (
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent onClose={() => setIsReceiptOpen(false)} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Transaksi Berhasil Selesai!
              </DialogTitle>
              <DialogDescription>
                Struk digital siap dicetak atau dikirim via WhatsApp ke pelanggan
              </DialogDescription>
            </DialogHeader>

            {/* Printable Digital Receipt Mockup */}
            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl font-mono text-xs space-y-2 text-slate-800">
              <div className="text-center border-b pb-2">
                <p className="font-bold text-sm uppercase">{completedSale.businessName || "APOTIK TAMANSARI"}</p>
                <p className="text-[10px] text-slate-500">Jl. Tamansari No. 45, Bandung &bull; 022-2501234</p>
                <p className="text-[10px] text-slate-500">SIPA: 19850412/SIPA-32.73/2022</p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <span>No: {completedSale.saleNumber}</span>
                <span>{new Date().toLocaleTimeString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Kasir: {completedSale.cashier}</span>
                <span>{completedSale.customer?.name || "Pelanggan Umum"}</span>
              </div>
              {completedSale.doctor && (
                <div className="text-[10px] text-slate-500">
                  Dokter: {completedSale.doctor.name}
                </div>
              )}

              <div className="border-t border-b py-2 space-y-1">
                {completedSale.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {it.qty} {it.unitName} x {formatRupiah(it.sellPrice)}
                      </p>
                    </div>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}

                {completedSale.compoundingFee > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Jasa Racik / Tuslah</span>
                    <span>{formatRupiah(completedSale.compoundingFee)}</span>
                  </div>
                )}
                {completedSale.embalaseFee > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Embalase / Pot</span>
                    <span>{formatRupiah(completedSale.embalaseFee)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon Member:</span>
                    <span>-{formatRupiah(completedSale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Metode Bayar:</span>
                  <span className="font-semibold">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentNote && (
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Note / Keterangan:</span>
                    <span className="italic">{completedSale.paymentNote}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700">
                  <span>Cust Bayar:</span>
                  <span className="font-semibold">{formatRupiah(completedSale.cashGiven)}</span>
                </div>

                {completedSale.paymentMethod === "CASH" && (
                  <>
                    {completedSale.roundingAmount > 0 && (
                      <div className="flex justify-between text-amber-700 text-[10px]">
                        <span>Pembulatan (+Rp 500 keatas):</span>
                        <span>+{formatRupiah(completedSale.roundingAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-xs pt-0.5">
                      <span>Kembalian:</span>
                      <span className="text-emerald-700">{formatRupiah(completedSale.change)}</span>
                    </div>
                  </>
                )}

                {completedSale.paymentMethod === "QRIS" && (
                  <div className="flex justify-between text-sky-700 text-[10px]">
                    <span>Status:</span>
                    <span className="font-semibold">QRIS Pas (Tanpa Kembalian)</span>
                  </div>
                )}

                {completedSale.paymentMethod === "TF" && (
                  <div className="flex justify-between text-blue-700 text-[10px]">
                    <span>Status:</span>
                    <span className="font-semibold">Transfer Pas (Tanpa Kembalian)</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 border-t">
                Semoga Cepat Sembuh &bull; Terima Kasih
              </div>
            </div>

            {/* Pilihan Lebar Kertas Thermal (58mm vs 80mm) */}
            <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Format Ukuran Kertas:
              </span>
              <div className="flex gap-1.5">
                {(["58mm", "80mm"] as ThermalPaperWidth[]).map((width) => (
                  <button
                    key={width}
                    type="button"
                    onClick={() => setThermalPaperWidth(width)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      thermalPaperWidth === width
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {width === "58mm" ? "58mm (Mini)" : "80mm (Desktop)"}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row pt-1">
              <Button
                type="button"
                className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-black text-white font-bold flex items-center justify-center gap-1.5 shadow-sm"
                onClick={() => handlePrintReceipt(thermalPaperWidth)}
              >
                <Printer className="h-4 w-4" />
                Cetak Struk Thermal ({thermalPaperWidth})
              </Button>
              <Button
                className="w-full sm:w-auto text-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={() => {
                  const phone = completedSale.customer?.phone || "";
                  const waText = encodeURIComponent(
                    `*STRUK PEMBELIAN ${completedSale.businessName || "APOTIK TAMANSARI"}*\n` +
                    `No: ${completedSale.saleNumber}\n` +
                    `Tanggal: ${new Date(completedSale.date).toLocaleString("id-ID")}\n` +
                    `Kasir: ${completedSale.cashier}\n` +
                    (completedSale.customer?.name ? `Pelanggan: ${completedSale.customer.name}\n` : "") +
                    (completedSale.doctor?.name ? `Dokter: ${completedSale.doctor.name}\n` : "") +
                    `--------------------------------\n` +
                    completedSale.items.map((it: any) => `${it.name} (${it.qty} ${it.unitName}) = Rp ${it.subtotal.toLocaleString("id-ID")}`).join("\n") +
                    `\n--------------------------------\n` +
                    `*TOTAL: Rp ${completedSale.totalAmount.toLocaleString("id-ID")}*\n` +
                    `Metode Bayar: ${completedSale.paymentMethod} (${completedSale.paymentNote || "-"})\n` +
                    `Cust Bayar: Rp ${completedSale.cashGiven.toLocaleString("id-ID")}\n` +
                    (completedSale.paymentMethod === "CASH" && completedSale.roundingAmount > 0
                      ? `Pembulatan Kembalian (+Rp 500): +Rp ${completedSale.roundingAmount.toLocaleString("id-ID")}\n`
                      : "") +
                    (completedSale.paymentMethod === "CASH"
                      ? `*Kembalian: Rp ${completedSale.change.toLocaleString("id-ID")}*\n`
                      : `*Status: Lunas Pas (Tanpa Kembalian)*\n`) +
                    `--------------------------------\n` +
                    `Terima kasih telah berbelanja!`
                  );
                  if (phone) {
                    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${waText}`, "_blank");
                  } else {
                    navigator.clipboard?.writeText(decodeURIComponent(waText));
                    alert("Rincian struk WhatsApp disalin ke clipboard! Silakan kirimkan ke chat pelanggan.");
                  }
                  setIsReceiptOpen(false);
                }}
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                Kirim Struk WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: TAMBAH PELANGGAN / MEMBER BARU LANGSUNG DI POS */}
      <Dialog open={isAddCustModalOpen} onOpenChange={setIsAddCustModalOpen}>
        <DialogContent onClose={() => setIsAddCustModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Tambah Pelanggan / Member Baru
            </DialogTitle>
            <DialogDescription>
              Daftarkan pelanggan baru langsung di POS. Nama akan otomatis tersimpan dan tersedia untuk transaksi berikutnya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewCustomer} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Lengkap Pelanggan *
              </label>
              <Input
                required
                placeholder="Contoh: Ibu Rina Marlina"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp / HP
              </label>
              <Input
                placeholder="Contoh: 0812-3456-7890"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tier Member & Diskon
              </label>
              <select
                value={newCustTier}
                onChange={(e) => setNewCustTier(e.target.value as any)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="REGULAR">REGULAR (Diskon 0%)</option>
                <option value="SILVER">SILVER (Diskon 3%)</option>
                <option value="GOLD">GOLD (Diskon 5%)</option>
                <option value="PLATINUM">PLATINUM (Diskon 7%)</option>
              </select>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCustModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Simpan & Pilih di Kasir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: TAMBAH DOKTER PENULIS RESEP BARU LANGSUNG DI POS */}
      <Dialog open={isAddDocModalOpen} onOpenChange={setIsAddDocModalOpen}>
        <DialogContent onClose={() => setIsAddDocModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              Tambah Dokter Penulis Resep
            </DialogTitle>
            <DialogDescription>
              Tambahkan dokter baru langsung saat transaksi resep. Dokter akan otomatis tersimpan di sistem apotik.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewDoctor} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Lengkap Dokter & Gelar *
              </label>
              <Input
                required
                placeholder="Contoh: dr. Andi Pratama, Sp.A"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Klinik / Rumah Sakit / Tempat Praktek
              </label>
              <Input
                placeholder="Contoh: RSUD Tamansari / Praktek Mandiri"
                value={newDocClinic}
                onChange={(e) => setNewDocClinic(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Surat Izin Praktik (SIP)
              </label>
              <Input
                placeholder="Contoh: 503/445/SIP-Dokter/2026"
                value={newDocSip}
                onChange={(e) => setNewDocSip(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddDocModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Simpan & Pilih Dokter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT DATA OBAT LANGSUNG DI POS OLEH OWNER */}
      {editingDrug && (
        <Dialog open={isEditDrugModalOpen} onOpenChange={setIsEditDrugModalOpen}>
          <DialogContent onClose={() => setIsEditDrugModalOpen(false)} className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-amber-800">
                  <Pencil className="w-5 h-5 text-amber-600" />
                  Edit Data Obat Langsung (Owner POS)
                </DialogTitle>
                <Badge variant="warning" className="text-[10px] font-bold">
                  Mode Owner &bull; Audit Trail Aktif
                </Badge>
              </div>
              <DialogDescription>
                Ubah informasi nama, stok fisik, barcode, serta harga jual/beli satuan obat ini secara langsung dari kasir.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEditDrug} className="space-y-4 text-xs">
              {/* Info Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">
                    Nama Obat & Sediaan *
                  </label>
                  <Input
                    required
                    value={editDrugForm.name}
                    onChange={(e) => setEditDrugForm({ ...editDrugForm, name: e.target.value })}
                    className="h-9 bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Generik / Zat Aktif
                  </label>
                  <Input
                    value={editDrugForm.genericName}
                    onChange={(e) => setEditDrugForm({ ...editDrugForm, genericName: e.target.value })}
                    className="h-8 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kategori Obat
                  </label>
                  <SearchableCombobox
                    placeholder="Pilih kategori..."
                    searchPlaceholder="Cari kategori..."
                    addNewButtonText="Tambah Kategori"
                    onAddNew={(cat) => {
                      addCategory(cat);
                      setEditDrugForm({ ...editDrugForm, category: cat });
                    }}
                    value={editDrugForm.category}
                    onChange={(cat) => setEditDrugForm({ ...editDrugForm, category: cat })}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Barcode / No. Registrasi
                  </label>
                  <Input
                    value={editDrugForm.barcode}
                    onChange={(e) => setEditDrugForm({ ...editDrugForm, barcode: e.target.value })}
                    className="h-8 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Satuan Terkecil (Base Unit)
                  </label>
                  <Input
                    value={editDrugForm.baseUnit}
                    onChange={(e) => setEditDrugForm({ ...editDrugForm, baseUnit: e.target.value })}
                    className="h-8 bg-white"
                  />
                </div>
              </div>

              {/* Penyesuaian Stok Langsung */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Boxes className="h-4 w-4 text-amber-700" />
                    Penyesuaian Stok Fisik Obat:
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Stok Saat Ini: <strong>{editingDrug.totalStock} {editingDrug.baseUnit}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                      Jumlah Stok Total Baru ({editingDrug.baseUnit}):
                    </label>
                    <Input
                      type="number"
                      value={editDrugForm.totalStock}
                      onChange={(e) => setEditDrugForm({ ...editDrugForm, totalStock: Number(e.target.value) })}
                      className="h-9 bg-white font-bold text-base border-amber-300 focus:border-amber-500"
                    />
                    {editDrugForm.totalStock !== editingDrug.totalStock && (
                      <span className="text-[10px] font-semibold mt-1 block text-amber-700">
                        Selisih: {editDrugForm.totalStock - editingDrug.totalStock > 0 ? `+${editDrugForm.totalStock - editingDrug.totalStock}` : editDrugForm.totalStock - editingDrug.totalStock} {editingDrug.baseUnit}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                      Alasan Penyesuaian Stok (Audit Trail):
                    </label>
                    <Input
                      value={editDrugForm.stockAdjustmentReason}
                      onChange={(e) => setEditDrugForm({ ...editDrugForm, stockAdjustmentReason: e.target.value })}
                      placeholder="Contoh: Stok opname fisik kasir / penyesuaian"
                      className="h-9 bg-white text-xs border-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* Harga Jual & Beli Multi-Satuan */}
              <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Harga Beli (HPP) & Harga Jual Satuan:
                </span>

                <div className="space-y-2">
                  {editDrugForm.units.map((unit, idx) => (
                    <div
                      key={unit.id || idx}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 grid grid-cols-3 gap-2 items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          {unit.unitName} {unit.conversionFactor > 1 && `(Isi ${unit.conversionFactor})`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {unit.isBaseUnit ? "Satuan Dasar" : "Satuan Tingkat"}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">Harga Beli (Rp):</label>
                        <Input
                          type="number"
                          value={unit.buyPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedUnits = [...editDrugForm.units];
                            updatedUnits[idx].buyPrice = val;
                            setEditDrugForm({ ...editDrugForm, units: updatedUnits });
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-emerald-700 font-bold block">Harga Jual (Rp):</label>
                        <Input
                          type="number"
                          value={unit.sellPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedUnits = [...editDrugForm.units];
                            updatedUnits[idx].sellPrice = val;
                            setEditDrugForm({ ...editDrugForm, units: updatedUnits });
                          }}
                          className="h-8 text-xs font-bold text-emerald-800 border-emerald-300 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDrugModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Simpan Perubahan Obat
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: INPUT OBAT BARU LANGSUNG DI POS (OWNER) */}
      <Dialog open={isAddDrugModalOpen} onOpenChange={setIsAddDrugModalOpen}>
        <DialogContent onClose={() => setIsAddDrugModalOpen(false)} className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-emerald-800">
                <PackagePlus className="w-5 h-5 text-emerald-600" />
                Input Obat Baru Langsung di POS (Owner)
              </DialogTitle>
              <Badge variant="success" className="text-[10px] font-bold">
                Owner Direct Input
              </Badge>
            </div>
            <DialogDescription>
              Tambahkan produk obat baru langsung dari layar kasir tanpa perlu keluar ke menu master data.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewDrug} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Obat & Dosis Sediaan *
                </label>
                <Input
                  required
                  placeholder="Contoh: Sanmol Drops 15ml / Amoxicillin 500mg"
                  value={newDrugForm.name}
                  onChange={(e) => setNewDrugForm({ ...newDrugForm, name: e.target.value })}
                  className="h-9 bg-white font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Generik / Zat Aktif
                </label>
                <Input
                  placeholder="Contoh: Paracetamol 100mg/ml"
                  value={newDrugForm.genericName}
                  onChange={(e) => setNewDrugForm({ ...newDrugForm, genericName: e.target.value })}
                  className="h-8 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kategori Obat
                </label>
                <SearchableCombobox
                  placeholder="Pilih atau cari kategori..."
                  searchPlaceholder="Cari kategori obat..."
                  addNewButtonText="Tambah Kategori"
                  onAddNew={(cat) => {
                    addCategory(cat);
                    setNewDrugForm({ ...newDrugForm, category: cat });
                  }}
                  value={newDrugForm.category}
                  onChange={(cat) => setNewDrugForm({ ...newDrugForm, category: cat })}
                  options={categories.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Barcode / No. Registrasi</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewDrugForm({
                        ...newDrugForm,
                        barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
                      })
                    }
                    className="text-[10px] text-emerald-700 hover:underline"
                  >
                    Acak Barcode
                  </button>
                </div>
                <Input
                  value={newDrugForm.barcode}
                  onChange={(e) => setNewDrugForm({ ...newDrugForm, barcode: e.target.value })}
                  className="h-8 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Satuan Dasar (Base Unit) *
                </label>
                <Input
                  required
                  placeholder="Tablet / Kapsul / Botol / Strip / Tube"
                  value={newDrugForm.baseUnit}
                  onChange={(e) => setNewDrugForm({ ...newDrugForm, baseUnit: e.target.value })}
                  className="h-8 bg-white"
                />
              </div>
            </div>

            {/* Stok Awal & Batch */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <span className="font-bold text-emerald-900 block text-xs">
                Stok Awal & Informasi Batch Masuk:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Jumlah Stok Awal ({newDrugForm.baseUnit}):
                  </label>
                  <Input
                    type="number"
                    value={newDrugForm.initialStock}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, initialStock: Number(e.target.value) })}
                    className="h-8 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    No. Batch Masuk:
                  </label>
                  <Input
                    value={newDrugForm.batchNumber}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, batchNumber: e.target.value })}
                    className="h-8 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Tanggal Expired:
                  </label>
                  <Input
                    type="date"
                    value={newDrugForm.expiredDate}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, expiredDate: e.target.value })}
                    className="h-8 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Harga Beli, Margin & Harga Jual Satuan Dasar */}
            <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Penetapan Harga Satuan Dasar ({newDrugForm.baseUnit}):
              </span>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Harga Beli HPP (Rp):</label>
                  <Input
                    type="number"
                    value={newDrugForm.buyPrice}
                    onChange={(e) => {
                      const bp = Number(e.target.value);
                      const sp = Math.round(bp * (1 + newDrugForm.marginPct / 100));
                      setNewDrugForm({ ...newDrugForm, buyPrice: bp, sellPrice: sp });
                    }}
                    className="h-8 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Margin (%):</label>
                  <Input
                    type="number"
                    value={newDrugForm.marginPct}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const sp = Math.round(newDrugForm.buyPrice * (1 + m / 100));
                      setNewDrugForm({ ...newDrugForm, marginPct: m, sellPrice: sp });
                    }}
                    className="h-8 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-700 font-bold block mb-1">Harga Jual (Rp):</label>
                  <Input
                    type="number"
                    value={newDrugForm.sellPrice}
                    onChange={(e) => setNewDrugForm({ ...newDrugForm, sellPrice: Number(e.target.value) })}
                    className="h-8 bg-white font-bold text-emerald-800 border-emerald-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Satuan Bertingkat Opsional */}
            <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={newDrugForm.hasSecondUnit}
                  onChange={(e) => setNewDrugForm({ ...newDrugForm, hasSecondUnit: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Tambahkan Satuan Bertingkat (misal: Strip atau Box)</span>
              </label>

              {newDrugForm.hasSecondUnit && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Nama Satuan Ke-2:</label>
                    <Input
                      placeholder="Strip / Box"
                      value={newDrugForm.secondUnitName}
                      onChange={(e) => setNewDrugForm({ ...newDrugForm, secondUnitName: e.target.value })}
                      className="h-8 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">
                      Isi per Satuan ({newDrugForm.baseUnit}):
                    </label>
                    <Input
                      type="number"
                      value={newDrugForm.secondConversionFactor}
                      onChange={(e) => {
                        const factor = Number(e.target.value);
                        setNewDrugForm({
                          ...newDrugForm,
                          secondConversionFactor: factor,
                          secondSellPrice: newDrugForm.sellPrice * factor,
                        });
                      }}
                      className="h-8 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-700 font-bold block mb-1">
                      Harga Jual Satuan Ke-2 (Rp):
                    </label>
                    <Input
                      type="number"
                      value={newDrugForm.secondSellPrice}
                      onChange={(e) => setNewDrugForm({ ...newDrugForm, secondSellPrice: Number(e.target.value) })}
                      className="h-8 bg-white font-bold text-emerald-800 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Distributor / PBF Pemasok
              </label>
              <Input
                value={newDrugForm.supplierName}
                onChange={(e) => setNewDrugForm({ ...newDrugForm, supplierName: e.target.value })}
                className="h-8 bg-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddDrugModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Simpan & Masukkan ke Katalog POS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
