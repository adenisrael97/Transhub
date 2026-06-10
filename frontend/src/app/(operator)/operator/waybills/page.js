"use client";
import { useCallback, useState } from "react";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import Button from "@/components/ui/Button";
import useToastStore from "@/store/toastStore";
import { capitalize, getErrorMessage } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { listWaybills, updateWaybillStatus } from "@/services/waybills";

const STATUS_TABS = ["all", "paid", "dropped_off", "picked_up", "in_transit", "arrived_at_hub", "completed"];
const STATUS_LABELS = {
  all: "All", paid: "Paid", dropped_off: "Dropped Off", picked_up: "Picked Up",
  in_transit: "In Transit", arrived_at_hub: "Arrived", completed: "Completed",
};
const STATUS_BADGE = {
  paid: "bg-[#F0FDF4] text-[#16A34A]", dropped_off: "bg-[#CCFBF1] text-[#0D9488]",
  picked_up: "bg-[#E0E7FF] text-[#4338CA]", in_transit: "bg-[#FFEDD5] text-[#C2410C]",
  arrived_at_hub: "bg-[#F3E8FF] text-[#7E22CE]", completed: "bg-[#DCFCE7] text-[#15803D]",
  quote_sent: "bg-[#DBEAFE] text-[#1D4ED8]", pending: "bg-[#FEF9C3] text-[#A16207]",
  cancelled: "bg-[#F1F5F9] text-[#64748B]",
};
// Operator-permitted forward transitions (no quote, no cancel).
const NEXT_STATUS = {
  paid: "dropped_off", dropped_off: "picked_up", picked_up: "in_transit",
  in_transit: "arrived_at_hub", arrived_at_hub: "completed",
};

export default function OperatorWaybillsPage() {
  const toast = useToastStore();
  const [advancing, setAdvancing] = useState(null);

  const selectWaybills = useCallback((res) => res.waybills ?? [], []);
  const {
    items: waybills, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: listWaybills, select: selectWaybills, limit: 15 });

  const activeStatus = filters.status ?? "all";
  const total = pagination?.total ?? 0;

  async function advance(w) {
    const next = NEXT_STATUS[w.status];
    if (!next) return;
    setAdvancing(w.id);
    try {
      await updateWaybillStatus(w.id, { status: next });
      toast.success(`Waybill ${w.waybillNo} → ${STATUS_LABELS[next] ?? next}`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Assigned Waybills</h1>
          <p className="text-sm text-[#64748B]">
            {loading ? "Loading…" : `${total.toLocaleString()} shipment${total === 1 ? "" : "s"} assigned to you`}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search waybill no, sender, recipient, route…"
            className="w-full sm:w-72"
          />
          <FilterTabs
            items={STATUS_TABS}
            labels={STATUS_LABELS}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
            color="green"
          />
        </div>

        {loading && waybills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center text-[#94A3B8]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : waybills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <Package size={32} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-[#475569] font-semibold">No waybills found</p>
            <p className="text-sm text-[#94A3B8]">Nothing matches your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waybills.map((w) => {
              const next = NEXT_STATUS[w.status];
              return (
                <div key={w.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-[#0F172A]">{w.waybillNo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[w.status] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
                          {capitalize((w.status || "").replace(/_/g, " "))}
                        </span>
                      </div>
                      <p className="text-sm text-[#475569] flex items-center gap-1.5">
                        {w.fromLocation} <ArrowRight size={12} className="text-[#94A3B8]" /> {w.toLocation}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        {w.senderName} → {w.recipientName} · {w.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#16A34A] mb-2">₦{Number(w.fee ?? 0).toLocaleString()}</p>
                      {next && (
                        <Button size="sm" variant="success" loading={advancing === w.id} onClick={() => advance(w)}>
                          Mark {STATUS_LABELS[next] ?? next}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
