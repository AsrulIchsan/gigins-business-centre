"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Boxes, Truck, BarChart3, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/lib/business-store";

export function BottomNav() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isPharmacy = activeBusiness.type === "PHARMACY";

  const navItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "POS Kasir", href: "/pos/mobile", icon: ShoppingCart, highlight: true },
    { title: "Opname HP", href: "/inventory/opname", icon: Boxes },
    { title: isPharmacy ? "Faktur PBF" : "Faktur Masuk", href: "/pembelian/mobile", icon: Truck },
    { title: "Kas Kasir", href: "/laporan/shift", icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg safe-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isDynamicRoute = pathname?.startsWith("/b/");
          const currentSlug = activeBusiness.slug;
          const targetHref = isDynamicRoute
            ? item.href === "/"
              ? `/b/${currentSlug}/dashboard`
              : `/b/${currentSlug}${item.href}`
            : item.href;
          const isActive = isDynamicRoute
            ? pathname === targetHref
            : pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={targetHref}
                className="flex flex-col items-center -mt-5 group"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                    isActive
                      ? isPharmacy
                        ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                        : "bg-amber-700 text-white ring-4 ring-amber-100"
                      : isPharmacy
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-semibold",
                    isActive
                      ? isPharmacy
                        ? "text-emerald-700"
                        : "text-amber-700"
                      : "text-slate-600"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={cn(
                "flex flex-col items-center py-1 px-3 rounded-lg transition-colors",
                isActive
                  ? isPharmacy
                    ? "text-emerald-700 font-bold"
                    : "text-amber-700 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
