"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import useBookingStore from "@/store/bookingStore";
import useFleetStore from "@/store/fleetStore";
import SeatMap from "@/components/booking/SeatMap";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";

/**
 * Generate mock seat data for a bus layout.
 * Used as a fallback when the backend is not connected.
 */
function mockSeats(count = 18) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    label: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
    isBooked: [2, 5, 9, 13].includes(i),
  }));
}

export default function TripDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { trip, loading, fetchTrip } = useTrips();
  const { selectedSeats, setTrip } = useBookingStore();
  const fleetTrips = useFleetStore((state) => state.trips);

  // Use backend data first, then fall back to fleet store trip by ID
  const fallbackTrip = fleetTrips.find((t) => t.id === id) ?? null;
  const displayTrip = trip ?? (fallbackTrip ? { ...fallbackTrip, seats: mockSeats(fallbackTrip.totalSeats ?? 18) } : null);
  const prevTripIdRef = useRef(null);

  useEffect(() => {
    fetchTrip(id).catch(() => {}); // graceful fail — shows mock
  }, [id, fetchTrip]);

  // Sync to booking store only when the trip actually changes
  useEffect(() => {
    const tripId = displayTrip?.id;
    if (tripId && tripId !== prevTripIdRef.current) {
      prevTripIdRef.current = tripId;
      setTrip(displayTrip);
    }
  }, [displayTrip, setTrip]);

  const total = selectedSeats.length * (displayTrip?.price ?? 0);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading trip…</div>
        ) : !displayTrip ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🚌</p>
            <p className="text-lg font-medium">Trip not found</p>
            <p className="text-sm mt-2">This trip may no longer be available.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Seat map */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {displayTrip.from} → {displayTrip.to}
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                {displayTrip.operator} · {displayTrip.vehicleType} · Departs {formatTime(displayTrip.departureTime)}
              </p>
              <SeatMap seats={displayTrip.seats ?? mockSeats()} />
            </div>

            {/* Summary panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Trip Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Route</span>
                    <span className="font-medium">{displayTrip.from} → {displayTrip.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Departure</span>
                    <span className="font-medium">{formatTime(displayTrip.departureTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price/seat</span>
                    <span className="font-medium">₦{displayTrip.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seats selected</span>
                    <span className="font-medium">{selectedSeats.length}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-blue-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                disabled={selectedSeats.length === 0}
                onClick={() => router.push("/checkout")}
              >
                Continue to Checkout
              </Button>

              {selectedSeats.length === 0 && (
                <p className="text-xs text-center text-gray-400">Select at least one seat to continue</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
