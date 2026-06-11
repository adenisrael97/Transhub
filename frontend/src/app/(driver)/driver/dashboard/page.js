"use client";

import { useState, useEffect, useCallback } from "react";
import { Bus, Check, Users, Phone, Heart, ChevronDown, ChevronUp, Loader2, MapPin, Lock, Unlock, RefreshCw } from "lucide-react";
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
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Today&apos;s Trips</h1>
          <p className="text-xs font-medium text-[#64748B] mt-0.5">
            {new Date().toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-[#D97706] font-semibold disabled:opacity-40 px-3 py-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && trips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-[#64748B] py-16">
          <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading trips…</p>
        </div>
      ) : !error && trips.length === 0 ? (
        <div className="th-card p-12 text-center">
          <div className="w-14 h-14 bg-[#FFFBEB] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bus size={26} className="text-[#D97706]" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No trips scheduled for today</p>
          <p className="text-xs text-[#64748B] mt-1">New assignments will appear here automatically.</p>
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
                className={`th-card overflow-hidden transition-colors ${
                  blocked ? "border-[#FECACA] ring-1 ring-[#FECACA]" : ""
                }`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-bold text-[#0F172A] text-[15px]">
                        {trip.from} → {trip.to}
                      </p>
                      <p className="text-xs font-medium text-[#64748B] mt-0.5">
                        {trip.vehicleType} · {formatTime(trip.departureTime)}
                      </p>
                      {trip.parkName && (
                        <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                          <MapPin size={11} className="text-[#64748B]" /> {trip.parkName}
                        </p>
                      )}
                    </div>
                    {blocked && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626]">
                        <Lock size={11} /> FULL
                      </span>
                    )}
                  </div>

                  {/* Seat summary */}
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={14} className="text-[#64748B]" />
                    <span className="text-sm text-[#475569]">
                      <span className="font-bold text-[#0F172A]">{booked}</span> booked
                      {(trip.offlineCount ?? 0) > 0 && (
                        <span className="text-[#B45309] font-semibold"> ({trip.offlineCount} walk-in)</span>
                      )}
                      <span className="text-[#64748B]"> / {trip.totalSeats} total</span>
                    </span>
                  </div>

                  {/* Walk-in count input */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
                    <span className="text-xs font-semibold text-[#92400E]">Walk-in passengers:</span>
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
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2 shadow-sm active:enabled:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      blocked
                        ? "bg-[#16A34A] text-white hover:bg-[#15803D] focus:ring-[#16A34A]"
                        : "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]"
                    }`}
                  >
                    {fulling === trip.id ? (
                      <><Loader2 size={15} className="animate-spin" /> Updating…</>
                    ) : blocked ? (
                      <><Unlock size={15} /> Reopen for Booking</>
                    ) : (
                      <><Lock size={15} /> Mark Bus as Full</>
                    )}
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
                      ? <Loader2 size={14} className="animate-spin text-[#64748B]" />
                      : isOpen
                      ? <ChevronUp size={14} className="text-[#64748B]" />
                      : <ChevronDown size={14} className="text-[#64748B]" />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      {pax?.error ? (
                        <p className="text-sm text-[#DC2626] bg-[#FEF2F2] rounded-xl px-4 py-3">
                          {pax.error}
                        </p>
                      ) : pax?.loading ? (
                        <div className="flex items-center gap-2 text-sm text-[#64748B] py-3 justify-center">
                          <Loader2 size={14} className="animate-spin" />
                          Loading passengers…
                        </div>
                      ) : passengerRows.length === 0 ? (
                        <p className="text-sm font-medium text-[#64748B] text-center py-4">
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
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B] mb-1">
                                    Passenger {idx + 1}
                                  </p>
                                  <p className="font-semibold text-sm text-[#0F172A]">{paxRow.fullName}</p>
                                  <a
                                    href={`tel:${paxRow.phone}`}
                                    className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline mt-0.5"
                                  >
                                    <Phone size={10} /> {paxRow.phone}
                                  </a>
                                  {paxRow.email && (
                                    <p className="text-xs text-[#64748B] mt-0.5">{paxRow.email}</p>
                                  )}
                                </div>

                                {/* Next of kin */}
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B] mb-1 flex items-center gap-1">
                                    <Heart size={10} className="text-[#EF4444]" /> Next of Kin
                                  </p>
                                  <p className="font-semibold text-sm text-[#0F172A]">{paxRow.nextOfKinName}</p>
                                  <a
                                    href={`tel:${paxRow.nextOfKinPhone}`}
                                    className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline mt-0.5"
                                  >
                                    <Phone size={10} /> {paxRow.nextOfKinPhone}
                                  </a>
                                </div>
                              </div>

                              {/* Special needs */}
                              {paxRow.specialNeeds && (
                                <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B] mb-0.5">Special Needs</p>
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
