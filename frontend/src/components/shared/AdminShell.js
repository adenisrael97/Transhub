'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bus, Ticket, Building2, BarChart3, CalendarRange, Package, Settings, Users, Receipt, ShieldCheck } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';

const NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, href: '/admin'          },
  { label: 'Trips',        icon: Bus,             href: '/manage-trips'   },
  { label: 'Bookings',     icon: Ticket,          href: '/bookings'       },
  { label: 'Charters',     icon: CalendarRange,   href: '/charters'       },
  { label: 'Waybills',     icon: Package,         href: '/waybills'       },
  { label: 'Transactions', icon: Receipt,         href: '/transactions'   },
  { label: 'Customers',    icon: Users,           href: '/customers'      },
  { label: 'Operators',    icon: Building2,       href: '/operators'      },
  { label: 'Analytics',    icon: BarChart3,       href: '/analytics'      },
  { label: 'Settings',     icon: Settings,        href: '/admin/settings' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="admin">
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* Sidebar — sticky, full-height, own scroll */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-[#E2E8F0] sticky top-0 h-screen overflow-y-auto th-no-scrollbar">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#F1F5F9] shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,.3)]">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#0F172A]">TransHub</p>
              <p className="text-[11px] font-semibold text-[#64748B]">Admin Console</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'text-[#2563EB] bg-[#EFF6FF]'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-[#2563EB]' : 'text-[#64748B]'} />
                  {n.label}
                  {active && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="absolute left-0 w-1 h-6 bg-[#2563EB] rounded-r-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom bar — horizontally scrollable so 10 items stay legible */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-[#E2E8F0] overflow-x-auto th-no-scrollbar safe-area-bottom">
          <div className="flex min-w-max">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 w-18 py-2.5 text-[10px] font-semibold transition-colors ${
                    active ? 'text-[#2563EB]' : 'text-[#64748B]'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-[#2563EB]' : 'text-[#94A3B8]'} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content — bottom padding must clear the fixed mobile bar incl. the
            device safe-area inset (home indicator), or the last row hides under it */}
        <div className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </div>
    </AuthGuard>
  );
}
