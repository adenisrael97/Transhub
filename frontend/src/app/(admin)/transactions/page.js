"use client";
import { useCallback, useState } from "react";
import { Loader2, Receipt, SlidersHorizontal } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { capitalize } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchTransactions } from "@/services/transactions";

const TYPE_TABS = ["all", "booking", "charter", "waybill"];
const TYPE_LABELS = { all: "All", booking: "Bookings", charter: "Charters", waybill: "Waybills" };

const TYPE_BADGE = {
  booking: "bg-[#EFF6FF] text-[#2563EB]",
  charter: "bg-[#F0FDF4] text-[#16A34A]",
  waybill: "bg-[#FFFBEB] text-[#D97706]",
};

// Settled-ish statuses render green; everything else amber/grey.
const STATUS_BADGE = {
  confirmed: "bg-[#F0FDF4] text-[#16A34A]",
  completed: "bg-[#F0FDF4] text-[#16A34A]",
  paid:      "bg-[#F0FDF4] text-[#16A34A]",
  cancelled: "bg-[#FEF2F2] text-[#DC2626]",
  refunded:  "bg-[#FEF2F2] text-[#DC2626]",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTransactionsPage() {
  const [showFilters, setShowFilters] = useState(false);

  const selectTxns = useCallback((res) => res.transactions ?? [], []);
  const {
    items: txns, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput,
  } = useServerList({ fetcher: fetchTransactions, select: selectTxns, limit: 20 });

  const activeType = filters.type ?? "all";
  const total = pagination?.total ?? 0;

  const fieldClass =
    "border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Payments &amp; Transactions</h1>
          <p className="text-sm text-[#64748B]">
            {loading ? "Loading…" : `${total.toLocaleString()} transaction${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search reference, customer, route…"
            className="w-72 max-w-full"
          />
          <FilterTabs
            items={TYPE_TABS}
            labels={TYPE_LABELS}
            active={activeType}
            onChange={(tab) => setFilter({ type: tab === "all" ? undefined : tab })}
          />
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] border border-[#E2E8F0] px-3 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <SlidersHorizontal size={13} /> More
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">From date</span>
              <input type="date" value={filters.dateFrom ?? ""} onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">To date</span>
              <input type="date" value={filters.dateTo ?? ""} onChange={(e) => setFilter({ dateTo: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Min ₦</span>
              <input type="number" min="0" value={filters.minAmount ?? ""} onChange={(e) => setFilter({ minAmount: e.target.value || undefined })} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Max ₦</span>
              <input type="number" min="0" value={filters.maxAmount ?? ""} onChange={(e) => setFilter({ maxAmount: e.target.value || undefined })} className={fieldClass} />
            </label>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#64748B]">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Loading transactions…</p>
            </div>
          ) : txns.length === 0 ? (
            <div className="py-16 text-center text-[#64748B] text-sm flex flex-col items-center gap-2">
              <Receipt size={22} />
              No transactions match your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#64748B] font-semibold uppercase tracking-wider">
                    {["Reference", "Type", "Customer", "Description", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {txns.map((t) => (
                    <tr key={`${t.type}-${t.relatedId}`} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-[#64748B]">{t.reference}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[t.type]}`}>
                          {capitalize(t.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#0F172A] font-medium">{t.customerName}</p>
                        <p className="text-xs text-[#64748B]">{t.customerEmail ?? "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-[#475569] text-xs">{t.description}</td>
                      <td className="px-6 py-4 font-semibold text-[#2563EB]">₦{Number(t.amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[t.status] ?? "bg-[#FFFBEB] text-[#D97706]"}`}>
                          {capitalize(t.status.replace(/_/g, " "))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
      </div>
    </div>
  );
}
