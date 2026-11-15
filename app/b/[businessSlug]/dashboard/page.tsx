"use client";

/**
 * /b/[businessSlug]/dashboard/page.tsx
 * Dashboard per unit bisnis — redirect ke home app yang sudah ada.
 */

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useBusinessStore } from "@/lib/business-store";

// Re-export halaman dashboard utama dengan business context aktif
export { default } from "@/app/page";
