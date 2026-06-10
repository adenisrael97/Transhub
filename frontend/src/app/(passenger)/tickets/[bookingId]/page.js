"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft, Printer, Loader2, Ticket } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatTime, formatDateShort, formatDateTime, getErrorMessage } from "@/lib/utils";
import AuthGuard from "@/components/shared/AuthGuard";
import { fetchTicket } from "@/services/tickets";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-xs font-bold uppercase tracking-widest text-[#475569] shrink-0">{label}</span>
      <span className="text-sm font-semibold text-[#0F172A] text-right">{value}</span>
    </div>
  );
}

function TicketContent({ bookingId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Warm the page-document cache so an offline refresh still loads this ticket
  // even when the passenger arrived via client-side navigation (no document
  // request happens then, so the SW would otherwise have nothing to serve).
  useEffect(() => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const path = window.location.pathname;
    fetch(path, { credentials: "same-origin" })
      .then((res) => (res.ok ? caches.open("tickets-detail").then((c) => c.put(path, res.clone())) : null))
      .catch(() => {});
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    fetchTicket(bookingId)
      .then((res) => {
        if (active) setTicket(res.ticket);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Ticket not found"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="text-[#2563EB] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">Loading your ticket…</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={26} className="text-[#94A3B8]" />
          </div>
          <p className="text-lg font-semibold text-[#0F172A] mb-1">Ticket not found</p>
          <p className="text-sm text-[#94A3B8] mb-6">This ticket doesn&apos;t exist or isn&apos;t yours.</p>
          <Button as={Link} href="/tickets" variant="outline" leftIcon={<ArrowLeft size={15} />}>My Tickets</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 print:py-0 print:bg-white">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="ticket-card bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
        >
          {/* Brand + status */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
            <span className="text-lg font-bold text-white tracking-tight">TransHub</span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#15803D] bg-white px-3 py-1 rounded-full">
              <CheckCircle2 size={13} /> Confirmed
            </span>
          </div>

          {/* Route */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="min-w-16">
                <p className="text-2xl font-bold text-[#0F172A] leading-tight">{ticket.from}</p>
                <p className="text-sm text-[#64748B] mt-0.5">{formatTime(ticket.departureTime)}</p>
              </div>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="h-px flex-1 bg-[#E2E8F0]" />
                <ArrowRight size={16} className="text-[#2563EB] shrink-0" />
                <div className="h-px flex-1 bg-[#E2E8F0]" />
              </div>
              <div className="min-w-16 text-right">
                <p className="text-2xl font-bold text-[#0F172A] leading-tight">{ticket.to}</p>
                {ticket.arrivalTime && (
                  <p className="text-sm text-[#64748B] mt-0.5">{formatTime(ticket.arrivalTime)}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-[#64748B] mt-3">{formatDateShort(ticket.departureTime)}</p>
          </div>

          <div className="border-t border-dashed border-[#E2E8F0]" />

          {/* Passenger + trip details */}
          <div className="px-6 py-3 divide-y divide-[#F1F5F9]">
            <DetailRow label="Passenger" value={ticket.passengerName} />
            <DetailRow label="Phone" value={ticket.passengerPhone} />
            <DetailRow label="Operator" value={ticket.operator} />
            <DetailRow label="Vehicle" value={ticket.vehicleType} />
            <DetailRow label="Seats" value={`${ticket.seatCount} (open seating)`} />
          </div>

          <div className="border-t border-dashed border-[#E2E8F0]" />

          {/* Booking + payment */}
          <div className="px-6 py-3 divide-y divide-[#F1F5F9]">
            <DetailRow label="Booking Ref" value={<span className="font-mono">{ticket.paymentRef}</span>} />
            <DetailRow label="Amount Paid" value={<span className="text-[#15803D]">₦{ticket.totalAmount.toLocaleString()}</span>} />
            <DetailRow label="Booked On" value={formatDateTime(ticket.bookedAt)} />
          </div>
        </motion.div>

        {/* Actions — hidden when printing */}
        <div className="no-print flex items-center justify-between mt-6">
          <Link href="/tickets" className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline">
            <ArrowLeft size={15} /> My Tickets
          </Link>
          <Button variant="outline" leftIcon={<Printer size={15} />} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { bookingId } = useParams();
  // Key by bookingId so navigating between tickets remounts with fresh state
  // (avoids flashing the previous ticket) without setState-in-effect.
  return (
    <AuthGuard>
      <TicketContent key={bookingId} bookingId={bookingId} />
    </AuthGuard>
  );
}
