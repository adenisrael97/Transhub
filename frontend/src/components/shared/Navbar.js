"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

/** Routes where the public navbar should be hidden (they have their own navigation). */
const HIDDEN_PREFIXES = ['/admin', '/operator', '/manage-trips', '/bookings', '/operators', '/analytics', '/dashboard'];

const NAV_LINKS = [
  { href: "/about",   label: "About" },
  { href: "/search",  label: "Book Seat" },
  { href: "/send",    label: "Send Goods" },
  { href: "/charter", label: "Charter" },
  { href: "/track",   label: "Track Package" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  // Hide on admin / operator / driver dashboard pages
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-gray-900 font-bold text-xl">TransHub</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname === href
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    🛠 Admin
                  </Link>
                )}
                {user?.role === 'operator' && (
                  <Link href="/operator" className="text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    🚌 Operator
                  </Link>
                )}
                <span className="text-sm text-gray-600 font-medium">
                  {user?.fullName ?? user?.email ?? "Account"}
                </span>
                <button
                  onClick={logout}
                  className="text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/operator/login"
                  className="text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Operator Portal
                </Link>
                <Link
                  href="/auth/login"
                  className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium py-2.5 px-3 rounded-lg transition-colors ${
                pathname === href
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition-colors">
                    🛠 Admin Dashboard
                  </Link>
                )}
                {user?.role === 'operator' && (
                  <Link href="/operator" onClick={() => setMenuOpen(false)}
                    className="text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition-colors">
                    🚌 Operator Dashboard
                  </Link>
                )}
                <p className="text-sm text-gray-600 font-medium px-4 py-2">
                  {user?.fullName ?? user?.email ?? "Account"}
                </p>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-red-600 border border-red-200 py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/operator/login" onClick={() => setMenuOpen(false)}
                  className="text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition-colors">
                  Operator Portal
                </Link>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                  className="text-blue-600 border border-blue-600 py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-blue-50 transition-colors">
                  Log In
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-xl text-sm font-semibold text-center hover:bg-blue-700 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
