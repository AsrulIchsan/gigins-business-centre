"use client";

import { useEffect } from "react";
import { useBusinessStore } from "@/lib/business-store";

export function BusinessStoreSync({ businessSlug }: { businessSlug: string }) {
  const switchBusiness = useBusinessStore((s) => s.switchBusiness);
  const activeSlug = useBusinessStore((s) => s.activeBusiness.slug);

  useEffect(() => {
    if (businessSlug && activeSlug !== businessSlug) {
      switchBusiness(businessSlug);
    }
  }, [businessSlug, activeSlug, switchBusiness]);

  return null;
}
