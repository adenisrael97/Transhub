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
        <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#D97706] rounded-lg flex items-center justify-center">
                <Bus size={14} className="text-white" />
              </div>
              <span className="font-bold text-[#0F172A] tracking-tight">TransHub</span>
              <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full ml-1">
                Driver
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20">{children}</main>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E2E8F0] flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.label}
                href={n.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#D97706]' : 'text-[#94A3B8]'
                }`}
              >
                <Icon size={20} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
