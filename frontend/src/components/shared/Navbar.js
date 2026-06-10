'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bus, Menu, X, LogOut, LayoutDashboard, ChevronDown, User, Settings, Ticket
} from 'lucide-react';
import useAuthStore from '@/store/authStore';

const HIDDEN_PREFIXES = ['/admin', '/operator', '/manage-trips', '/bookings', '/operators', '/analytics'];

const NAV_LINKS = [
  { href: '/about',        label: 'About' },
  { href: '/search',       label: 'Book Seat' },
  { href: '/send',         label: 'Send Goods' },
  { href: '/my-shipments', label: 'My Shipments' },
  { href: '/charter',      label: 'Charter' },
  { href: '/track',        label: 'Track Package' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenu] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const pathname     = usePathname();
  const userMenuRef  = useRef(null);
  const user         = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout       = useAuthStore((s) => s.logout);
  const hasHydrated  = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Dismiss the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setUserMenu(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const displayName = user?.fullName ?? user?.email ?? 'Account';

  return (
    <nav className={`bg-white sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'border-b border-[#E2E8F0]'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Bus size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl text-[#0F172A] tracking-tight">TransHub</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-[#2563EB] bg-[#EFF6FF]'
                      : 'text-[#475569] hover:text-[#2563EB] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {!hasHydrated ? (
              <div className="w-24 h-9 rounded-xl bg-[#F1F5F9] animate-pulse" aria-hidden="true" />
            ) : isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] border border-[#E2E8F0] px-3.5 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    <LayoutDashboard size={14} /> Admin
                  </Link>
                )}
                {user?.role === 'operator' && (
                  <Link
                    href="/operator"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] border border-[#E2E8F0] px-3.5 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Bus size={14} /> Operator
                  </Link>
                )}
                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenu((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] border border-[#E2E8F0] px-3.5 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <User size={12} className="text-[#2563EB]" />
                    </div>
                    {displayName}
                    <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {/* CSS-animated dropdown (replaces framer-motion). Kept mounted so
                      enter + exit both transition; hidden from a11y/pointer when closed. */}
                  <div
                    role="menu"
                    inert={!userMenuOpen ? true : undefined}
                    className={`absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-[#E2E8F0] shadow-lg overflow-hidden z-50 origin-top-right transition-all duration-150 ${
                      userMenuOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-[0.97] translate-y-1.5 pointer-events-none'
                    }`}
                  >
                        {user?.role === 'passenger' && (
                          <>
                            <Link
                              href="/dashboard"
                              onClick={() => setUserMenu(false)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <LayoutDashboard size={14} /> Dashboard
                            </Link>
                            <Link
                              href="/tickets"
                              onClick={() => setUserMenu(false)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <Ticket size={14} /> My Tickets
                            </Link>
                            <Link
                              href="/settings"
                              onClick={() => setUserMenu(false)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <Settings size={14} /> Settings
                            </Link>
                            <div className="h-px bg-[#F1F5F9]" />
                          </>
                        )}
                        <button
                          onClick={() => { logout(); setUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} /> Log Out
                        </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/operator/login"
                  className="text-sm font-semibold text-[#475569] border border-[#E2E8F0] px-3.5 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  Operator Portal
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-[#2563EB] border border-[#2563EB] px-3.5 py-2 rounded-xl hover:bg-[#EFF6FF] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold text-white bg-[#2563EB] px-3.5 py-2 rounded-xl hover:bg-[#1D4ED8] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-[#475569] hover:bg-[#F8FAFC] transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — CSS grid-rows collapse (replaces framer-motion height
          animation). Kept mounted so it animates both ways; `inert` when closed
          keeps the collapsed links out of tab order and the a11y tree. */}
      <div
        inert={!menuOpen ? true : undefined}
        className={`md:hidden grid transition-all duration-200 ${
          menuOpen ? 'grid-rows-[1fr] opacity-100 border-t border-[#E2E8F0]' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
            <div
              className="bg-white px-4 py-3 flex flex-col gap-1"
              onClick={() => setMenuOpen(false)}
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'text-[#2563EB] bg-[#EFF6FF]' : 'text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="mt-2 pt-3 border-t border-[#F1F5F9] flex flex-col gap-2">
                {!hasHydrated ? (
                  <div className="h-10 rounded-xl bg-[#F1F5F9] animate-pulse" aria-hidden="true" />
                ) : isAuthenticated ? (
                  <>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <LayoutDashboard size={14} /> Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'operator' && (
                      <Link href="/operator" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                        <Bus size={14} /> Operator Dashboard
                      </Link>
                    )}
                    {user?.role === 'passenger' && (
                      <>
                        <Link href="/dashboard" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <LayoutDashboard size={14} /> Dashboard
                        </Link>
                        <Link href="/tickets" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <Ticket size={14} /> My Tickets
                        </Link>
                        <Link href="/settings" className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <Settings size={14} /> Settings
                        </Link>
                      </>
                    )}
                    <p className="text-sm text-[#475569] font-medium px-3 py-1">{displayName}</p>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold text-[#DC2626] border border-red-200 hover:bg-red-50"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/operator/login" className="py-2.5 px-3 rounded-xl text-sm font-semibold text-center text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      Operator Portal
                    </Link>
                    <Link href="/auth/login" className="py-2.5 px-3 rounded-xl text-sm font-semibold text-center text-[#2563EB] border border-[#2563EB] hover:bg-[#EFF6FF]">
                      Log In
                    </Link>
                    <Link href="/auth/register" className="py-2.5 px-3 rounded-xl text-sm font-semibold text-center text-white bg-[#2563EB] hover:bg-[#1D4ED8]">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
        </div>
      </div>
    </nav>
  );
}
