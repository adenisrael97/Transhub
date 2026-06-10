"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Ticket, MapPin, Users, Clock, ShieldCheck, Loader2, Hash } from "lucide-react";
import useBookingStore from "@/store/bookingStore";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { fetchBooking } from "@/services/bookings";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  // bookingId is present when arriving via Paystack callback (Zustand state is
  // cleared by then), so it's the authoritative way to load the real booking.
  const bookingIdFromUrl = searchParams.get("bookingId");

  const { selectedTrip, quantity, passengers, clearBooking } = useBookingStore();

  // Snapshot the store ONCE so the clearBooking() cleanup can't blank the view.
  const [snapshot] = useState(() => ({
    ref: bookingIdFromUrl ?? null,
    trip: selectedTrip,
    quantity,
    passengers,
    total: selectedTrip ? quantity * (selectedTrip.price ?? 0) : 0,
  }));

  // Fetch the confirmed booking by id (callback path) so we can show real
  // route / seats / amount / transaction reference / status instead of relying
  // on client state that was already cleared during verification.
  const [booking, setBooking]               = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(Boolean(bookingIdFromUrl));

  useEffect(() => {
    if (!bookingIdFromUrl) return;
    let active = true;
    fetchBooking(bookingIdFromUrl)
      .then((res) => { if (active) setBooking(res.booking); })
      .catch(() => { /* fall back to the store snapshot below */ })
      .finally(() => { if (active) setLoadingBooking(false); });
    return () => { active = false; };
  }, [bookingIdFromUrl]);

  useEffect(() => {
    let confetti;
    import("canvas-confetti").then((mod) => {
      confetti = mod.default;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ["#2563EB", "#16A34A", "#D97706", "#ffffff"] });
    }).catch(() => {});
    return () => clearBooking();
  }, [clearBooking]);

  const bookingRef = booking?.id ?? snapshot.ref;

  // Unified view: prefer the fetched booking, fall back to the store snapshot.
  const view = booking
    ? {
        from:          booking.trip?.from,
        to:            booking.trip?.to,
        departureTime: booking.trip?.departureTime,
        operator:      booking.trip?.operator ?? "",
        seats:         booking.seats?.length ?? snapshot.quantity,
        passengers:    booking.passengers?.length || (booking.seats?.length ?? snapshot.quantity),
        total:         booking.totalAmount,
        txRef:         booking.paymentRef,
        status:        booking.status,
      }
    : snapshot.trip
    ? {
        from:          snapshot.trip.from,
        to:            snapshot.trip.to,
        departureTime: snapshot.trip.departureTime,
        operator:      snapshot.trip.operator ?? "",
        seats:         snapshot.quantity,
        passengers:    snapshot.passengers.length || snapshot.quantity,
        total:         snapshot.total,
        txRef:         null,
        status:        "confirmed",
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-14">
      <div className="max-w-md w-full">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={40} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Booking Confirmed!</h1>
          <p className="text-sm text-[#94A3B8] text-center">
            Your trip has been booked successfully. Check your email for confirmation.
          </p>
        </motion.div>

        {/* Booking card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mb-4"
        >
          {/* Booking ref header */}
          <div className="bg-[#EFF6FF] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-[#2563EB]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Booking Reference</span>
            </div>
            <span className="text-sm font-bold text-[#0F172A] font-mono">
              {bookingRef ?? "See My Tickets"}
            </span>
          </div>

          {/* Ticket body */}
          {loadingBooking ? (
            <div className="px-6 py-10 flex flex-col items-center gap-3 text-sm text-[#94A3B8]">
              <Loader2 size={22} className="text-[#2563EB] animate-spin" />
              Loading booking details…
            </div>
          ) : view ? (
            <div className="px-6 py-5 space-y-4">
              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{view.from}</p>
                  {view.departureTime && (
                    <p className="text-xs text-[#94A3B8]">{formatTime(view.departureTime)}</p>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                  <ArrowRight size={14} className="text-[#2563EB] shrink-0" />
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{view.to}</p>
                  <p className="text-xs text-[#94A3B8]">{view.operator}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-[#E2E8F0] pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8]"><MapPin size={13} /> Seats</span>
                  <span className="font-semibold text-[#0F172A]">{view.seats} (open seating)</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8]"><Users size={13} /> Passengers</span>
                  <span className="font-semibold text-[#0F172A]">{view.passengers}</span>
                </div>
                {view.txRef && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-[#94A3B8]"><Hash size={13} /> Transaction Ref</span>
                    <span className="font-mono text-xs text-[#475569] truncate max-w-44">{view.txRef}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-[#94A3B8]"><CheckCircle2 size={13} /> Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] capitalize">
                    {view.status}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#F1F5F9]">
                  <span className="font-semibold text-[#0F172A]">Total Paid</span>
                  <span className="text-base font-bold text-[#16A34A]">₦{Number(view.total ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-[#94A3B8]">
              Your payment was confirmed. View the full details in{" "}
              <Link href="/tickets" className="text-[#2563EB] underline">My Tickets</Link>.
            </div>
          )}
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] px-6 py-5 mb-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Next Steps</p>
          <ul className="space-y-2.5 text-sm text-[#475569]">
            {[
              [CheckCircle2, "Confirmation email sent to your inbox", "#16A34A"],
              [Clock,        "Arrive at the terminal 30 mins before departure", "#2563EB"],
              [Ticket,       "Show your e-ticket at the boarding gate", "#2563EB"],
            ].map(([Icon, text, color], i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Icon size={15} style={{ color }} className="shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            as={Link}
            href={bookingRef ? `/tickets/${bookingRef}` : "/tickets"}
            fullWidth
            size="lg"
            rightIcon={<ArrowRight size={16} />}
            className="flex-1"
          >
            View My Ticket
          </Button>
          <Button as={Link} href="/search" fullWidth size="lg" variant="secondary" className="flex-1">
            Book Another Trip
          </Button>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-[#94A3B8] justify-center mt-5">
          <ShieldCheck size={13} className="text-[#16A34A]" />
          Secured by Paystack
        </div>
      </div>
    </div>
  );
}
