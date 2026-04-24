"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useBookingStore from "@/store/bookingStore";
import Button from "@/components/ui/Button";

export default function BookingSuccessPage() {
  const { selectedTrip, selectedSeats, passengers, clearBooking } = useBookingStore();

  // Capture booking data on first render so cleanup can't erase it
  const [snapshot] = useState(() => ({
    ref: `TH-${Date.now().toString(36).toUpperCase()}`,
    trip: selectedTrip,
    seats: selectedSeats,
    passengers,
    total: selectedTrip ? selectedSeats.length * (selectedTrip.price ?? 0) : 0,
  }));

  // Clear store after capturing data (safe under React Strict Mode)
  useEffect(() => {
    return () => clearBooking();
  }, [clearBooking]);

  const { ref: bookingRef, trip: snapTrip, seats: snapSeats, total } = snapshot;
  // Use snapshot data — survives strict mode cleanup + remount
  const displayTrip = selectedTrip ?? snapTrip;
  const displaySeats = selectedSeats.length > 0 ? selectedSeats : snapSeats;
  const displayTotal = selectedTrip ? selectedSeats.length * (selectedTrip.price ?? 0) : total;

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 py-14">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your trip has been booked successfully. You&apos;ll receive a confirmation email shortly.
        </p>

        {/* Booking summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left mb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Booking Ref</span>
            <span className="text-sm font-bold text-blue-600 font-mono">{bookingRef}</span>
          </div>

          {displayTrip && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Route</span>
                <span className="font-semibold text-gray-900">{displayTrip.from} → {displayTrip.to}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Seats</span>
                <span className="font-semibold text-gray-900">
                  {displaySeats.map((s) => s.label).join(", ") || `${displaySeats.length} seat(s)`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Passengers</span>
                <span className="font-semibold text-gray-900">{snapshot.passengers.length || displaySeats.length}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-50">
                <span className="text-gray-500">Total Paid</span>
                <span className="text-lg font-bold text-green-600">₦{displayTotal.toLocaleString()}</span>
              </div>
            </>
          )}

          {!displayTrip && (
            <div className="text-center py-4 text-gray-400 text-sm">
              <p>Booking details are no longer available.</p>
            </div>
          )}
        </div>

        {/* Next steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 text-left">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Next Steps</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              Confirmation email sent to your inbox
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              Show your ticket at the boarding gate
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              Arrive at the terminal 30 mins before departure
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tickets">
            <Button>View My Tickets</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
