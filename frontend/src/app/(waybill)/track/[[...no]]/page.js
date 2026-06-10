"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, AlertTriangle, PackageX } from "lucide-react";
import Tracker from "@/components/waybill/Tracker";
import Button from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";

export default function TrackPage() {
  const params = useParams();
  const no = params.no?.[0] ?? null;
  const { waybill, loading, error, fetchWaybill } = useTracking(no);
  const [input, setInput] = useState(no ?? "");
  const [submitted, setSubmitted] = useState(!!no);

  useEffect(() => {
    if (no) fetchWaybill(no).catch(() => {});
  }, [no, fetchWaybill]);

  function handleSearch(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitted(true);
    fetchWaybill(input.trim()).catch(() => {});
  }

  const isNotFound = submitted && !loading && !waybill;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Search header */}
      <div className="bg-[#0F172A] py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#2563EB]/20 text-[#93C5FD] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <Package size={11} /> Live Tracking
          </span>
          <h1 className="text-2xl font-bold text-white mb-1">Track Your Package</h1>
          <p className="text-sm text-[#94A3B8] mb-8">Enter your waybill number to see real-time status</p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. WB-2026-K3M9PX"
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#64748B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              required
            />
            <Button type="submit" loading={loading} rightIcon={<Search size={15} />}>Track</Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Error state (non-404) */}
        {error && waybill === null && !isNotFound && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl p-4 mb-6 text-sm">
            <AlertTriangle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* Empty state — nothing entered yet */}
        {!submitted && !no && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-[#2563EB]" />
            </div>
            <p className="text-lg font-semibold text-[#0F172A]">Enter a waybill number above</p>
            <p className="text-sm text-[#94A3B8] mt-1 mb-4">to start tracking your package</p>
            <p className="text-sm text-[#94A3B8]">
              Don&apos;t have one yet?{" "}
              <Link href="/send" className="text-[#2563EB] font-semibold hover:underline">Send Goods</Link>
            </p>
          </div>
        )}

        {/* Not found state */}
        {isNotFound && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PackageX size={28} className="text-[#DC2626]" />
            </div>
            <p className="text-lg font-semibold text-[#0F172A]">Waybill not found</p>
            <p className="text-sm text-[#94A3B8] mt-1 mb-4">
              No package found for <span className="font-mono font-bold text-[#0F172A]">{input}</span>.
              Check the number and try again.
            </p>
            <p className="text-sm text-[#94A3B8]">
              Want to ship a parcel?{" "}
              <Link href="/send" className="text-[#2563EB] font-semibold hover:underline">Send Goods</Link>
            </p>
          </div>
        )}

        {/* Waybill found */}
        {waybill && <Tracker waybill={waybill} />}
      </div>
    </div>
  );
}
