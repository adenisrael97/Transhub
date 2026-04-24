"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import TripCard from "@/components/booking/TripCard";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { CITIES } from "@/lib/constants";
import useFleetStore from "@/store/fleetStore";

function SearchContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    date: searchParams.get("date") ?? "",
    passengers: "1",
  });
  const [searched, setSearched] = useState(false);
  const { trips, loading, error, searchTrips } = useTrips();
  const getVisibleTrips = useFleetStore((state) => state.getVisibleTrips);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-search if query params were passed from landing page
  useEffect(() => {
    if (form.from && form.to) {
      setSearched(true);
      searchTrips(form);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setSearched(true);
    await searchTrips(form);
  }

  // Only fall back to fleet store data when the backend is unreachable (error set).
  // If the backend returned an empty result, respect it — don't show mock trips.
  const fallbackTrips = searched && error ? getVisibleTrips(form) : [];
  const displayTrips = trips.length > 0 ? trips : fallbackTrips;

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Search bar */}
      <div className="bg-blue-600 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Find Available Trips</h1>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Select required value={form.from} onChange={(e) => set("from", e.target.value)}>
              <option value="">🛫 From</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select required value={form.to} onChange={(e) => set("to", e.target.value)}>
              <option value="">🛬 To</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)}
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Select value={form.passengers} onChange={(e) => set("passengers", e.target.value)}>
              <option value="1">1 passenger</option>
              <option value="2">2 passengers</option>
              <option value="3">3 passengers</option>
              <option value="4">4 passengers</option>
            </Select>
            <Button type="submit" loading={loading} fullWidth>Search</Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {!searched && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium">Search for a trip to get started</p>
          </div>
        )}

        {searched && displayTrips.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🚌</p>
            <p className="text-lg font-medium">No trips found for this route</p>
            <p className="text-sm mt-2">Try a different date or route</p>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 text-amber-700 rounded-xl p-4 mb-6 text-sm">
            Live backend unavailable. Showing available buses from local demo fleet.
          </div>
        )}

        {displayTrips.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{displayTrips.length} trip{displayTrips.length > 1 ? "s" : ""} found</p>
            <div className="grid gap-4">
              {displayTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center text-gray-400">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
