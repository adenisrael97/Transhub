'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, X, Globe, MessageCircle, Send } from 'lucide-react';

const HIDDEN_PREFIXES = ['/admin', '/operator', '/manage-trips', '/bookings', '/operators', '/analytics'];

const SERVICES = [
  { href: '/search',            label: 'Book a Seat' },
  { href: '/send',              label: 'Send Goods' },
  { href: '/charter',           label: 'Charter a Vehicle' },
  { href: '/track',             label: 'Track Package' },
  { href: '/register-operator', label: 'Become an Operator' },
  { href: '/operator/login',    label: 'Operator Portal' },
];

const COMPANY = [
  { href: '/about',   label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/careers', label: 'Careers' },
  { href: '/blog',    label: 'Blog' },
];

const SUPPORT = [
  { href: '/help',    label: 'Help Center' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms',   label: 'Terms of Service' },
  { href: 'tel:+2348000000000', label: '+234 800 000 0000' },
];

const SOCIALS = [
  { icon: X,              href: '#', label: 'X (Twitter)' },
  { icon: MessageCircle,  href: '#', label: 'WhatsApp' },
  { icon: Send,           href: '#', label: 'Telegram' },
  { icon: Globe,          href: '#', label: 'Website' },
];

function LinkList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className="text-sm text-[#94A3B8] hover:text-white transition-colors">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="bg-[#0A1B3D] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand col */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0">
                <Bus size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">TransHub</span>
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-5">
              Nigeria&apos;s #1 interstate transport platform. Book, ship and charter — all in one place.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#475569] mb-4">Services</h5>
            <LinkList items={SERVICES} />
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#475569] mb-4">Company</h5>
            <LinkList items={COMPANY} />
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#475569] mb-4">Support</h5>
            <LinkList items={SUPPORT} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#475569]">© {new Date().getFullYear()} TransHub Technologies Ltd. All rights reserved.</p>
          <p className="text-xs text-[#475569]">Made with care for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
