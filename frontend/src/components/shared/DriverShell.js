'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, LayoutDashboard, Map, DollarSign, User } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/driver/dashboard' },
  { label: 'Trips',     icon: Map,             href: '/driver/dashboard' },
  { label: 'Earnings',  icon: DollarSign,      href: '/driver/dashboard' },
  { label: 'Profile',   icon: User,            href: '/driver/dashboard' },
];

export default function DriverShell({ children }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="driver">
      <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
        {/* Top app bar */}
        <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#D97706] rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(217,119,6,.3)]">
                <Bus size={15} className="text-white" />
              </div>
              <span className="font-bold text-[#0F172A] tracking-tight">TransHub</span>
              <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full ml-1">
                Driver
              </span>
            </div>
          </div>
        </header>

        {/* Page content — bottom padding must clear the fixed bottom nav incl.
            the device safe-area inset, or the last row hides under it */}
        <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>

        {/* Bottom navigation — generous touch targets + safe-area padding */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[#E2E8F0] flex safe-area-bottom shadow-[0_-1px_8px_rgba(15,23,42,.04)]">
          {NAV.map((n, idx) => {
            // Every link targets the dashboard today, so highlight only the
            // primary (Dashboard) item rather than lighting all four at once.
            const active = idx === 0 && pathname.startsWith('/driver/dashboard');
            const Icon = n.icon;
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#D97706]' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Icon size={21} className={active ? 'text-[#D97706]' : 'text-[#94A3B8]'} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
