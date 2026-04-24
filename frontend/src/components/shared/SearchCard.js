"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES } from "@/lib/constants";

/**
 * Hero search card with tabs for Book / Waybill / Charter.
 * Pre-fills the search form and navigates with query params.
 */
export default function SearchCard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("book");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-3 max-w-4xl mx-auto">
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-3">
        {[
          { key: "book", label: "🎫  Book a Seat" },
          { key: "waybill", label: "📦  Send Goods" },
          { key: "charter", label: "🚌  Charter" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "book" && (
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-1">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Departure city"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">🛫 From</option>
            {CITIES.map((c) => (
              <option key={`from-${c}`} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Arrival city"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">🛬 To</option>
            {CITIES.map((c) => (
              <option key={`to-${c}`} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Travel date"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors text-center"
          >
            Search Trips →
          </button>
        </form>
      )}

      {activeTab === "waybill" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1">
          <select
            aria-label="Sending from city"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">📍 Sending From</option>
            {CITIES.map((c) => (
              <option key={`wfrom-${c}`} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Sending to city"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">📍 Sending To</option>
            {CITIES.map((c) => (
              <option key={`wto-${c}`} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Link
            href="/send"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors text-center"
          >
            Send Goods →
          </Link>
        </div>
      )}

      {activeTab === "charter" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1">
          <select
            aria-label="Vehicle type"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
          >
            <option value="">🚌 Vehicle Type</option>
            <option>Bus (18 seater)</option>
            <option>Bus (33 seater)</option>
            <option>Coaster Bus</option>
            <option>SUV / Car</option>
            <option>Pickup Truck</option>
            <option>Cargo Van</option>
          </select>
          <select
            aria-label="Charter purpose"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
          >
            <option value="">🎯 Purpose</option>
            <option>Group Travel</option>
            <option>Corporate Trip</option>
            <option>Goods Delivery</option>
            <option>Event / Occasion</option>
          </select>
          <Link
            href="/charter"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors text-center"
          >
            Get a Quote →
          </Link>
        </div>
      )}
    </div>
  );
}
