"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bus, ArrowRight, Clock, ShieldCheck, Minus, Plus, Users, MapPin, Wifi, Zap } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import useBookingStore from "@/store/bookingStore";
import useToastStore from "@/store/toastStore";
import Button from "@/components/ui/Button";
import { holdSeats } from "@/services/bookings";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { formatTime, getErrorMessage } from "@/lib/utils";

const MAX_PER_BOOKING = 6;

export default function TripDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const toast   = useToastStore();

  const { trip, loading, error, fetchTrip } = useTrips();
  const { quantity, setQuantity, setTrip, setHold } = useBookingStore();

  const [holding, setHolding] = useState(false);
  // Real-time patch from socket: overrides isFull / offlineCount without a full re-fetch
  const [capacityOverride, setCapacityOverride] = useState(null);

  const displayTrip    = capacityOverride
    ? { ...trip, ...capacityOverride }
    : trip;
  const prevTripIdRef  = useRef(null);

  useEffect(() => {
    fetchTrip(id).catch(() => {});
  }, [id, fetchTrip]);

  // Clear the socket override when the base trip changes (page navigate or re-fetch)
  useEffect(() => {
    const tripId = displayTrip?.id;
    if (tripId && tripId !== prevTripIdRef.current) {
      prevTripIdRef.current = tripId;
      setCapacityOverride(null);
      setTrip(displayTrip); // resets quantity to 1
    }
  }, [trip, setTrip]); // intentional: use `trip` (not displayTrip) to avoid override loop

  // Subscribe to real-time capacity updates for this trip
  useEffect(() => {
    if (!id) return;
    const socket = connectSocket();

    const onCapacityChanged = (payload) => {
      if (payload.tripId === id) {
        setCapacityOverride({ isFull: payload.isFull, offlineCount: payload.offlineCount });
      }
    };

    // socket.io fires "connect" on the initial connection AND on every reconnect.
    // Any capacity change that happened while the socket was down was missed, so
    // re-subscribe to the room AND re-fetch the trip over HTTP to resync the
    // authoritative seat count — otherwise a passenger could see stale availability
    // (e.g. seats left) for a bus that filled during the gap.
    const onConnect = () => {
      socket.emit("trip:subscribe", id);
      fetchTrip(id).catch(() => {});
    };

    socket.on("connect", onConnect);
    socket.on("trip:capacityChanged", onCapacityChanged);
    // Cover the case where the socket is already connected when this effect runs
    // (connect won't fire again), so the initial subscribe still happens.
    if (socket.connected) socket.emit("trip:subscribe", id);

    return () => {
      socket.emit("trip:unsubscribe", id);
      socket.off("trip:capacityChanged", onCapacityChanged);
      socket.off("connect", onConnect);
    };
  }, [id, fetchTrip]);

  const availableSeats = displayTrip?.availableSeats ?? 0;
  const blocked        = displayTrip?.isFull || availableSeats === 0;
  const maxSeats       = Math.min(MAX_PER_BOOKING, availableSeats);
  const total          = quantity * (displayTrip?.price ?? 0);

  const dec = () => setQuantity(Math.max(1, quantity - 1));
  const inc = () => setQuantity(Math.min(maxSeats, quantity + 1));

  async function handleContinue() {
    if (!displayTrip || blocked || quantity < 1) return;
    setHolding(true);
    try {
      const hold = await holdSeats(displayTrip.id, quantity);
      setHold(hold.holdId, hold.ttlSeconds);
      router.push("/checkout");
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        // Backend now returns a structured code so we can show targeted copy
        // instead of string-matching the message.
        const code = err?.error?.code ?? err?.response?.data?.error?.code;
        const messages = {
          TRIP_FULL:         "This trip has been marked full by the operator.",
          INSUFFICIENT_SEATS:"Seats just sold out. Please reduce the number or pick another bus.",
          TRIP_UNAVAILABLE:  "This trip is no longer available for booking.",
        };
        toast.error(messages[code] ?? "Seats just sold out. Please reduce the number or pick another bus.");
        // Re-fetch so the seats-left count reflects the latest availability
        fetchTrip(id).catch(() => {});
      } else if (status === 401) {
        router.push(`/auth/login?redirect=/trips/${id}`);
      } else {
        toast.error(getErrorMessage(err, "Could not reserve seats. Please try again."));
      }
    } finally {
      setHolding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading trip…</p>
        </div>
      </div>
    );
  }

  if (error || !displayTrip) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus size={28} className="text-[#64748B]" />
          </div>
          <p className="text-lg font-semibold text-[#0F172A]">Trip not found</p>
          <p className="text-sm text-[#64748B] mt-1">This trip may no longer be available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Booking panel */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  {displayTrip.from}
                  <ArrowRight size={16} className="text-[#64748B]" />
                  {displayTrip.to}
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  {displayTrip.operator} · {displayTrip.vehicleType}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-xl shrink-0">
                <Clock size={14} /> {formatTime(displayTrip.departureTime)}
              </div>
            </div>

            <div className={`flex items-center gap-1.5 text-sm font-semibold mb-4 ${blocked ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
              <Users size={15} />
              {blocked
                ? displayTrip.isFull ? "Bus is full" : "Sold out"
                : `${availableSeats} seat${availableSeats !== 1 ? "s" : ""} available`}
            </div>

            {/* Park / Terminal */}
            {displayTrip.parkName && (
              <div className="flex items-center gap-2 text-sm text-[#64748B] bg-[#F8FAFC] rounded-xl px-4 py-2.5 mb-4">
                <MapPin size={14} className="text-[#2563EB] shrink-0" />
                <span><span className="font-medium text-[#0F172A]">Departure Park:</span> {displayTrip.parkName}</span>
              </div>
            )}

            {/* Amenities */}
            {displayTrip.amenities?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Bus Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {displayTrip.amenities.map((a) => (
                    <span key={a} className="text-xs font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-1 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity stepper */}
            <div className="border border-[#E2E8F0] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#0F172A] mb-1">How many seats?</p>
              <p className="text-xs text-[#64748B] mb-5">
                Seating is open — the operator assigns seats at boarding. Up to {MAX_PER_BOOKING} per booking.
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={dec}
                  disabled={blocked || quantity <= 1}
                  aria-label="Decrease seats"
                  className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="text-3xl font-bold text-[#0F172A] w-12 text-center tabular-nums">
                  {blocked ? 0 : quantity}
                </span>
                <button
                  type="button"
                  onClick={inc}
                  disabled={blocked || quantity >= maxSeats}
                  aria-label="Increase seats"
                  className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Summary panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-4">Trip Summary</h2>
              <div className="space-y-3 text-sm">
                {[
                  ["Route",         `${displayTrip.from} → ${displayTrip.to}`],
                  ["Departure",     formatTime(displayTrip.departureTime)],
                  ...(displayTrip.parkName ? [["Park", displayTrip.parkName]] : []),
                  ["Price / seat",  `₦${displayTrip.price?.toLocaleString()}`],
                  ["Seats",         blocked ? "—" : String(quantity)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-[#64748B] shrink-0">{label}</span>
                    <span className="font-medium text-[#0F172A] text-right truncate">{value}</span>
                  </div>
                ))}
                <div className="border-t border-[#F1F5F9] pt-3 flex justify-between font-bold text-base">
                  <span className="text-[#0F172A]">Total</span>
                  <span className="text-[#2563EB]">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              loading={holding}
              disabled={blocked || holding}
              onClick={handleContinue}
            >
              {holding ? "Reserving seats…" : blocked ? "Not Available" : "Continue to Checkout"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-[#64748B] justify-center">
              <ShieldCheck size={13} className="text-[#16A34A]" />
              Seats reserved for 10 minutes during checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
