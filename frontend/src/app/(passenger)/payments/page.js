"use client";
import { useCallback } from "react";
import { Loader2, Receipt } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import AuthGuard from "@/components/shared/AuthGuard";
import { capitalize } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchTransactions } from "@/services/transactions";

const TYPE_TABS = ["all", "booking", "charter", "waybill"];
const TYPE_LABELS = { all: "All", booking: "Trips", charter: "Charters", waybill: "Shipments" };
const TYPE_BADGE = {
  booking: "bg-[#EFF6FF] text-[#2563EB]", charter: "bg-[#F0FDF4] text-[#16A34A]", waybill: "bg-[#FFFBEB] text-[#D97706]",
};
const STATUS_BADGE = {
  confirmed: "bg-[#F0FDF4] text-[#16A34A]", completed: "bg-[#F0FDF4] text-[#16A34A]",
  paid: "bg-[#F0FDF4] text-[#16A34A]", cancelled: "bg-[#FEF2F2] text-[#DC2626]",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function PaymentsContent() {
  const selectTxns = useCallback((res) => res.transactions ?? [], []);
  const {
    items: txns, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput,
  } = useServerList({ fetcher: fetchTransactions, select: selectTxns, limit: 15 });

  const activeType = filters.type ?? "all";
  const total = pagination?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">Payment History</h1>
          <p className="text-sm text-[#64748B]">
            {loading ? "Loading…" : `${total.toLocaleString()} payment${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search reference or route…"
            className="w-full sm:w-72"
          />
          <FilterTabs
            items={TYPE_TABS}
            labels={TYPE_LABELS}
            active={activeType}
            onChange={(tab) => setFilter({ type: tab === "all" ? undefined : tab })}
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center text-[#64748B]">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : txns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <Receipt size={28} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-[#475569] font-semibold">No payments found</p>
            <p className="text-sm text-[#64748B]">Your trip, charter and shipment payments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {txns.map((t) => (
              <div key={`${t.type}-${t.relatedId}`} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[t.type] ?? ""}`}>{TYPE_LABELS[t.type] ?? capitalize(t.type)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[t.status] ?? "bg-[#FFFBEB] text-[#D97706]"}`}>
                      {capitalize((t.status || "").replace(/_/g, " "))}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A] truncate">{t.description}</p>
                  <p className="text-xs text-[#64748B] font-mono truncate">REF: {t.reference} · {fmtDate(t.createdAt)}</p>
                </div>
                <p className="text-lg font-bold text-[#2563EB] shrink-0">₦{Number(t.amount).toLocaleString()}</p>
              </div>
            ))}
            <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <AuthGuard>
      <PaymentsContent />
    </AuthGuard>
  );
}
