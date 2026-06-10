"use client";
import { useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Ticket, ArrowRight, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize, formatDateLong, formatTime } from "@/lib/utils";
import AuthGuard from "@/components/shared/AuthGuard";
import { useServerList } from "@/hooks/useServerList";
import { fetchTickets } from "@/services/tickets";

function shortRef(ref) {
  if (!ref) return "—";
  return ref.length > 16 ? `${ref.slice(0, 16)}…` : ref;
}

function TicketsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse">
          <div className="flex justify-between mb-5">
            <div className="h-6 w-40 bg-[#F1F5F9] rounded" />
            <div className="h-6 w-20 bg-[#F1F5F9] rounded-full" />
          </div>
          <div className="h-4 w-56 bg-[#F1F5F9] rounded mb-3" />
          <div className="h-4 w-32 bg-[#F1F5F9] rounded" />
        </div>
      ))}
    </div>
  );
}

function TicketsContent() {
  const selectTickets = useCallback((res) => res.tickets ?? [], []);
  const {
    items: tickets, pagination, loading, error,
    page, setPage, searchInput, setSearchInput,
  } = useServerList({ fetcher: fetchTickets, select: selectTickets, limit: 10 });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">My Tickets</h1>
          <Button as={Link} href="/search" size="sm" rightIcon={<ArrowRight size={14} />}>Book New Trip</Button>
        </div>

        <div className="mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by route or payment reference…"
            className="w-full sm:w-80"
          />
        </div>

        {loading ? (
          <TicketsSkeleton />
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-[#0F172A]">{error}</p>
            <p className="text-sm text-[#94A3B8] mt-1">Please try again in a moment.</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-[#2563EB]" />
            </div>
            <p className="text-lg font-semibold text-[#0F172A]">You have no tickets yet.</p>
            <p className="text-sm text-[#94A3B8] mt-1 mb-6">Book a trip to see your tickets here.</p>
            <Button as={Link} href="/search">Search Trips</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t, i) => (
              <motion.div
                key={t.bookingId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-xl font-bold text-[#0F172A]">
                      {t.from} <span className="text-[#94A3B8] font-normal">→</span> {t.to}
                    </h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[t.status] ?? ""}`}>
                      {capitalize(t.status)}
                    </span>
                  </div>

                  <p className="text-sm text-[#64748B] mb-4">
                    {formatDateLong(t.departureTime)} · {formatTime(t.departureTime)}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm border-t border-dashed border-[#E2E8F0] pt-4">
                    <span className="flex items-center gap-1.5 text-[#94A3B8]">
                      <MapPin size={13} /> Seats
                      <strong className="text-[#0F172A]">{t.seatCount} (open seating)</strong>
                    </span>
                    <span className="text-[#94A3B8]">
                      Amount paid <strong className="text-[#16A34A]">₦{t.totalAmount.toLocaleString()}</strong>
                    </span>
                    <span className="text-xs text-[#94A3B8] font-mono">REF: {shortRef(t.paymentRef)}</span>
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
                  <Button as={Link} href={`/tickets/${t.bookingId}`} size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                    View Ticket
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
        )}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <AuthGuard>
      <TicketsContent />
    </AuthGuard>
  );
}
