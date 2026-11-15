"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Shield, History, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export function HubHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/hub", label: "Overview Platform", icon: LayoutDashboard },
    { href: "/hub/access-control", label: "Role & Access Control", icon: Shield },
    { href: "/hub/audit-logs", label: "Login & Audit Logs", icon: History },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/hub" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase block">
                  Owner Portal
                </span>
                <h1 className="font-extrabold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                  Gigin's Business Centre
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right profile info & shortcuts */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-900">{user?.name || "Gigin"}</span>
              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                {user?.role || "OWNER"}
              </span>
            </div>

            <Link
              href="/b/apotik-tamansari/pos"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
              title="Buka Kasir POS Apotek"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
              <span className="hidden sm:inline">Buka POS</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
              title="Keluar / Logout Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-gray-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
