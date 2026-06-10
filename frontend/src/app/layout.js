
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ToastContainer from "@/components/shared/ToastContainer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "TransHub — Nigeria's #1 Interstate E-Ticketing Platform",
    template: "%s | TransHub",
  },
  description:
    "Book bus & car seats, send goods via waybill, and charter vehicles across Nigeria. Fast, secure, and reliable interstate travel and logistics.",
  keywords: [
    "bus booking Nigeria",
    "interstate travel Nigeria",
    "waybill Nigeria",
    "send goods Nigeria",
    "charter bus Nigeria",
    "e-ticketing Nigeria",
    "TransHub",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TransHub",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "TransHub",
    title: "TransHub — Nigeria's #1 Interstate E-Ticketing Platform",
    description:
      "Book bus & car seats, waybill goods, and charter vehicles across Nigeria.",
  },
  twitter: {
    card: "summary",
    title: "TransHub",
    description: "Book seats, waybill goods, charter vehicles across Nigeria.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TransHub" />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <ToastContainer />
        {process.env.NODE_ENV === "production" ? (
          <Script
            id="register-sw"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              if ('serviceWorker' in navigator) {
                var registerSW = function() {
                  // Capture controller state BEFORE registration resolves so we can
                  // distinguish a first install (no prior controller → no reload) from
                  // an update (existing controller replaced → reload to get new bundles).
                  var hadController = !!navigator.serviceWorker.controller;

                  // When skipWaiting()+clients.claim() fire in the new SW, every
                  // controlled tab gets a controllerchange event. Reload once to
                  // ensure the running page uses the new JS/CSS bundles.
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!hadController) return; // first install — page is already fresh
                    // sessionStorage survives same-tab reloads; prevents infinite loop
                    // if the new SW also triggers controllerchange on the reload.
                    if (sessionStorage.getItem('sw-reloaded')) return;
                    sessionStorage.setItem('sw-reloaded', '1');
                    window.location.reload();
                  });

                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('TransHub SW registered:', reg.scope);
                      // Check for updates hourly. The browser checks on every navigation
                      // by default, but long-lived sessions would otherwise miss new
                      // deployments until the user navigates or reopens the tab.
                      setInterval(function() { reg.update(); }, 60 * 60 * 1000);
                    })
                    .catch(function(err) { console.log('SW registration failed:', err); });
                };
                // This script runs afterInteractive, which can fire AFTER the
                // 'load' event — in that case a load listener would never run and
                // the SW would silently never register. Register immediately when
                // the document is already complete, else wait for load.
                if (document.readyState === 'complete') { registerSW(); }
                else { window.addEventListener('load', registerSW); }
              }
            `,
            }}
          />
        ) : (
          // Dev: never run the SW. Its CacheFirst strategy caches non-immutable
          // Turbopack/HMR chunks, so after a rebuild it serves stale/404'd JS and
          // pages render blank. Unregister any SW left over from a prod build and
          // purge its caches so an already-poisoned browser self-heals.
          <Script
            id="unregister-sw"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations()
                  .then(function(regs) { regs.forEach(function(r) { r.unregister(); }); });
              }
              if (window.caches && caches.keys) {
                caches.keys().then(function(keys) { keys.forEach(function(k) { caches.delete(k); }); });
              }
            `,
            }}
          />
        )}
      </body>
    </html>
  );
}
