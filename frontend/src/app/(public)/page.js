import Link from "next/link";
import Image from "next/image";
import {
  Ticket, Package, Bus, Star, ShieldCheck, Zap, Heart, Sparkles,
  Search, MousePointerClick, CreditCard, MapPin, ArrowRight, ChevronRight,
  CheckCircle2,
} from "lucide-react";
import SearchCard from "@/components/shared/SearchCard";
import StatsSlider from "@/components/landing/StatsSlider";
import RoutesCarousel from "@/components/landing/RoutesCarousel";
import Testimonials from "@/components/landing/Testimonials";

export const metadata = {
  title: "TransHub — Nigeria's #1 Interstate E-Ticketing Platform",
  description:
    "Book bus & car seats, send goods via waybill, and charter vehicles across Nigeria. Fast, secure, and reliable interstate travel and logistics.",
};

const SERVICES = [
  {
    img: "/Services/bus ticket.jpg",
    label: "Book a Seat",
    desc: "Search and reserve interstate bus or car seats in seconds. Pick your seat, pay online, get your e-ticket instantly.",
    href: "/search",
    cta: "Book Now",
    accent: "text-[#1D4ED8]",
  },
  {
    img: "/Services/waybill.jpg",
    label: "Send Goods",
    desc: "Ship parcels anywhere across Nigeria with a unique waybill number. Track your package in real time, end to end.",
    href: "/send",
    cta: "Send Now",
    accent: "text-[#16A34A]",
  },
  {
    img: "/Services/charter.jpg",
    label: "Charter a Vehicle",
    desc: "Need a full bus, SUV, or truck? Charter for group travel, corporate events, school trips, or bulk delivery.",
    href: "/charter",
    cta: "Get a Quote",
    accent: "text-[#D97706]",
  },
];

const WHY = [
  {
    icon: ShieldCheck,
    title: "Secure & Trusted",
    desc: "Bank-grade Paystack payments, SMS OTP, and encrypted data on every single transaction.",
    gradient: "from-[#1D4ED8] to-[#0A1B3D]",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Book a seat or send a parcel in under two minutes. Instant e-tickets by SMS and email.",
    gradient: "from-[#0EA5E9] to-[#1D4ED8]",
  },
  {
    icon: Heart,
    title: "Safe Travels",
    desc: "Verified operators, real-time live tracking, and 24/7 support so you always travel with peace of mind.",
    gradient: "from-[#059669] to-[#047857]",
  },
  {
    icon: Sparkles,
    title: "Total Convenience",
    desc: "One platform for seats, goods, and charters — across all 36 states. Book anytime, from anywhere.",
    gradient: "from-[#EA580C] to-[#B45309]",
  },
];

const PARTNERS = [
  {
    img: "/join/partner.jpg",
    eyebrow: "For Businesses",
    title: "Partner With Us",
    desc: "List your services, reach thousands of travellers daily, and grow your business on Nigeria's fastest-growing transport platform.",
    href: "/contact",
    cta: "Partner With Us",
  },
  {
    img: "/join/operator.jpg",
    eyebrow: "For Fleet Owners",
    title: "Become an Operator",
    desc: "Put your buses and cars to work. Manage trips, sell seats online, and get paid instantly with the TransHub operator portal.",
    href: "/register-operator",
    cta: "Become an Operator",
  },
];

const STEPS = [
  { icon: Search,             num: "01", title: "Search", desc: "Enter your route and travel date to browse available trips instantly." },
  { icon: MousePointerClick,  num: "02", title: "Select", desc: "Choose your preferred vehicle and pick your exact seat from the seat map." },
  { icon: CreditCard,         num: "03", title: "Pay",    desc: "Pay securely with card, bank transfer, or USSD via Paystack." },
  { icon: MapPin,             num: "04", title: "Travel", desc: "Show your e-ticket at the park and enjoy your journey!" },
];

const TRUST_BADGES = ["Secure Paystack Payments", "Instant E-Ticket", "Real-Time Tracking", "24/7 Support"];

export default function LandingPage() {
  return (
    <div className="bg-white text-[#0A1B3D]">

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-[#0A1B3D]">
        {/* Background bus photo. Kept clearly visible under a cinematic deep-blue /
            navy gradient (darker at the edges, lighter in the middle) so the bus
            reads through while white headline text stays legible. */}
        <Image
          src="/Bus/40602834137803287.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Diagonal navy → deep-blue wash for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1B3D]/90 via-[#0A1B3D]/55 to-[#1D4ED8]/75" />
        {/* Vertical scrim: anchors the headline/search-card area for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1B3D]/70 via-transparent to-[#0A1B3D]/85" />

        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-20 sm:px-6 lg:px-8 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FBBF24]" />
              Nigeria&apos;s #1 Interstate Transport Platform
            </span>
            <h1 className="mb-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl">
              Move Smarter.
              <br />
              <span className="text-[#FBBF24]">Anywhere in Nigeria.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100 md:text-xl">
              Book bus and car seats, ship goods, or charter a vehicle — all on one
              platform, in minutes.
            </p>
          </div>

          <SearchCard />

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-blue-100">
            {TRUST_BADGES.map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#4ADE80]" /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STATS (auto-sliding cards) ===================== */}
      <StatsSlider />

      {/* ===================== SERVICES ===================== */}
      <section className="bg-[#F8FAFC] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
              What We Offer
            </span>
            <h2 className="text-4xl font-extrabold md:text-5xl">
              Everything transport,
              <br />
              one platform.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.label}
                className="group overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={s.img}
                    alt={s.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <h3 className="mb-3 text-xl font-bold">{s.label}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-[#64748B]">{s.desc}</p>
                  <Link
                    href={s.href}
                    className={`inline-flex items-center gap-2 text-sm font-bold ${s.accent} transition-all group-hover:gap-3`}
                  >
                    {s.cta} <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== POPULAR ROUTES (carousel) ===================== */}
      <RoutesCarousel />

      {/* ===================== WHY CHOOSE US (gradient cards) ===================== */}
      <section className="bg-[#F8FAFC] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
              Why Choose Us
            </span>
            <h2 className="text-4xl font-extrabold md:text-5xl">
              Built for Nigeria.
              <br />
              Trusted by thousands.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${f.gradient} p-7 text-white shadow-lg transition-transform duration-300 hover:-translate-y-1.5`}
                >
                  <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-white/85">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== PARTNER ===================== */}
      <section className="bg-white py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
              Grow With Us
            </span>
            <h2 className="text-4xl font-extrabold md:text-5xl">Join the TransHub network</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {PARTNERS.map((p) => (
              <div
                key={p.title}
                className="group relative overflow-hidden rounded-3xl shadow-lg"
              >
                <div className="relative h-80 w-full">
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1B3D] via-[#0A1B3D]/70 to-[#0A1B3D]/20" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    {p.eyebrow}
                  </span>
                  <h3 className="mb-2 mt-2 text-2xl font-bold">{p.title}</h3>
                  <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/85">{p.desc}</p>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#0A1B3D] transition-transform hover:scale-[1.03]"
                  >
                    {p.cta} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW TO BOOK ===================== */}
      <section className="bg-[#F8FAFC] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
              Simple Process
            </span>
            <h2 className="text-4xl font-extrabold md:text-5xl">Book in 4 easy steps</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative rounded-3xl border border-[#E2E8F0] bg-white p-7 transition-shadow hover:shadow-lg"
                >
                  <span className="absolute right-6 top-5 text-4xl font-extrabold text-[#EFF2F7]">
                    {step.num}
                  </span>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white shadow-lg shadow-blue-500/25">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS (carousel) ===================== */}
      <Testimonials />

      {/* ===================== CLOSING CTA ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#1E40AF] to-[#0A1B3D] px-4 py-24 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="mb-5 text-4xl font-extrabold leading-tight md:text-5xl">
            Ready to travel smarter?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-blue-100">
            Join 50,000+ Nigerians already using TransHub to book seats, send goods,
            and charter vehicles.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="rounded-2xl bg-white px-10 py-4 text-base font-bold text-[#1D4ED8] shadow-xl transition-colors hover:bg-blue-50"
            >
              Create Free Account
            </Link>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/60 px-10 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Search Trips <ChevronRight size={18} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card required. Free to sign up.</p>
        </div>
      </section>

      {/* ===================== WHATSAPP FLOAT ===================== */}
      <a
        href="https://wa.me/2348054029416"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-green-500/40 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
