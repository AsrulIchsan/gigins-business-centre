"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  StoreProduct,
  StoreCustomer,
  StoreCartItem,
  CustomerVitalRegistration,
  INITIAL_STORE_CUSTOMERS,
} from "./store-data";

interface StoreContextType {
  customer: StoreCustomer | null;
  isLoggedIn: boolean;
  cart: StoreCartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: StoreProduct, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  registerCustomer: (
    data: CustomerVitalRegistration
  ) => Promise<{ success: boolean; customer?: StoreCustomer; message: string }>;
  loginCustomer: (
    phoneOrEmail: string,
    password?: string
  ) => Promise<{ success: boolean; customer?: StoreCustomer; message: string }>;
  logoutCustomer: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CUSTOMER_STORAGE_KEY = "apotik_tamansari_customer";
const REGISTERED_CUSTOMERS_KEY = "apotik_tamansari_all_customers";
const CART_STORAGE_KEY = "apotik_tamansari_cart";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on client mount
  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) {
        setCustomer(JSON.parse(savedCustomer));
      }

      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      // Initialize customers storage if empty
      const existingAll = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
      if (!existingAll) {
        localStorage.setItem(
          REGISTERED_CUSTOMERS_KEY,
          JSON.stringify(INITIAL_STORE_CUSTOMERS)
        );
      }
    } catch (err) {
      console.error("Failed to load store storage:", err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [cart, isInitialized]);

  // Cart operations
  const addToCart = (product: StoreProduct, qty = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Customer registration — ONLY VITAL DATA: Nama, No HP, Alamat, Email (opsional)
  const registerCustomer = async (data: CustomerVitalRegistration) => {
    try {
      if (!data.name?.trim()) {
        return { success: false, message: "Nama lengkap wajib diisi." };
      }
      if (!data.phone?.trim()) {
        return { success: false, message: "Nomor HP / WhatsApp wajib diisi." };
      }
      if (!data.address?.trim()) {
        return { success: false, message: "Alamat pengiriman wajib diisi." };
      }
      if (!data.password?.trim()) {
        return { success: false, message: "Kata sandi wajib diisi." };
      }

      // Read existing customers
      let allCust: StoreCustomer[] = [...INITIAL_STORE_CUSTOMERS];
      try {
        const stored = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
        if (stored) allCust = JSON.parse(stored);
      } catch {}

      // Check duplicate phone
      const normalizedPhone = data.phone.replace(/[^0-9]/g, "");
      const existing = allCust.find(
        (c) => c.phone.replace(/[^0-9]/g, "") === normalizedPhone
      );
      if (existing) {
        return {
          success: false,
          message: `Nomor HP ${data.phone} sudah terdaftar dengan kode member ${existing.memberCode}. Silakan langsung masuk.`,
        };
      }

      // Generate member code
      const nextNum = 1000 + allCust.length + 1;
      const newCustomer: StoreCustomer = {
        id: `cust-${Date.now()}`,
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        email: data.email?.trim() || undefined, // Opsional
        memberCode: `MBR-TAMAN-${nextNum}`,
        points: 50, // Welcome points
        tier: "REGULAR",
        createdAt: new Date().toISOString(),
      };

      allCust.push(newCustomer);
      localStorage.setItem(REGISTERED_CUSTOMERS_KEY, JSON.stringify(allCust));
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(newCustomer));
      setCustomer(newCustomer);

      // Optional: Post to backend API
      try {
        await fetch("/api/store/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REGISTER", ...newCustomer }),
        });
      } catch {}

      return {
        success: true,
        customer: newCustomer,
        message: `Pendaftaran berhasil! Selamat datang ${newCustomer.name}. Nomor Member Apotek Anda adalah ${newCustomer.memberCode}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal memproses pendaftaran akun.",
      };
    }
  };

  const loginCustomer = async (phoneOrEmail: string, password?: string) => {
    try {
      if (!phoneOrEmail?.trim()) {
        return { success: false, message: "Masukkan No. HP atau Email Anda." };
      }

      let allCust: StoreCustomer[] = [...INITIAL_STORE_CUSTOMERS];
      try {
        const stored = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
        if (stored) allCust = JSON.parse(stored);
      } catch {}

      const cleanInput = phoneOrEmail.trim().toLowerCase();
      const numInput = phoneOrEmail.replace(/[^0-9]/g, "");

      const found = allCust.find(
        (c) =>
          (numInput.length > 5 && c.phone.replace(/[^0-9]/g, "").includes(numInput)) ||
          (c.email && c.email.toLowerCase() === cleanInput) ||
          c.memberCode.toLowerCase() === cleanInput
      );

      if (!found) {
        return {
          success: false,
          message: "Akun tidak ditemukan. Silakan cek nomor HP Anda atau buat akun baru.",
        };
      }

      setCustomer(found);
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(found));

      return {
        success: true,
        customer: found,
        message: `Selamat datang kembali, ${found.name}!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Gagal masuk ke akun.",
      };
    }
  };

  const logoutCustomer = () => {
    setCustomer(null);
    try {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    } catch {}
  };

  return (
    <StoreContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        registerCustomer,
        loginCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
