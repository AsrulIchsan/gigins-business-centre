"use client";

import { useEffect } from "react";

export function ExtensionErrorSuppressor() {
  useEffect(() => {
    // 1. Intercept unhandled promise rejections (e.g. MetaMask inpage.js)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason?.message || reason?.stack || JSON.stringify(reason) || "";

      if (
        message.includes("MetaMask") ||
        message.includes("Failed to connect to MetaMask") ||
        message.includes("chrome-extension://") ||
        message.includes("moz-extension://") ||
        message.includes("inpage.js") ||
        message.includes("ethereum")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Suppressed Browser Extension Error]:", message);
      }
    };

    // 2. Intercept general window errors
    const handleError = (event: ErrorEvent) => {
      const filename = event.filename || "";
      const message = event.message || "";

      if (
        filename.includes("chrome-extension://") ||
        filename.includes("moz-extension://") ||
        filename.includes("inpage.js") ||
        message.includes("MetaMask") ||
        message.includes("Failed to connect to MetaMask") ||
        message.includes("ethereum")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Suppressed Browser Extension Error]:", message, filename);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    window.addEventListener("error", handleError, true);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return null;
}
