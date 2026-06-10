import Link from "next/link";
import { MapPin, Home, Search, HelpCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-[#EFF6FF] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <MapPin size={36} className="text-[#2563EB]" />
        </div>

        <p className="text-8xl font-extrabold text-[#2563EB] mb-2 tracking-tight">404</p>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-3">Page Not Found</h1>
        <p className="text-[#64748B] mb-10 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <Home size={15} /> Go Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0] hover:bg-white text-[#475569] px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <Search size={15} /> Search Trips
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0] hover:bg-white text-[#475569] px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <HelpCircle size={15} /> Help Center
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#94A3B8] mb-3">Popular destinations</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Lagos → Abuja", "Lagos → Ibadan", "Abuja → Port Harcourt", "Kano → Lagos"].map((route) => (
              <Link
                key={route}
                href="/search"
                className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] text-[#64748B] px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              >
                {route} <ArrowRight size={11} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
