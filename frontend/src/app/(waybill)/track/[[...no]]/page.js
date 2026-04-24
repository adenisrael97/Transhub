"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Tracker from "@/components/waybill/Tracker";
import Button from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";
import Link from "next/link";

const MOCK_WAYBILL = {
  waybillNo: "TH-000001",
  status: "in_transit",
  from: "Lagos", to: "Abuja",
  senderName: "John Doe", receiverName: "Jane Smith",
  estimatedDelivery: "March 27, 2026",
  updates: [
    { date: "Mar 25, 2026 – 9:00 AM",   status: "Waybill Created",            location: "Lagos" },
    { date: "Mar 25, 2026 – 11:30 AM",  status: "Picked up from sender",      location: "Lagos" },
    { date: "Mar 25, 2026 – 2:00 PM",   status: "Departed origin terminal",   location: "Lagos Terminal" },
    { date: "Mar 25, 2026 – 6:30 PM",   status: "Package in transit",         location: "On the way to Abuja" },
  ],
};

export default function TrackPage() {
  const params = useParams();
  const no = params.no?.[0] ?? null;
  const { waybill, loading, error, fetchWaybill } = useTracking(no);
  const [input, setInput] = useState(no ?? "");
  const [submitted, setSubmitted] = useState(!!no);

  // If URL has waybill number, fetch on mount
  useEffect(() => {
    if (no) fetchWaybill(no).catch(() => {});
  }, [no, fetchWaybill]);

  function handleSearch(e) {
    e.preventDefault();
    setSubmitted(true);
    fetchWaybill(input).catch(() => {});
  }

  const displayWaybill = waybill ?? (submitted ? { ...MOCK_WAYBILL, waybillNo: input || MOCK_WAYBILL.waybillNo } : null);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-blue-600/20 text-blue-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Live Tracking</span>
          <h1 className="text-3xl font-extrabold text-white mb-2">Track Your Package</h1>
          <p className="text-gray-400 text-sm mb-8">Enter your waybill number to see real-time status</p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. TH-2024-00123"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <Button type="submit" loading={loading}>Track</Button>
          </form>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {!submitted && !no ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p>Enter a waybill number above to start tracking</p>
            <p className="text-sm mt-4">
              Don&apos;t have a waybill yet?{" "}
              <Link href="/send" className="text-blue-600 font-semibold hover:underline">Send Goods</Link>
            </p>
          </div>
        ) : (
          <Tracker waybill={displayWaybill} />
        )}
      </div>
    </div>
  );
}
