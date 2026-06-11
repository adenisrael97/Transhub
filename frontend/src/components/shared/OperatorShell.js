'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bus, Ticket, Truck, User, Users, Settings, Package, Receipt, Building2 } from 'lucide-react';
import AuthGuard from '@/components/shared/AuthGuard';

const NAV = [
  { label: 'Dashboard',    icon: LayoutDashboard, href: '/operator'              },
  { label: 'My Trips',     icon: Bus,             href: '/operator/trips'        },
  { label: 'Drivers',      icon: Users,           href: '/operator/drivers'      },
  { label: 'Bookings',     icon: Ticket,          href: '/operator/bookings'     },
  { label: 'Waybills',     icon: Package,         href: '/operator/waybills'     },
  { label: 'Transactions', icon: Receipt,         href: '/operator/transactions' },
  { label: 'Fleet',        icon: Truck,           href: '/operator/fleet'        },
  { label: 'Profile',      icon: User,            href: '/operator/profile'      },
  { label: 'Settings',     icon: Settings,        href: '/operator/settings'     },
];

export default function OperatorShell({ children }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="operator">
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* Sidebar — sticky, full-height, own scroll */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-[#E2E8F0] sticky top-0 h-screen overflow-y-auto th-no-scrollbar">
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#F1F5F9] shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#16A34A] flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,.3)]">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#0F172A]">TransHub</p>
              <p className="text-[11px] font-semibold text-[#64748B]">Operator Portal</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/operator' && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'text-[#16A34A] bg-[#F0FDF4]'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-[#16A34A]' : 'text-[#64748B]'} />
                  {n.label}
                  {active && (
                    <motion.div
                      layoutId="operator-nav-indicator"
                      className="absolute left-0 w-1 h-6 bg-[#16A34A] rounded-r-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom bar — horizontally scrollable so all items stay legible */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-[#E2E8F0] overflow-x-auto th-no-scrollbar safe-area-bottom">
          <div className="flex min-w-max">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/operator' && pathname.startsWith(n.href));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 w-18 py-2.5 text-[10px] font-semibold transition-colors ${
                    active ? 'text-[#16A34A]' : 'text-[#64748B]'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
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
