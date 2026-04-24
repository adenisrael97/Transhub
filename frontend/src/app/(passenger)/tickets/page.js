"use client";
import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FilterTabs from "@/components/ui/FilterTabs";
import { STATUS_BADGE } from "@/lib/constants";
import { capitalize } from "@/lib/utils";

const MOCK_TICKETS = [
  { id: "TH-2026-001", from: "Lagos", to: "Abuja", date: "26 Mar 2026", time: "6:00 AM", seat: "A1", operator: "Peace Mass Transit", status: "upcoming", price: 9500 },
  { id: "TH-2026-002", from: "Abuja", to: "Lagos", date: "2 Apr 2026", time: "8:00 AM", seat: "B3", operator: "GUO Transport", status: "upcoming", price: 11000 },
  { id: "TH-2025-099", from: "Ibadan", to: "Lagos", date: "10 Jan 2026", time: "7:00 AM", seat: "C2", operator: "ABC Transport", status: "completed", price: 4500 },
  { id: "TH-2025-071", from: "Lagos", to: "Enugu", date: "20 Dec 2025", time: "5:30 AM", seat: "D4", operator: "Peace Mass Transit", status: "completed", price: 12000 },
];

export default function TicketsPage() {
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_TICKETS.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <Link href="/search">
            <Button size="sm">+ Book New Trip</Button>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 w-fit">
          <FilterTabs items={["all", "upcoming", "completed"]} active={filter} onChange={setFilter} />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🎫</p>
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm mt-2 mb-6">Book a trip to see your tickets here</p>
            <Link href="/search"><Button>Search Trips</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Ticket header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-mono">{ticket.id}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[ticket.status]}`}>
                      {capitalize(ticket.status)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">₦{ticket.price.toLocaleString()}</span>
                </div>

                {/* Route */}
                <div className="px-6 py-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{ticket.time}</p>
                      <p className="text-sm text-gray-500">{ticket.from}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-center gap-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <p className="text-xs text-gray-400">{ticket.date}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">🏁</p>
                      <p className="text-sm text-gray-500">{ticket.to}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Seat <strong className="text-gray-900">{ticket.seat}</strong> · {ticket.operator}</span>
                    {ticket.status === "upcoming" && (
                      <button className="text-blue-600 font-semibold text-xs hover:underline">View QR Code</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
