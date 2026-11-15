import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { ExtensionErrorSuppressor } from "@/components/extension-error-suppressor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gigin's Business Centre — Multi-Business ERP & POS",
  description:
    "Platform Multi-Business ERP & POS Terpadu menaungi Apotik Tamansari (Farmasi) & Toko Mainan Pasar Lelea (Retail Mainan) dengan FIFO Kedaluwarsa, Satuan Bertingkat, Kasir Mobile & Akuntansi Lengkap.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtError(msg, file) {
                  var str = (msg || '') + ' ' + (file || '');
                  return str.indexOf('MetaMask') !== -1 ||
                         str.indexOf('chrome-extension://') !== -1 ||
                         str.indexOf('moz-extension://') !== -1 ||
                         str.indexOf('inpage.js') !== -1 ||
                         str.indexOf('Failed to connect to MetaMask') !== -1 ||
                         str.indexOf('ethereum') !== -1;
                }
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var msg = (typeof reason === 'string') ? reason : (reason && (reason.message || reason.stack)) || '';
                  if (isExtError(msg, '')) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                  }
                }, true);
                window.addEventListener('error', function(e) {
                  if (isExtError(e.message, e.filename)) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ExtensionErrorSuppressor />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
