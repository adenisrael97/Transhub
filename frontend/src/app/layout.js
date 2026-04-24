
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
  maximumScale: 1,
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
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('TransHub SW registered:', reg.scope))
                    .catch(err => console.log('SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
