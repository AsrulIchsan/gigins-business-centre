/**
 * /b/[businessSlug]/layout.tsx
 * Shared layout untuk semua halaman operasional per bisnis.
 * Validasi akses real session dan inject sinkronisasi active business store.
 */

import { redirect } from "next/navigation";
import { getSession, canAccessBusiness } from "@/lib/auth";
import { BusinessStoreSync } from "@/components/layout/business-store-sync";

export const dynamic = "force-dynamic";

interface BusinessLayoutProps {
  children: React.ReactNode;
  params: { businessSlug: string };
}

export default async function BusinessLayout({ children, params }: BusinessLayoutProps) {
  const { businessSlug } = params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Cek apakah user punya akses ke bisnis ini
  if (!canAccessBusiness(session, businessSlug)) {
    if (session.user.platformRole === "OWNER") {
      redirect("/hub");
    }
    const first = session.businessAccesses[0];
    if (first) {
      redirect(first.role === "KASIR" ? `/b/${first.businessSlug}/pos` : `/b/${first.businessSlug}/dashboard`);
    }
    redirect("/login");
  }

  return (
    <>
      <BusinessStoreSync businessSlug={businessSlug} />
      {children}
    </>
  );
}

export async function generateMetadata({ params }: { params: { businessSlug: string } }) {
  const slugToName: Record<string, string> = {
    "apotik-tamansari": "Apotik Tamansari",
    "toko-mainan-pasar-lelea": "Toko Mainan Pasar Lelea",
  };
  const name = slugToName[params.businessSlug] ?? "Gigin's Business Centre";
  return { title: `${name} — Gigin's Business Centre` };
}
