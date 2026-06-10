'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bus, Ticket, Building2, BarChart3, CalendarRange, Package, Settings, Users, Receipt } from 'lucide-react';
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
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-[#E2E8F0] pt-6 pb-4 gap-1 px-3">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-3 mb-4">Admin Panel</p>
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'text-[#2563EB] bg-[#EFF6FF]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#2563EB]' : 'text-[#94A3B8]'} />
                {n.label}
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 w-1 h-5 bg-[#2563EB] rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </aside>

        {/* Mobile bottom bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden flex bg-white border-t border-[#E2E8F0] safe-area-bottom">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#2563EB]' : 'text-[#94A3B8]'
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
