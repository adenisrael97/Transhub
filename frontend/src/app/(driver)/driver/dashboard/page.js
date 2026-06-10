"use client";

import { useState, useEffect, useCallback } from "react";
import { Bus, Check, Users, Phone, Heart, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import useToastStore from "@/store/toastStore";
import { fetchDriverTrips, markTripFull, setTripOfflineCount, fetchTripPassengers } from "@/services/trips";

export default function DriverDashboardPage() {
  const toast = useToastStore();

  const [trips, setTrips]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [fulling, setFulling]           = useState(null);
  const [offlineInputs, setOfflineInputs] = useState({});
  const [savingOffline, setSavingOffline] = useState(null);

  // Passenger list per trip: { [tripId]: { loading, data, error } }
  const [paxState, setPaxState] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // The backend already scopes this to today's boarding-relevant window using
      // the SERVER clock, so we trust its list rather than re-filtering against the
      // driver's (possibly skewed) device clock.
      const res = await fetchDriverTrips();
      setTrips(res.trips ?? []);
    } catch {
      setError("Failed to load trips. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMarkFull(trip) {
    setFulling(trip.id);
    try {
      const { trip: updated } = await markTripFull(trip.id, !trip.isFull);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      toast.success(updated.isFull ? "Bus marked as full" : "Bus reopened for booking");
    } catch (err) {
      toast.error(err?.error?.message || "Failed to update trip.");
    } finally {
      setFulling(null);
    }
  }

  async function handleOfflineSave(trip) {
    const raw = offlineInputs[trip.id];
    const val = parseInt(raw ?? String(trip.offlineCount ?? 0), 10);
    if (isNaN(val) || val < 0) return;
    setSavingOffline(trip.id);
    try {
      const { trip: updated } = await setTripOfflineCount(trip.id, val);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setOfflineInputs((prev) => { const n = { ...prev }; delete n[trip.id]; return n; });
      toast.success("Walk-in count saved");
    } catch (err) {
      toast.error(err?.error?.message || "Failed to save walk-in count.");
    } finally {
      setSavingOffline(null);
    }
  }

  async function togglePassengers(tripId) {
    const current = paxState[tripId];

    // If already loaded or loading, just toggle visibility
    if (current?.data || current?.loading) {
      setPaxState((prev) => ({
        ...prev,
        [tripId]: { ...prev[tripId], open: !prev[tripId]?.open },
      }));
      return;
    }

    // Load for first time
    setPaxState((prev) => ({ ...prev, [tripId]: { loading: true, open: true, data: null, error: null } }));
    try {
      const res = await fetchTripPassengers(tripId);
      setPaxState((prev) => ({
        ...prev,
        [tripId]: { loading: false, open: true, data: res.passengers ?? [], error: null },
      }));
    } catch {
      setPaxState((prev) => ({
        ...prev,
        [tripId]: { loading: false, open: true, data: null, error: "Failed to load passengers." },
      }));
    }
  }

  // Flatten all passengers from all bookings for a trip
  function getPassengerRows(tripId) {
    const bookings = paxState[tripId]?.data ?? [];
    return bookings.flatMap((b) =>
      (b.passengers ?? []).map((p, i) => ({ ...p, bookingId: b.bookingId, seatNum: i + 1 }))
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#0F172A]">Today&apos;s Trips</h1>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm text-[#2563EB] font-medium disabled:opacity-40"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && trips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-[#94A3B8] py-16">
          <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading trips…</p>
        </div>
      ) : !error && trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bus size={24} className="text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#94A3B8]">No trips scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const available = trip.availableSeats ?? 0;
            const booked    = (trip.totalSeats ?? 0) - available;
            const blocked   = trip.isFull || available === 0;
            const pendingOffline = offlineInputs[trip.id] !== undefined;
            const pax = paxState[trip.id];
            const isOpen = pax?.open ?? false;
            const passengerRows = getPassengerRows(trip.id);

            return (
              <div
                key={trip.id}
                className={`bg-white rounded-2xl border transition-colors ${
                  blocked ? "border-[#FECACA]" : "border-[#E2E8F0]"
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-bold text-[#0F172A]">
                        {trip.from} → {trip.to}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {trip.vehicleType} · {formatTime(trip.departureTime)}
                      </p>
                      {trip.parkName && (
                        <p className="text-xs text-[#64748B] mt-1">📍 {trip.parkName}</p>
                      )}
                    </div>
                    {blocked && (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626]">
                        FULL
                      </span>
                    )}
                  </div>

                  {/* Seat summary */}
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={14} className="text-[#94A3B8]" />
                    <span className="text-sm text-[#64748B]">
                      <span className="font-semibold text-[#0F172A]">{booked}</span> booked
                      {(trip.offlineCount ?? 0) > 0 && (
                        <span className="text-[#D97706]"> ({trip.offlineCount} walk-in)</span>
                      )}
                      <span className="text-[#94A3B8]"> / {trip.totalSeats} total</span>
                    </span>
                  </div>

                  {/* Walk-in count input */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
                    <span className="text-xs font-medium text-[#92400E]">Walk-in passengers:</span>
                    <input
                      type="number"
                      min="0"
                      max={trip.totalSeats}
                      value={offlineInputs[trip.id] ?? (trip.offlineCount ?? 0)}
                      onChange={(e) =>
                        setOfflineInputs((prev) => ({ ...prev, [trip.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleOfflineSave(trip)}
                      className="w-16 text-sm border border-[#FDE68A] rounded-lg px-2 py-1 text-[#0F172A] bg-white focus:outline-none focus:border-[#D97706]"
                    />
                    {pendingOffline && (
                      <button
                        onClick={() => handleOfflineSave(trip)}
                        disabled={savingOffline === trip.id}
                        className="flex items-center gap-1 text-xs font-semibold text-white bg-[#16A34A] rounded-lg px-2.5 py-1 disabled:opacity-40"
                      >
                        <Check size={12} />
                        {savingOffline === trip.id ? "Saving…" : "Save"}
                      </button>
                    )}
                  </div>

                  {/* Mark Full / Reopen button */}
                  <button
                    onClick={() => handleMarkFull(trip)}
                    disabled={fulling === trip.id}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 ${
                      blocked
                        ? "bg-[#16A34A] text-white hover:bg-[#15803D]"
                        : "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                    }`}
                  >
                    {fulling === trip.id
                      ? "Updating…"
                      : blocked
                      ? "Reopen for Booking"
                      : "Mark Bus as Full"}
                  </button>
                </div>

                {/* Passenger list toggle */}
                <div className="border-t border-[#F1F5F9]">
                  <button
                    onClick={() => togglePassengers(trip.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#2563EB]" />
                      <span className="text-sm font-semibold text-[#0F172A]">Passenger List</span>
                      {pax?.data && (
                        <span className="text-xs bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full font-medium">
                          {passengerRows.length} passenger{passengerRows.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {pax?.loading
                      ? <Loader2 size={14} className="animate-spin text-[#94A3B8]" />
                      : isOpen
                      ? <ChevronUp size={14} className="text-[#94A3B8]" />
                      : <ChevronDown size={14} className="text-[#94A3B8]" />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      {pax?.error ? (
                        <p className="text-sm text-[#DC2626] bg-[#FEF2F2] rounded-xl px-4 py-3">
                          {pax.error}
                        </p>
                      ) : pax?.loading ? (
                        <div className="flex items-center gap-2 text-sm text-[#94A3B8] py-3 justify-center">
                          <Loader2 size={14} className="animate-spin" />
                          Loading passengers…
                        </div>
                      ) : passengerRows.length === 0 ? (
                        <p className="text-sm text-[#94A3B8] text-center py-4">
                          No confirmed passengers yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {passengerRows.map((paxRow, idx) => (
                            <div
                              key={`${paxRow.id ?? idx}`}
                              className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                {/* Passenger */}
                                <div>
                                  <p className="text-xs font-semibold text-[#94A3B8] mb-1">
                                    Passenger {idx + 1}
                                  </p>
                                  <p className="font-semibold text-sm text-[#0F172A]">{paxRow.fullName}</p>
                                  <a
                                    href={`tel:${paxRow.phone}`}
                                    className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline mt-0.5"
                                  >
                                    <Phone size={10} /> {paxRow.phone}
                                  </a>
                                  {paxRow.email && (
                                    <p className="text-xs text-[#94A3B8] mt-0.5">{paxRow.email}</p>
                                  )}
                                </div>

                                {/* Next of kin */}
                                <div>
                                  <p className="text-xs font-semibold text-[#94A3B8] mb-1 flex items-center gap-1">
                                    <Heart size={10} className="text-[#EF4444]" /> Next of Kin
                                  </p>
                                  <p className="font-semibold text-sm text-[#0F172A]">{paxRow.nextOfKinName}</p>
                                  <a
                                    href={`tel:${paxRow.nextOfKinPhone}`}
                                    className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline mt-0.5"
                                  >
                                    <Phone size={10} /> {paxRow.nextOfKinPhone}
                                  </a>
                                </div>
                              </div>

                              {/* Special needs */}
                              {paxRow.specialNeeds && (
                                <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                                  <p className="text-xs font-semibold text-[#94A3B8] mb-0.5">Special Needs</p>
                                  <p className="text-xs text-[#475569] bg-[#FEF9C3] border border-[#FDE68A] rounded-lg px-2.5 py-1.5">
                                    {paxRow.specialNeeds}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
