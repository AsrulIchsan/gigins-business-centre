"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Bell,
  BellOff,
  Volume2,
  Eye,
  X,
} from "lucide-react";
import { useBusinessStore } from "@/lib/business-store";
import { useAuth } from "@/lib/use-auth";
import { useMasterDataStore } from "@/lib/master-data-store";
import {
  INITIAL_PRODUCTS,
  ACTIVE_SHIFT,
  MockProduct,
  MockProductUnit,
  MockCustomer,
  MockBatch,
} from "@/lib/mock-data";
import { formatRupiah, calculateSellPrice } from "@/lib/utils";
import { printThermalReceipt, ThermalPaperWidth } from "@/lib/thermal-printer";
import PosOrderHistory, { UnifiedOrder } from "@/components/pos/pos-order-history";
import {
  playNewOrderChime,
  isAudioNotificationEnabled,
  setAudioNotificationEnabled,
} from "@/lib/audio-notification";
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
  const { user } = useAuth();
  const currentCashierName = user?.name || "Kasir Utama";
  const currentUserId = user?.id || "usr-kasir";
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
    updateProductBatches,
    updateProductPrice,
  } = useMasterDataStore();
  const [saleType, setSaleType] = useState<"GENERAL" | "PRESCRIPTION" | "COMPOUNDING">("GENERAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // POS Navigation: Layar Kasir vs Riwayat Pesanan (POS & Online)
  const [activePosTab, setActivePosTab] = useState<"cashier" | "history">("cashier");
  const [pendingOnlineCount, setPendingOnlineCount] = useState<number>(0);
  const [globalIncomingAlert, setGlobalIncomingAlert] = useState<any | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const knownOnlineIdsRef = useRef<Set<string>>(new Set());
  const isFirstCheckRef = useRef<boolean>(true);

  // Initialize sound settings
  useEffect(() => {
    setSoundEnabled(isAudioNotificationEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioNotificationEnabled(next);
    if (next) {
      playNewOrderChime(0.25);
    }
  };

  // Check URL query parameters (e.g. ?tab=history or ?fromOnlineOrder=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      const fromOrder = urlParams.get("fromOnlineOrder") || urlParams.get("onlineOrderId");
      if (tabParam === "history") {
        setActivePosTab("history");
      }
      if (fromOrder) {
        fetch(`/api/online-orders?orderNumber=${encodeURIComponent(fromOrder)}&_t=${Date.now()}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.order) {
              handleLoadOnlineOrderToCart(d.order);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Real-time polling for incoming online orders & count (runs constantly even on cashier tab)
  useEffect(() => {
    const checkIncomingOnlineOrders = async () => {
      try {
        const slug = activeBusiness?.slug || "apotik-tamansari";
        const res = await fetch(`/api/online-orders?businessSlug=${slug}&_t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const pendings = data.orders.filter((o: any) => o.status === "PENDING");
          setPendingOnlineCount(pendings.length);

          if (!isFirstCheckRef.current) {
            const newArrivals = data.orders.filter(
              (o: any) => !knownOnlineIdsRef.current.has(o.id) && o.status === "PENDING"
            );
            if (newArrivals.length > 0) {
              const newest = newArrivals[0];
              if (soundEnabled) {
                playNewOrderChime(0.4);
              }
              setGlobalIncomingAlert(newest);
            }
          }

          data.orders.forEach((o: any) => knownOnlineIdsRef.current.add(o.id));
          isFirstCheckRef.current = false;
        }
      } catch {}
    };

    checkIncomingOnlineOrders();
    const interval = setInterval(checkIncomingOnlineOrders, 4000);
    return () => clearInterval(interval);
  }, [activeBusiness?.slug, soundEnabled]);

  // Real-time BroadcastChannel & localStorage listener for cross-tab events
  useEffect(() => {
    let newOrderChannel: BroadcastChannel | null = null;
    let orderSyncChannel: BroadcastChannel | null = null;

    try {
      newOrderChannel = new BroadcastChannel("new_online_order");
      newOrderChannel.onmessage = (e) => {
        if (e.data?.order) {
          if (soundEnabled) playNewOrderChime(0.4);
          setGlobalIncomingAlert(e.data.order);
          setPendingOnlineCount((prev) => prev + 1);
        }
      };
    } catch {}

    try {
      orderSyncChannel = new BroadcastChannel("order_status_sync");
      orderSyncChannel.onmessage = () => {
        fetch(`/api/online-orders?businessSlug=${activeBusiness?.slug || "apotik-tamansari"}&_t=${Date.now()}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.orders)) {
              setPendingOnlineCount(d.orders.filter((o: any) => o.status === "PENDING").length);
            }
          })
          .catch(() => {});
      };
    } catch {}

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "last_new_online_order") {
        try {
          const parsed = JSON.parse(e.newValue || "{}");
          if (parsed.order) {
            if (soundEnabled) playNewOrderChime(0.4);
            setGlobalIncomingAlert(parsed.order);
            setPendingOnlineCount((prev) => prev + 1);
          }
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      if (newOrderChannel) newOrderChannel.close();
      if (orderSyncChannel) orderSyncChannel.close();
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [activeBusiness?.slug, soundEnabled]);

  // Load online order into active POS cart
  const handleLoadOnlineOrderToCart = (order: any) => {
    const newCartItems: CartItem[] = [];

    for (const item of order.items || []) {
      const pName = item.productName || item.name || "Obat";
      const matched = (products && products.length > 0 ? products : INITIAL_PRODUCTS).find(
        (p) =>
          p.id === item.productId ||
          p.name.toLowerCase() === pName.toLowerCase() ||
          p.genericName?.toLowerCase() === pName.toLowerCase()
      );

      const fifoBatch = matched?.batches?.[0];
      const pPrice = Number(item.price || item.sellPrice || (matched ? matched.units[0]?.sellPrice : 0) || 5000);
      const pQty = Number(item.qty || item.quantity || 1);

      newCartItems.push({
        productId: matched?.id || item.productId || `prod-online-${Date.now()}`,
        name: pName,
        unitName: item.unitName || matched?.units?.[0]?.unitName || "Pcs",
        conversionFactor: 1,
        qty: pQty,
        sellPrice: pPrice,
        subtotal: pPrice * pQty,
        selectedBatchNumber: fifoBatch?.batchNumber || "BCH-ONLINE",
        expiredDate: fifoBatch?.expiredDate || "2027-12-31",
      });
    }

    setCart(newCartItems);

    if (order.customerName) {
      const existingCust = customers.find(
        (c) =>
          c.name.toLowerCase() === order.customerName.toLowerCase() ||
          (order.phone && c.phone === order.phone)
      );

      if (existingCust) {
        setSelectedCustomer(existingCust);
      } else {
        setSelectedCustomer({
          id: `c-online-${Date.now()}`,
          name: order.customerName,
          phone: order.phone || "-",
          memberCode: "MBR-ONLINE",
          tier: "REGULAR",
          points: 0,
          discountPct: 0,
        });
      }
    }

    setActivePosTab("cashier");
  };

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

  // ─── OWNER & KASIR DRUG EDIT MODAL STATE & HANDLERS ──────────────────────────────
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
    batches: MockBatch[];
  }>({
    name: "",
    genericName: "",
    category: "",
    barcode: "",
    baseUnit: "",
    totalStock: 0,
    stockAdjustmentReason: "Penyesuaian stok & batch fisik kasir",
    units: [],
    batches: [],
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
      stockAdjustmentReason: "Penyesuaian stok fisik & batch kasir langsung",
      units: JSON.parse(JSON.stringify(product.units)),
      batches: JSON.parse(JSON.stringify(product.batches || [])),
    });
    setIsEditDrugModalOpen(true);
  };

  const handleSaveEditDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrug) return;

    // Sort batches FIFO by expiration
    const sortedBatches = [...editDrugForm.batches].sort(
      (a, b) => new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime()
    );
    const computedTotalStock = sortedBatches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

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
      totalStock: computedTotalStock,
      sellPrice: editDrugForm.units[0]?.sellPrice || 0,
      buyPrice: editDrugForm.units[0]?.buyPrice || 0,
    };

    // Update in Zustand store (both product info, units, batches, and totalStock)
    updateProduct(editingDrug.id, {
      name: editDrugForm.name.trim(),
      genericName: editDrugForm.genericName.trim(),
      category: editDrugForm.category.trim(),
      barcode: editDrugForm.barcode.trim(),
      baseUnit: editDrugForm.baseUnit.trim(),
      totalStock: computedTotalStock,
      units: editDrugForm.units,
      batches: sortedBatches,
    });

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
    alert(`Data obat "${editDrugForm.name}" (Stok: ${computedTotalStock} ${editDrugForm.baseUnit}, ${sortedBatches.length} Batch) berhasil diperbarui!`);
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
  const netBeforeRounding = Math.max(0, grossTotal - discountAmount);

  // =========================================================================
  // Perhitungan Kasir: Cust Bayar, Kembalian, dan Pembulatan (+Rp 500 keatas)
  // Aturan Retail Apotek: Untuk transaksi TUNAI (CASH), jika nominal ganjil
  // (bukan kelipatan 500), dibulatkan KE ATAS ke kelipatan Rp 500 terdekat.
  // Contoh:
  // - Subtotal 85.100 -> dibulatkan 85.500 (pembulatan +400). Bayar 100.000, kembali 14.500!
  // - Subtotal 84.100 -> dibulatkan 84.500 (pembulatan +400). Bayar 100.000, kembali 15.500!
  // - Subtotal 85.000 -> dibulatkan 85.000 (pembulatan 0). Bayar 100.000, kembali 15.000!
  // Untuk Non-Tunai (QRIS / Transfer / Debit / Tempo): pembulatan = 0 (pas sesuai nilai).
  // =========================================================================
  const isCash = paymentMethod === "CASH";
  const roundingAmount =
    isCash && netBeforeRounding > 0 && netBeforeRounding % 500 !== 0
      ? 500 - (netBeforeRounding % 500)
      : 0;
  const finalTotal = netBeforeRounding + roundingAmount;

  // Kembalian: Selisih uang bayar dengan total tagihan yang sudah dibulatkan
  const rawChange = isCash ? Math.max(0, cashGiven - finalTotal) : 0;
  const finalChange = isCash && cashGiven >= finalTotal ? cashGiven - finalTotal : 0;
  const effectiveCashGiven = isCash ? cashGiven : finalTotal;
  const isCashSufficient = !isCash || cashGiven >= finalTotal;
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || null;

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
    const targetRounding =
      method === "CASH" && netBeforeRounding > 0 && netBeforeRounding % 500 !== 0
        ? 500 - (netBeforeRounding % 500)
        : 0;
    const targetTotal = netBeforeRounding + targetRounding;
    if (method !== "CASH") {
      setCashGiven(targetTotal);
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
      cashier: currentCashierName,
      businessName: activeBusiness?.name || "Apotik Tamansari",
    };

    try {
      await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleNumber,
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
          customer: selectedCustomer,
          doctor: selectedDoctor,
          prescriptionNumber: saleType === "PRESCRIPTION" ? prescriptionNumber : undefined,
          subtotal: itemsSubtotal,
          compoundingFee: saleType === "COMPOUNDING" ? compoundingFee : 0,
          embalaseFee: saleType === "COMPOUNDING" ? embalaseFee : 0,
          discountAmount,
          paymentMethod,
          paymentNote: effectiveNote,
          cashGiven: effectiveCashGiven,
          roundingAmount,
          change: finalChange,
          userId: currentUserId,
          cashier: currentCashierName,
          businessName: activeBusiness?.name || "Apotik Tamansari",
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

      // Save to client localStorage backup for resilient real-time history
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("gigins_recent_pos_sales");
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [saleRecord, ...existing.filter((s: any) => s.saleNumber !== saleNumber)].slice(0, 50);
          localStorage.setItem("gigins_recent_pos_sales", JSON.stringify(updated));
          localStorage.setItem("last_pos_sale_sync", Date.now().toString());
        } catch {}

        // Broadcast POS sale sync so order history gets live update immediately
        try {
          const ch = new BroadcastChannel("pos_sales_sync");
          ch.postMessage({ saleNumber, sale: saleRecord, timestamp: Date.now() });
          ch.close();
        } catch {}
      }
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-1.5">
      {/* 1. COMPACT TOP HEADER BAR */}
      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs sm:text-sm">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span>Kasir POS</span>
          </div>

          {/* Cashier Badge: Akun Login = Nama Kasir */}
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Kasir: <strong className="text-slate-900">{currentCashierName}</strong></span>
            {user?.role && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 ml-0.5 uppercase bg-white">
                {user.role}
              </Badge>
            )}
          </div>

          {/* Sub-Mode Selector Pills (Bebas / Resep / Racikan) */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setSaleType("GENERAL")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                saleType === "GENERAL"
                  ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              💊 Bebas (OTC)
            </button>
            <button
              type="button"
              onClick={() => setSaleType("PRESCRIPTION")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                saleType === "PRESCRIPTION"
                  ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📝 Resep Dokter
            </button>
            <button
              type="button"
              onClick={() => setSaleType("COMPOUNDING")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                saleType === "COMPOUNDING"
                  ? "bg-white text-emerald-800 shadow-xs border border-emerald-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🧪 Obat Racikan
            </button>
          </div>

          {/* Owner Mode Toggle if isOwner */}
          {isOwner && (
            <Badge
              variant={isOwnerMode ? "success" : "outline"}
              className="cursor-pointer gap-1 py-1 px-2 text-[10px] font-bold select-none transition-all"
              onClick={() => setIsOwnerMode(!isOwnerMode)}
              title="Klik untuk beralih mode Owner / Kasir"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              {isOwnerMode ? "Mode Owner" : "Kasir Standar"}
            </Badge>
          )}
        </div>

        {/* View Switcher: Kasir POS vs Riwayat Pesanan + Sound Bel */}
        <div className="flex items-center gap-1.5">
          {globalIncomingAlert && (
            <button
              onClick={() => {
                setActivePosTab("history");
                setGlobalIncomingAlert(null);
              }}
              className="bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse shadow-xs"
              title="Ada Pesanan Online Baru"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>Pesanan Online Baru ({globalIncomingAlert.orderNumber})</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActivePosTab("cashier")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activePosTab === "cashier"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kasir POS</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePosTab("history")}
              className={`relative px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activePosTab === "history"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat</span>
              {pendingOnlineCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingOnlineCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Notifikasi Bel Masuk: Aktif" : "Notifikasi Bel Masuk: Mute"}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center transition-all ${
              soundEnabled
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-slate-100 border-slate-300 text-slate-400"
            }`}
          >
            {soundEnabled ? (
              <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR KHUSUS RESEP DOKTER / RACIKAN (HANYA MUNCUL JIKA DIPILIH, TINGGI COMPACT ~36px) */}
      {saleType === "PRESCRIPTION" && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="font-semibold text-emerald-900 whitespace-nowrap">Dokter:</span>
            <div className="flex-1">
              <SearchableCombobox
                iconType="doctor"
                placeholder="-- Pilih / cari dokter --"
                searchPlaceholder="Cari nama dokter atau klinik..."
                emptyText="Dokter belum terdaftar"
                addNewButtonText="Tambah Dokter"
                onAddNew={(val) => handleOpenAddDoctor(val)}
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
            <button
              type="button"
              onClick={() => handleOpenAddDoctor()}
              className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0"
            >
              + Dokter Baru
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-900 whitespace-nowrap">No. Resep:</span>
            <Input
              placeholder="Contoh: R/2026/11/045"
              value={prescriptionNumber}
              onChange={(e) => setPrescriptionNumber(e.target.value)}
              className="h-7 text-xs bg-white w-44 font-mono"
            />
          </div>
        </div>
      )}

      {saleType === "COMPOUNDING" && (
        <div className="bg-teal-50/80 border border-teal-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="font-semibold text-teal-900 whitespace-nowrap">Formula:</span>
            <Input
              value={compoundingName}
              onChange={(e) => setCompoundingName(e.target.value)}
              placeholder="Contoh: Puyer Paracetamol + CTM"
              className="h-7 text-xs bg-white flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-900 whitespace-nowrap">Tuslah:</span>
            <Input
              type="number"
              value={compoundingFee || ""}
              onChange={(e) => setCompoundingFee(Number(e.target.value))}
              placeholder="Rp Tuslah"
              className="h-7 text-xs bg-white w-24 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-900 whitespace-nowrap">Embalase:</span>
            <Input
              type="number"
              value={embalaseFee || ""}
              onChange={(e) => setEmbalaseFee(Number(e.target.value))}
              placeholder="Rp Embalase"
              className="h-7 text-xs bg-white w-24 font-mono"
            />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE: RIWAYAT PESANAN vs LAYAR KASIR */}
      {activePosTab === "history" ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PosOrderHistory
            businessSlug={activeBusiness?.slug || "apotik-tamansari"}
            businessName={activeBusiness?.name || "Apotik Tamansari"}
            businessAddress={activeBusiness?.address || "Jl. Tamansari No. 45, Bandung"}
            businessPhone={activeBusiness?.phone || "022-2501234"}
            currentCashier={currentCashierName}
            onSwitchToCashier={() => setActivePosTab("cashier")}
            onLoadOrderToPOS={handleLoadOnlineOrderToCart}
          />
        </div>
      ) : (
        /* 2 COLUMNS (LEFT: SEARCH + CUSTOMER + FULL CATALOG, RIGHT: MONITOR + CART TABLE + TIGHT PAYMENT) */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* === KOLOM KIRI (6 COLS): ACTION BAR (SEARCH & PELANGGAN) + KATALOG OBAT === */}
          <div className="lg:col-span-6 flex flex-col min-h-0 h-full gap-1.5">
            {/* Top Action Bar: Barcode Search + Pelanggan CRM + Owner Add Drug */}
            <div className="flex gap-1.5 items-center shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Scan barcode [Enter] / cari obat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeSearchKeyDown}
                  className="pl-8 bg-white h-8 text-xs font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Pelanggan / Member CRM Selector Inline */}
              <div className="w-44 sm:w-52 shrink-0">
                <SearchableCombobox
                  iconType="user"
                  placeholder="Pelanggan Umum..."
                  searchPlaceholder="Cari nama / no HP..."
                  emptyText="Belum terdaftar"
                  addNewButtonText="Tambah Member"
                  onAddNew={(val) => handleOpenAddCustomer(val)}
                  value={selectedCustomer ? selectedCustomer.id : ""}
                  onChange={(val) => {
                    const cust = customers.find((c) => c.id === val) || null;
                    setSelectedCustomer(cust);
                  }}
                  options={[
                    { value: "", label: "Umum (Non-Member)" },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      description: `Diskon ${c.discountPct}% • ${c.phone}`,
                      badge: c.tier,
                    })),
                  ]}
                />
              </div>

              {isOwnerMode && (
                <Button
                  type="button"
                  onClick={handleOpenAddDrugModal}
                  className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs"
                  title="Owner: Tambah Obat Baru"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Obat</span>
                </Button>
              )}
            </div>

            {/* Katalog Lengkap Obat (Full Height Scrollable Grid) */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 p-2 flex flex-col shadow-2xs overflow-hidden">
              <div className="flex justify-between items-center mb-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-emerald-600" />
                  Katalog Obat & Pilihan Cepat
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredProducts.length} Produk
                </span>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 pr-1">
                {filteredProducts.map((product) => {
                  const fifoBatch = product.batches?.[0];
                  return (
                    <div
                      key={product.id}
                      className="p-1.5 bg-slate-50 hover:bg-emerald-50/50 rounded-lg border border-slate-200 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[8px] text-slate-400 font-mono">
                            {product.barcode}
                          </span>
                          <div className="flex items-center gap-1">
                            {product.isConsignment && (
                              <Badge variant="purple" className="text-[7px] px-1 py-0">
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
                                className="p-0.5 rounded text-amber-700 hover:bg-amber-100 transition-colors"
                                title="Edit Stok & Batch"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="font-semibold text-xs text-slate-800 line-clamp-1 leading-tight mt-0.5" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="text-[9px] text-slate-400 italic truncate">
                          {product.genericName || product.category}
                        </p>

                        <div className="mt-0.5 flex items-center justify-between text-[9px]">
                          <span className={`font-bold ${product.totalStock <= product.minStock ? "text-rose-600" : "text-emerald-700"}`}>
                            Stok: {product.totalStock} {product.baseUnit}
                          </span>
                          {fifoBatch && (
                            <span className="text-[8px] text-slate-400 font-mono truncate">
                              B:{fifoBatch.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Satuan yang langsung klik ke keranjang di sebelah kanan */}
                      <div className="mt-1 pt-1 border-t border-slate-200/80 flex flex-wrap gap-1">
                        {product.units.map((unit, uIdx) => (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => addToCart(product, uIdx)}
                            className="flex-1 py-0.5 px-1 rounded bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 text-slate-700 text-[9px] font-semibold transition-colors flex justify-between items-center shadow-2xs"
                          >
                            <span className="truncate">{unit.unitName}</span>
                            <span className="font-bold ml-0.5">{formatRupiah(unit.sellPrice)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* === KOLOM KANAN (6 COLS): TOTAL TAGIHAN + RINCIAN PENJUALAN + PANEL BAYAR RAPAT === */}
          <div className="lg:col-span-6 flex flex-col min-h-0 h-full gap-1.5">
            {/* ALFAMART STYLE DIGITAL REGISTER DISPLAY MONITOR (NOMINAL TOTAL TAGIHAN) */}
            <div className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 shadow-xs shrink-0">
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                    TOTAL TAGIHAN
                  </span>
                  {roundingAmount > 0 && (
                    <span className="text-[9px] text-amber-400 font-mono bg-amber-950/80 border border-amber-800 px-1 py-0.2 rounded font-bold">
                      Pembulatan (+Rp 500): +{formatRupiah(roundingAmount)}
                    </span>
                  )}
                </div>
                <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-tight">
                  {formatRupiah(finalTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold">
                    Diterima:
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-sky-400">
                    {formatRupiah(effectiveCashGiven)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold">
                    Kembalian:
                  </span>
                  <span className={`text-xs sm:text-sm font-mono font-black ${isCash && finalChange > 0 ? "text-amber-400" : "text-slate-400"}`}>
                    {formatRupiah(isCash ? finalChange : 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* RINCIAN PENJUALAN (TEPAT DI BAWAH NOMINAL TOTAL TAGIHAN) */}
            <Card className="flex-1 min-h-[90px] border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
              <CardHeader className="py-1 px-3 bg-slate-50 border-b flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                    Rincian Penjualan &bull; {cart.length} Item
                  </CardTitle>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setCashGiven(0);
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Kosongkan
                  </button>
                )}
              </CardHeader>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[9px] border-b sticky top-0 z-10">
                    <tr>
                      <th className="py-1 px-1.5 w-6 text-center">#</th>
                      <th className="py-1 px-2">Nama Barang / Obat</th>
                      <th className="py-1 px-1.5 text-center">Satuan</th>
                      <th className="py-1 px-1.5 text-right">Harga</th>
                      <th className="py-1 px-1.5 text-center w-20">Qty</th>
                      <th className="py-1 px-2 text-right">Subtotal</th>
                      <th className="py-1 px-1 text-center w-6">Batal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400 font-sans">
                          <ShoppingBag className="h-6 w-6 mx-auto text-slate-300 mb-0.5" />
                          <p className="font-bold text-slate-700 text-xs">Keranjang Belanja Kosong</p>
                          <p className="text-[10px] text-slate-400">
                            Pilih obat dari katalog di sebelah kiri atau scan barcode
                          </p>
                        </td>
                      </tr>
                    ) : (
                      cart.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-1 px-1.5 text-center text-slate-400 font-semibold text-[10px]">{idx + 1}</td>
                          <td className="py-1 px-2">
                            <p className="font-bold text-slate-800 font-sans leading-tight line-clamp-1">{item.name}</p>
                            <div className="flex items-center gap-1 text-[8px] text-slate-400 font-mono">
                              <span>B:{item.selectedBatchNumber}</span>
                              <span>&bull;</span>
                              <span>Exp:{item.expiredDate?.slice(0, 10)}</span>
                            </div>
                          </td>
                          <td className="py-1 px-1.5 text-center font-medium text-slate-600 font-sans text-[11px]">{item.unitName}</td>
                          <td className="py-1 px-1.5 text-right text-slate-600 text-[11px]">{formatRupiah(item.sellPrice)}</td>
                          <td className="py-1 px-1.5">
                            <div className="flex items-center justify-center gap-0.5 bg-slate-50 border border-slate-200 rounded p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQty(idx, item.qty - 1)}
                                className="w-3.5 h-3.5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-slate-800 text-[11px] font-sans">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(idx, item.qty + 1)}
                                className="w-3.5 h-3.5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-1 px-2 text-right font-black text-slate-900 text-[11px]">{formatRupiah(item.subtotal)}</td>
                          <td className="py-1 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cart Footer Bar */}
              <div className="bg-slate-50 px-2.5 py-1 border-t flex justify-between items-center text-xs shrink-0 font-medium">
                <span className="text-slate-500 text-[10px]">
                  Total: <strong>{cart.reduce((s, it) => s + it.qty, 0)} Pcs</strong> ({cart.length} Baris)
                </span>
                <span className="font-bold text-slate-800 text-[11px]">
                  Subtotal: <strong className="text-emerald-700 font-mono text-xs ml-1">{formatRupiah(itemsSubtotal)}</strong>
                </span>
              </div>
            </Card>

            {/* PANEL PEMBAYARAN & TOMBOL SELESAI (PADAT, TANPA SPACE KOSONG & TIDAK LONCAT) */}
            <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs shrink-0 space-y-1.5">
              {/* Payment Methods Grid */}
              <div className="grid grid-cols-5 gap-1">
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
                      className={`py-1 px-1 rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="text-[10px] font-semibold truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Controls (When CASH) */}
              {paymentMethod === "CASH" && (
                <div className="space-y-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                      <Input
                        type="number"
                        value={cashGiven || ""}
                        onChange={(e) => setCashGiven(Number(e.target.value))}
                        placeholder="Ketik uang diterima..."
                        className="pl-8 text-sm font-black h-7.5 bg-white text-slate-900 border-slate-300 focus:border-emerald-500 font-mono"
                      />
                    </div>
                    {/* Tombol Uang Pas */}
                    <button
                      type="button"
                      onClick={() => setCashGiven(finalTotal)}
                      className={`h-7.5 px-2.5 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                        cashGiven === finalTotal
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500"
                      }`}
                    >
                      Uang Pas
                    </button>
                  </div>

                  {/* Cash Preset Pills */}
                  <div className="flex gap-1">
                    {[10000, 20000, 50000, 100000, 200000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCashGiven(preset)}
                        className={`flex-1 py-0.5 px-0.5 rounded text-[10px] font-semibold border transition-colors ${
                          cashGiven === preset
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {formatRupiah(preset)}
                      </button>
                    ))}
                  </div>

                  {!isCashSufficient && (
                    <div className="bg-rose-50 border border-rose-200 rounded py-0.5 px-2 text-[10px] text-rose-700 font-semibold text-center">
                      Uang kurang {formatRupiah(finalTotal - cashGiven)}
                    </div>
                  )}
                </div>
              )}

              {/* QRIS View */}
              {paymentMethod === "QRIS" && (
                <div className="py-1 px-2 bg-sky-50 rounded-lg border border-sky-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-900 text-[11px]">Scan QRIS Pas: {formatRupiah(finalTotal)}</span>
                  <span className="text-[10px] text-sky-600 bg-white px-2 py-0.5 rounded border border-sky-200 font-medium">Tanpa Kembalian</span>
                </div>
              )}

              {/* Transfer View */}
              {paymentMethod === "TF" && (
                <div className="py-1 px-2 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
                  <div className="grid grid-cols-3 gap-1">
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
                        className={`py-0.5 px-1 rounded border text-left text-[10px] ${
                          selectedBank === b.bank ? "bg-blue-100 border-blue-500 font-bold" : "bg-white border-slate-200"
                        }`}
                      >
                        <span className="font-bold text-slate-800">{b.bank}</span>
                        <span className="text-[8px] text-slate-500 font-mono block truncate">{b.acc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Catatan:</span>
                <Input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan struk (opsional)..."
                  className="bg-white h-6.5 text-[11px] flex-1"
                />
              </div>

              {/* TOMBOL UTAMA: LANGSUNG MENEMPEL SETELAH INPUT (TANPA GAP / TANPA SPACE KOSONG) */}
              <Button
                type="button"
                onClick={handleFinishPayment}
                disabled={isProcessing || cart.length === 0 || !isCashSufficient}
                className="w-full h-10 text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 rounded-xl transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses & Cetak Struk...
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

              {/* Completed Sale Notification Banner */}
              {completedSale && (
                <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
                  <div className="truncate">
                    <span className="font-bold text-emerald-800 block truncate text-[11px]">
                      ✓ Struk #{completedSale.saleNumber} Selesai!
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Kembalian: <strong className="text-emerald-700 font-mono">{formatRupiah(completedSale.change)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReceipt()}
                      className="h-6.5 px-2 text-[10px] font-bold border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50"
                    >
                      <Printer className="w-3 h-3 mr-0.5" />
                      Cetak
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompletedSale(null);
                        setCashGiven(0);
                      }}
                      className="h-6.5 px-2 text-[10px] font-bold border-slate-300 text-slate-700 bg-white"
                    >
                      Baru
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl font-mono text-xs space-y-2 text-slate-800 max-h-[68vh] overflow-y-auto custom-modal-scroll">
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
                {completedSale.roundingAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold text-[11px]">
                    <span>Pembulatan (+Rp 500 keatas):</span>
                    <span>+{formatRupiah(completedSale.roundingAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t">
                  <span>TOTAL:</span>
                  <span className="text-emerald-700">{formatRupiah(completedSale.totalAmount)}</span>
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
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-0.5">
                    <span>Kembalian:</span>
                    <span className="text-emerald-700">{formatRupiah(completedSale.change)}</span>
                  </div>
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
          <DialogContent onClose={() => setIsEditDrugModalOpen(false)} className="max-w-xl">
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
                    Penyesuaian Total Stok Fisik Obat:
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
                      onChange={(e) => {
                        const newTot = Number(e.target.value);
                        const diff = newTot - editDrugForm.totalStock;
                        const updatedBatches = [...editDrugForm.batches];
                        if (updatedBatches.length > 0) {
                          updatedBatches[0].quantity = Math.max(0, updatedBatches[0].quantity + diff);
                        } else {
                          updatedBatches.push({
                            id: `b-${editingDrug.id}-new`,
                            batchNumber: `BCH-${new Date().getFullYear()}-01`,
                            expiredDate: "2027-12-31",
                            quantity: newTot,
                            buyPrice: editDrugForm.units[0]?.buyPrice || 1000,
                          });
                        }
                        setEditDrugForm({
                          ...editDrugForm,
                          totalStock: newTot,
                          batches: updatedBatches,
                        });
                      }}
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

              {/* Manajemen Batch FIFO & Stok Per Batch */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Clock className="h-4 w-4 text-emerald-700" />
                    Manajemen Batch FIFO ({editDrugForm.batches.length} Batch Aktif):
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const newB: MockBatch = {
                        id: `b-${editingDrug.id}-${Date.now().toString().slice(-4)}`,
                        batchNumber: `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                        expiredDate: "2027-12-31",
                        quantity: 20,
                        buyPrice: editDrugForm.units[0]?.buyPrice || 1000,
                      };
                      const updated = [...editDrugForm.batches, newB];
                      const newTot = updated.reduce((s, b) => s + Number(b.quantity || 0), 0);
                      setEditDrugForm({
                        ...editDrugForm,
                        batches: updated,
                        totalStock: newTot,
                      });
                    }}
                    className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah Batch
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editDrugForm.batches.map((batch, bIdx) => (
                    <div
                      key={batch.id || bIdx}
                      className="p-2.5 bg-white rounded-lg border border-emerald-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] font-semibold text-slate-600 block">No. Batch:</label>
                        <Input
                          value={batch.batchNumber}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            const updated = [...editDrugForm.batches];
                            updated[bIdx].batchNumber = val;
                            setEditDrugForm({ ...editDrugForm, batches: updated });
                          }}
                          className="h-7 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="text-[10px] font-semibold text-slate-600 block">Expired (ED):</label>
                        <Input
                          type="date"
                          value={batch.expiredDate ? batch.expiredDate.slice(0, 10) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...editDrugForm.batches];
                            updated[bIdx].expiredDate = val;
                            setEditDrugForm({ ...editDrugForm, batches: updated });
                          }}
                          className="h-7 text-xs"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-emerald-800 block">
                          Stok ({editingDrug.baseUnit}):
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={batch.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            const updated = [...editDrugForm.batches];
                            updated[bIdx].quantity = val;
                            const newTot = updated.reduce((s, b) => s + Number(b.quantity || 0), 0);
                            setEditDrugForm({
                              ...editDrugForm,
                              batches: updated,
                              totalStock: newTot,
                            });
                          }}
                          className="h-7 text-xs font-bold text-emerald-900 border-emerald-300"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end pt-3">
                        {editDrugForm.batches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editDrugForm.batches.filter((_, i) => i !== bIdx);
                              const newTot = updated.reduce((s, b) => s + Number(b.quantity || 0), 0);
                              setEditDrugForm({
                                ...editDrugForm,
                                batches: updated,
                                totalStock: newTot,
                              });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Hapus Batch"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
        <DialogContent onClose={() => setIsAddDrugModalOpen(false)} className="max-w-xl">
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
