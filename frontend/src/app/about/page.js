import Link from "next/link";
import { Ticket, Package, Bus, ShieldCheck, Zap, MapPin, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us — TransHub",
  description: "Learn about TransHub — Nigeria's #1 interstate transport platform. Our mission, story, and the team behind it.",
};

const SERVICES = [
  { Icon: Ticket, color: "#2563EB", bg: "#EFF6FF", title: "Book Seats",       desc: "Book interstate bus and car seats online with instant e-tickets." },
  { Icon: Package, color: "#16A34A", bg: "#F0FDF4", title: "Send Goods",       desc: "Ship parcels and goods with real-time tracking and waybill numbers." },
  { Icon: Bus,     color: "#D97706", bg: "#FFFBEB", title: "Charter Vehicles", desc: "Charter vehicles for group travel, events, or bulk delivery." },
];

const STATS = [
  { value: "36",   label: "States Covered" },
  { value: "100+", label: "Operators"       },
  { value: "50K+", label: "Trips Booked"   },
  { value: "24/7", label: "Support"         },
];

const VALUES = [
  { Icon: ShieldCheck,    color: "#2563EB", bg: "#EFF6FF", title: "Secure Payments",      desc: "All transactions are encrypted and processed through trusted payment gateways." },
  { Icon: Zap,            color: "#D97706", bg: "#FFFBEB", title: "Instant Confirmation",  desc: "Receive your e-ticket or waybill number immediately after booking." },
  { Icon: MapPin,         color: "#16A34A", bg: "#F0FDF4", title: "Nationwide Coverage",   desc: "We operate across all 36 states and the FCT, connecting every corner of Nigeria." },
  { Icon: HeartHandshake, color: "#2563EB", bg: "#EFF6FF", title: "Customer First",        desc: "Our dedicated support team is available around the clock to assist you." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-20 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-3">About TransHub</h1>
        <p className="text-base text-white/75 max-w-2xl mx-auto leading-relaxed">
          Nigeria&apos;s #1 interstate transport platform. We make it easy to book bus and car seats, send goods, and charter vehicles anywhere in Nigeria — all in one place.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">
        {/* Mission */}
        <div className="bg-[#2563EB] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Our Mission</h2>
          <p className="text-[#BFDBFE] max-w-xl mx-auto">
            To make travel and logistics in Nigeria simple, safe, and accessible for everyone.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
              <p className="text-3xl font-bold text-[#2563EB]">{s.value}</p>
              <p className="text-sm text-[#94A3B8] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Services */}
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] text-center mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] text-center mb-8">Why Choose TransHub?</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white rounded-2xl border border-[#E2E8F0] p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] mb-1">{title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Ready to experience smarter travel?</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Book Your First Trip <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
