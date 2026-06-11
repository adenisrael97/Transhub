"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Package, ArrowRight, RefreshCw, PackageX, Truck } from "lucide-react";
import Button from "@/components/ui/Button";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import useToastStore from "@/store/toastStore";
import { useServerList } from "@/hooks/useServerList";
import { listMyWaybills, initiatePay } from "@/services/waybills";
import { getErrorMessage } from "@/lib/utils";

const STATUS_TABS = ["all", "pending", "quote_sent", "paid", "in_transit", "completed"];
const TAB_LABELS = {
  all: "All", pending: "Pending", quote_sent: "Quote Ready", paid: "Paid",
  in_transit: "In Transit", completed: "Completed",
};

// ── Status display map ──────────────────────────────────────────────────────
const STATUS_LABEL = {
  pending:        "Pending Review",
  quote_sent:     "Quote Ready",
  paid:           "Paid — Awaiting Drop-off",
  dropped_off:    "Dropped at Origin Hub",
  picked_up:      "Picked Up by Carrier",
  in_transit:     "In Transit",
  arrived_at_hub: "Arrived at Destination Hub",
  completed:      "Completed",
  cancelled:      "Cancelled",
};

const STATUS_COLOR = {
  pending:        "bg-yellow-100 text-yellow-800",
  quote_sent:     "bg-blue-100 text-blue-800",
  paid:           "bg-green-100 text-green-800",
  dropped_off:    "bg-teal-100 text-teal-800",
  picked_up:      "bg-indigo-100 text-indigo-800",
  in_transit:     "bg-orange-100 text-orange-800",
  arrived_at_hub: "bg-purple-100 text-purple-800",
  completed:      "bg-emerald-100 text-emerald-800",
  cancelled:      "bg-gray-100 text-gray-600",
};

function fmtFee(fee) {
  if (!fee || Number(fee) === 0) return null;
  return `₦${Number(fee).toLocaleString("en-NG")}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function WaybillCard({ waybill, onPay, paying }) {
  const isQuoteReady = waybill.status === "quote_sent";
  const badgeClass = STATUS_COLOR[waybill.status] ?? "bg-gray-100 text-gray-600";
  const label = STATUS_LABEL[waybill.status] ?? waybill.status;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-0.5">Waybill</p>
          <p className="text-lg font-bold text-[#0F172A] font-mono">{waybill.waybillNo}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
          {label}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-sm text-[#475569]">
        <span className="font-semibold text-[#0F172A]">{waybill.fromLocation}</span>
        <ArrowRight size={13} className="text-[#64748B] shrink-0" />
        <span className="font-semibold text-[#0F172A]">{waybill.toLocation}</span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#64748B]">
        <span>Recipient: <strong className="text-[#0F172A]">{waybill.recipientName}</strong></span>
        <span>Created: <strong className="text-[#0F172A]">{fmtDate(waybill.createdAt)}</strong></span>
        {fmtFee(waybill.fee) && (
          <span>Shipping fee: <strong className="text-[#16A34A]">{fmtFee(waybill.fee)}</strong></span>
        )}
        {waybill.assignedOperator && (
          <span>Carrier: <strong className="text-[#0F172A]">{waybill.assignedOperator.companyName}</strong></span>
        )}
      </div>

      {/* Quote note */}
      {isQuoteReady && waybill.quoteNote && (
        <p className="text-xs bg-[#EFF6FF] text-[#2563EB] rounded-lg px-3 py-2 border border-[#DBEAFE]">
          Admin note: {waybill.quoteNote}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button as={Link} href={`/track/${waybill.waybillNo}`} size="sm" variant="secondary">
          Track
        </Button>
        {isQuoteReady && (
          <Button
            size="sm"
            variant="success"
            loading={paying === waybill.id}
            onClick={() => onPay(waybill)}
            rightIcon={<ArrowRight size={13} />}
          >
            Accept & Pay {fmtFee(waybill.fee)}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyShipmentsPage() {
  const toast = useToastStore();
  const [paying, setPaying] = useState(null);

  const selectWaybills = useCallback((res) => res.waybills ?? [], []);
  const {
    items: waybills, pagination, loading, filters, setFilter,
    page, setPage, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: listMyWaybills, select: selectWaybills, limit: 10 });

  const activeStatus = filters.status ?? "all";

  async function handlePay(waybill) {
    setPaying(waybill.id);
    try {
      const { paymentUrl } = await initiatePay(waybill.id);
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start payment. Try again."));
      setPaying(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#0F172A] py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-[#2563EB]/20 text-[#93C5FD] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <Truck size={11} /> My Shipments
          </span>
          <h1 className="text-2xl font-bold text-white mb-1">My Shipments</h1>
          <p className="text-sm text-[#64748B]">Track all your sent parcels and accept quotes.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#64748B]">
            {!loading && `${(pagination?.total ?? waybills.length).toLocaleString()} shipment${(pagination?.total ?? waybills.length) !== 1 ? "s" : ""}`}
          </p>
          <div className="flex gap-3">
            <Button size="sm" variant="secondary" onClick={refetch} loading={loading} rightIcon={<RefreshCw size={13} />}>
              Refresh
            </Button>
            <Button size="sm" as={Link} href="/send" rightIcon={<Package size={13} />}>
              New Shipment
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search waybill no, recipient, route…"
            className="w-full sm:w-64"
          />
          <FilterTabs
            items={STATUS_TABS}
            labels={TAB_LABELS}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
          />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse h-36" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && waybills.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PackageX size={28} className="text-[#2563EB]" />
            </div>
            <p className="text-lg font-semibold text-[#0F172A]">No shipments yet</p>
            <p className="text-sm text-[#64748B] mt-1 mb-5">Start by submitting a waybill request.</p>
            <Button as={Link} href="/send">Send Goods</Button>
          </div>
        )}

        {/* Cards */}
        {!loading && waybills.length > 0 && (
          <div className="space-y-4">
            {waybills.map((w) => (
              <WaybillCard key={w.id} waybill={w} onPay={handlePay} paying={paying} />
            ))}
            <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
