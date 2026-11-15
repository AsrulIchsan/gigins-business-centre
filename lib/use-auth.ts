"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "APOTEKER" | "TTK" | "KASIR" | "MANAJER";
}

export interface BusinessAccessInfo {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessType: string;
  role: string;
  permissions: string[];
}

function parseCookieUser(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user_profile=([^;]*)/);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => parseCookieUser());
  const [businessAccesses, setBusinessAccesses] = useState<BusinessAccessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.platformRole,
          });
          setBusinessAccesses(data.businessAccesses || []);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      // If offline/error, maintain cookie user if available
      console.warn("[useAuth] Failed to sync session with server:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("[useAuth] Logout request error:", err);
    } finally {
      setUser(null);
      setBusinessAccesses([]);
      // Hard navigation to completely flush router cache and prevent 'Back' button restoring view
      window.location.href = "/login";
    }
  }, []);

  return {
    user,
    businessAccesses,
    isLoading,
    logout,
    refreshSession: fetchSession,
  };
}
