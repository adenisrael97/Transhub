"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/shared/AuthGuard";

const NAV = [
  { label: "Dashboard",  icon: "🏠", href: "/admin"     },
  { label: "Trips",      icon: "🚌", href: "/manage-trips"     },
  { label: "Bookings",   icon: "🎫", href: "/bookings"  },
  { label: "Operators",  icon: "🏢", href: "/operators" },
  { label: "Analytics",  icon: "📊", href: "/analytics" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  return (
    <AuthGuard role="admin">
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 pt-6 pb-4 gap-1 px-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Admin</p>
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden flex bg-white border-t border-gray-100 divide-x divide-gray-100">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex-1 flex flex-col items-center py-2.5 text-xs font-semibold transition-colors ${
                active ? "text-blue-600" : "text-gray-400"
              }`}>
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
    </div>
    </AuthGuard>
  );
}
