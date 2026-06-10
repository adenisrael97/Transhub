'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bus, Ticket, Truck, User, Users, Settings, Package, Receipt } from 'lucide-react';
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
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-[#E2E8F0] pt-6 pb-4 gap-1 px-3">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-3 mb-4">Operator Portal</p>
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/operator' && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'text-[#16A34A] bg-[#F0FDF4]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
                {n.label}
                {active && (
                  <motion.div
                    layoutId="operator-nav-indicator"
                    className="absolute left-0 w-1 h-5 bg-[#16A34A] rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </aside>

        {/* Mobile bottom bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden flex bg-white border-t border-[#E2E8F0]">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/operator' && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#16A34A]' : 'text-[#94A3B8]'
                }`}
              >
                <Icon size={20} />
                {n.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
      </div>
    </AuthGuard>
  );
}
