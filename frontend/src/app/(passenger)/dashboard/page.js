"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ticket, Package, Bus, Search, ArrowRight, MapPin,
  Clock, CheckCircle2, DollarSign,
} from "lucide-react";
import AuthGuard from "@/components/shared/AuthGuard";
import useAuthStore from "@/store/authStore";
import StatCard from "@/components/ui/StatCard";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatDateLong, formatTime, getErrorMessage } from "@/lib/utils";
import { fetchTickets } from "@/services/tickets";

const QUICK_ACTIONS = [
  { icon: Search,  label: "Book a Trip",   href: "/search",  bg: "bg-[#EFF6FF]", iconColor: "text-[#2563EB]", border: "border-[#BFDBFE]" },
  { icon: Package, label: "Send Goods",    href: "/send",    bg: "bg-[#F0FDF4]", iconColor: "text-[#16A34A]", border: "border-[#BBF7D0]" },
  { icon: Bus,     label: "Charter",       href: "/charter", bg: "bg-[#FFFBEB]", iconColor: "text-[#D97706]", border: "border-[#FDE68A]" },
  { icon: MapPin,  label: "Track Package", href: "/track",   bg: "bg-[#F8FAFC]", iconColor: "text-[#475569]", border: "border-[#E2E8F0]" },
];

function PassengerDashboard({ user }) {
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  // Real data — the passenger's confirmed tickets drive every stat below.
  // No mock numbers: a brand-new user correctly sees zeros and an empty list.
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  // Captured once at mount so the render stays pure (React Compiler forbids
  // calling Date.now() during render). "Upcoming vs completed" is split on this.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    fetchTickets()
      .then((res) => { if (active) setTickets(res.tickets); })
      .catch((err) => { if (active) setError(getErrorMessage(err, "Could not load your trips.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const upcoming   = tickets.filter((t) => new Date(t.departureTime).getTime() >= now).length;
  const completed  = tickets.length - upcoming;
  const totalSpent = tickets.reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);

  const stats = [
    { label: "Total Trips", value: String(tickets.length),           icon: Bus,          bg: "bg-blue-50",   color: "text-[#2563EB]" },
    { label: "Upcoming",    value: String(upcoming),                 icon: Clock,        bg: "bg-amber-50",  color: "text-[#D97706]" },
    { label: "Completed",   value: String(completed),                icon: CheckCircle2, bg: "bg-green-50",  color: "text-[#16A34A]" },
    { label: "Total Spent", value: `₦${totalSpent.toLocaleString()}`, icon: DollarSign,  bg: "bg-blue-50", color: "text-[#0A1B3D]" },
  ];

  const recent = tickets.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Hello, {firstName}</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Welcome to your TransHub dashboard</p>
          </div>
          <Link href="/search" className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Search size={15} /> Book New Trip
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl h-26 animate-pulse" />
              ))
            : stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <StatCard icon={<s.icon size={20} />} label={s.label} value={s.value} bg={s.bg} color={s.color} />
                </motion.div>
              ))}
        </div>

        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#0F172A] mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.label} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link href={a.href} className={`flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border ${a.border} ${a.bg} hover:shadow-sm transition-shadow text-center`}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Icon size={20} className={a.iconColor} />
                    </div>
                    <span className={`text-sm font-semibold ${a.iconColor}`}>{a.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <h2 className="font-semibold text-[#0F172A]">Recent Tickets</h2>
            <div className="flex items-center gap-4">
              <Link href="/payments" className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-1">
                Payment history
              </Link>
              <Link href="/tickets" className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-[#F1F5F9]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-9 h-9 bg-[#F1F5F9] rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-[#F1F5F9] rounded mb-2" />
                    <div className="h-3 w-28 bg-[#F1F5F9] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-sm text-[#94A3B8]">{error}</div>
          ) : recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket size={22} className="text-[#2563EB]" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">No tickets yet</p>
              <p className="text-xs text-[#94A3B8] mt-1 mb-4">Book your first trip to see it here.</p>
              <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline">
                Search Trips <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recent.map((t) => (
                <Link key={t.bookingId} href={`/tickets/${t.bookingId}`} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                      <Bus size={16} className="text-[#2563EB]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{t.from} → {t.to}</p>
                      <p className="text-xs text-[#94A3B8]">
                        {formatDateLong(t.departureTime)} · {formatTime(t.departureTime)} · {t.seatCount} seat{t.seatCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[t.status] ?? ""}`}>
                      {capitalize(t.status)}
                    </span>
                    <span className="text-sm font-bold text-[#2563EB]">₦{t.totalAmount.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <AuthGuard>
      <PassengerDashboard user={user} />
    </AuthGuard>
  );
}
