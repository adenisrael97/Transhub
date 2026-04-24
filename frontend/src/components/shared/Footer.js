"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Routes where the public footer should be hidden. */
const HIDDEN_PREFIXES = ['/admin', '/operator', '/manage-trips', '/bookings', '/operators', '/analytics', '/dashboard'];

const SERVICES = [
  { href: "/search",  label: "Book a Seat" },
  { href: "/send",    label: "Send Goods" },
  { href: "/charter", label: "Charter a Vehicle" },
  { href: "/track",   label: "Track Package" },
  { href: "/register-operator", label: "Become an Operator" },
  { href: "/operator/login",    label: "Operator Portal" },
];

const COMPANY = [
  { href: "/about",   label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/careers", label: "Careers" },
  { href: "/blog",    label: "Blog" },
];

const SUPPORT = [
  { href: "/help",    label: "Help Center" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms of Service" },
  { href: "tel:+2348000000000", label: "+234 800 000 0000" },
];

function LinkList({ items }) {
  return (
    <ul className="space-y-2 text-gray-400 text-sm">
      {items.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className="hover:text-white transition-colors">{label}</Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="bg-gray-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-lg">TransHub</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nigeria&apos;s #1 interstate transport platform. Book, ship and charter — all in one place.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-sm mb-4">Services</h5>
            <LinkList items={SERVICES} />
          </div>

          <div>
            <h5 className="font-semibold text-sm mb-4">Company</h5>
            <LinkList items={COMPANY} />
          </div>

          <div>
            <h5 className="font-semibold text-sm mb-4">Support</h5>
            <LinkList items={SUPPORT} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} TransHub. All rights reserved.</p>
          <p>Made with care for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
