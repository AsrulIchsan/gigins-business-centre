/**
 * /hub/layout.tsx
 * Layout Portal Utama Owner Gigin's Business Centre.
 * Memastikan proteksi ganda sisi server: hanya akun dengan role OWNER yang dapat mengakses /hub.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.platformRole !== "OWNER") {
    const first = session.businessAccesses[0];
    if (first) {
      redirect(first.role === "KASIR" ? `/b/${first.businessSlug}/pos` : `/b/${first.businessSlug}/dashboard`);
    }
    redirect("/login");
  }

  return <>{children}</>;
}

export const metadata = {
  title: "Owner Portal — Gigin's Business Centre",
  description: "Platform Manajemen Multi-Bisnis Terpadu: Apotik Tamansari & Toko Mainan Pasar Lelea",
};
