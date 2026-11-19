"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isPosPage = pathname === "/pos" || pathname.endsWith("/pos");

  // Pada halaman login, portal hub, atau webstore publik, tampilkan tanpa Sidebar dan Header bawaan ERP staf
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/hub") ||
    pathname.startsWith("/store") ||
    pathname.startsWith("/webstore")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 h-screen overflow-hidden">
        <Header />
        <main
          className={cn(
            "flex-1",
            isPosPage
              ? "p-2 sm:p-2.5 lg:p-3 overflow-hidden flex flex-col"
              : "p-4 lg:p-6 overflow-y-auto"
          )}
        >
          {children}
        </main>
        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </div>
  );
}
