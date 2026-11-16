"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Smartphone, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/lib/business-store";
import { Badge } from "@/components/ui/badge";

export function InventoryNavTabs() {
  const pathname = usePathname();
  const { activeBusiness } = useBusinessStore();
  const isPharmacy = activeBusiness.type === "PHARMACY";
  const isDynamic = pathname?.startsWith("/b/");
  const currentSlug = activeBusiness.slug;

  const tabs = [
    {
      title: isPharmacy ? "Kartu Stok & FIFO Batch" : "Kartu Stok & Rak Toko",
      href: "/inventory/kartu-stok",
      icon: Boxes,
    },
    {
      title: isPharmacy ? "Stok Opname Mobile" : "Stok Opname Cepat (HP)",
      href: "/inventory/opname",
      icon: Smartphone,
      badge: "HP",
    },
    ...(isPharmacy
      ? [
          {
            title: "Obat Konsinyasi & Bagi Hasil",
            href: "/inventory/konsinyasi",
            icon: ShoppingBag,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
      {tabs.map((tab) => {
        const targetHref = isDynamic
          ? `/b/${currentSlug}${tab.href}`
          : tab.href;
        const isActive = pathname === targetHref || pathname?.endsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={targetHref}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs",
              isActive
                ? isPharmacy
                  ? "bg-white text-emerald-800 shadow-xs border border-emerald-200 font-bold"
                  : "bg-white text-amber-800 shadow-xs border border-amber-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isActive
                  ? isPharmacy
                    ? "text-emerald-600"
                    : "text-amber-600"
                  : "text-slate-400"
              )}
            />
            <span>{tab.title}</span>
            {tab.badge && (
              <Badge variant="cyan" className="text-[9px] px-1.5 py-0 h-4">
                {tab.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}
