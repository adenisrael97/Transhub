import Link from "next/link";
import { Ticket, Package, Bus, Search, Star, Lock, MapPin, Mail, Shield, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import SearchCard from "@/components/shared/SearchCard";

export const metadata = {
  title: "TransHub — Nigeria's #1 Interstate E-Ticketing Platform",
  description: "Book bus & car seats, send goods via waybill, and charter vehicles across Nigeria. Fast, secure, and reliable interstate travel and logistics.",
};

const SERVICES = [
  {
    icon: Ticket,
    label: "Book a Seat",
    desc: "Search and reserve interstate bus or car seats in seconds. Pick your seat, pay online, get your e-ticket instantly.",
    href: "/search",
    cta: "Book Now",
    bg: "bg-blue-50", iconBg: "bg-[#2563EB]", ctaColor: "text-[#2563EB]", border: "border-blue-100",
  },
  {
    icon: Package,
    label: "Send Goods",
    desc: "Ship parcels anywhere across Nigeria with a unique waybill number. Track your package in real time, end to end.",
    href: "/send",
    cta: "Send Now",
    bg: "bg-emerald-50", iconBg: "bg-[#16A34A]", ctaColor: "text-[#16A34A]", border: "border-emerald-100",
  },
  {
    icon: Bus,
    label: "Charter a Vehicle",
    desc: "Need a full bus, SUV, or truck? Charter for group travel, corporate events, school trips, or bulk delivery.",
    href: "/charter",
    cta: "Get a Quote",
    bg: "bg-amber-50", iconBg: "bg-[#D97706]", ctaColor: "text-[#D97706]", border: "border-amber-100",
  },
];

const STEPS = [
  { num: "01", title: "Search",  desc: "Enter your route and travel date to browse available trips instantly." },
  { num: "02", title: "Select",  desc: "Choose your preferred vehicle and pick your exact seat from the seat map." },
  { num: "03", title: "Pay",     desc: "Pay securely with card, bank transfer, or USSD via Paystack." },
  { num: "04", title: "Travel",  desc: "Show your e-ticket at the park and enjoy your journey!" },
];

const TESTIMONIALS = [
  { name: "Chukwuemeka O.", location: "Lagos → Abuja",       text: "TransHub made my trip seamless. I booked my seat at midnight and got my ticket instantly. The driver even called ahead!", avatar: "C", color: "bg-[#2563EB]" },
  { name: "Fatima A.",       location: "Kano → Port Harcourt", text: "Sent goods to my sister in PH. The waybill tracking was spot on — I knew exactly where my package was at every step.", avatar: "F", color: "bg-[#16A34A]" },
  { name: "Tunde B.",        location: "Corporate Charter",   text: "We chartered a 33-seater for our company retreat. TransHub handled everything professionally. Will use again!", avatar: "T", color: "bg-[#D97706]" },
];

const FEATURES = [
  { icon: Lock,         title: "Secure Payments",      desc: "Powered by Paystack. All transactions encrypted and protected." },
  { icon: MapPin,       title: "Live Tracking",        desc: "Track your bus or package on a live map in real time." },
  { icon: Bus,          title: "All 36 States",        desc: "Covering every major interstate route across Nigeria." },
  { icon: Ticket,       title: "Instant E-Ticket",     desc: "Get your ticket by SMS and email immediately after booking." },
  { icon: Shield,       title: "OTP Security",         desc: "Every transaction protected by SMS OTP verification." },
  { icon: Clock,        title: "24/7 Support",         desc: "Our team is always available to help, day or night." },
];

const TRUST_BADGES = ["Secure Paystack Payments", "Instant E-Ticket", "Real-Time Tracking", "24/7 Support"];

export default function LandingPage() {
  return (
    <div className="bg-white text-[#0F172A]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
              <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
              Nigeria&apos;s #1 Interstate Transport Platform
            </span>
          </div>
          <h1 className="text-center text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-5">
            Move Smarter.<br />
            <span className="text-[#FCD34D]">Anywhere in Nigeria.</span>
          </h1>
          <p className="text-center text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Book bus and car seats, ship goods, or charter a vehicle — all on one platform, in minutes.
          </p>
          <SearchCard />
          <div className="flex flex-wrap justify-center gap-5 mt-8 text-sm text-blue-200">
            {TRUST_BADGES.map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#4ADE80]" /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-[#E2E8F0] bg-white py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E2E8F0]">
          {[
            { value: "50,000+", label: "Happy Travellers" },
            { value: "120+",    label: "Routes Covered"   },
            { value: "500+",    label: "Vehicles Available" },
            { value: "36",      label: "States Covered"   },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-2">
              <p className="text-3xl font-extrabold text-[#2563EB]">{s.value}</p>
              <p className="text-sm text-[#94A3B8] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">Everything transport,<br />one platform.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`group bg-white rounded-3xl border ${s.border} p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-14 h-14 ${s.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{s.label}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">{s.desc}</p>
                  <Link href={s.href} className={`inline-flex items-center gap-2 text-sm font-bold ${s.ctaColor} group-hover:gap-3 transition-all`}>
                    {s.cta} <ChevronRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">Book in 4 easy steps</h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[#2563EB] via-[#2563EB] to-[#16A34A]" />
            {STEPS.map((step, i) => (
              <div key={step.num} className="text-center relative">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-5 shadow-lg ${i === 3 ? "bg-[#16A34A] text-white" : "bg-[#2563EB] text-white"}`}>
                  {step.num}
                </div>
                <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACK BANNER */}
      <section className="py-16 px-4 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-8 md:p-12 text-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#2563EB]/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative text-center">
              <span className="inline-flex items-center gap-1.5 bg-[#2563EB]/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                <Search size={11} /> Live Tracking
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Track your package</h2>
              <p className="text-[#94A3B8] mb-8">Enter your waybill number to see real-time updates on your shipment.</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <input
                  type="text"
                  placeholder="e.g. TH-2024-00123"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-[#475569] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <Link href="/track" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
                  Track Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY TRANSHUB */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Why Choose Us</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">Built for Nigeria.<br />Trusted by thousands.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-4 p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#2563EB]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{f.title}</h4>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0] hover:shadow-xl transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-[#475569] text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.color} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-[#94A3B8]">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">Ready to travel smarter?</h2>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Join 50,000+ Nigerians already using TransHub to book seats, send goods, and charter vehicles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-white text-[#2563EB] px-10 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors text-base shadow-xl">
              Create Free Account
            </Link>
            <Link href="/search" className="border-2 border-white/60 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors text-base flex items-center gap-2 justify-center">
              Search Trips <ChevronRight size={18} />
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">No credit card required. Free to sign up.</p>
        </div>
      </section>
    </div>
  );
}
