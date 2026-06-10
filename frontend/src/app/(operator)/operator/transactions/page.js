"use client";
import { useCallback } from "react";
import { Loader2, Receipt } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { capitalize } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchTransactions } from "@/services/transactions";

// Operators only ever have booking + waybill transactions (charters are
// admin-brokered with no operator link), so no Charters tab here.
const TYPE_TABS = ["all", "booking", "waybill"];
const TYPE_LABELS = { all: "All", booking: "Bookings", waybill: "Waybills" };
const TYPE_BADGE = { booking: "bg-[#EFF6FF] text-[#2563EB]", waybill: "bg-[#FFFBEB] text-[#D97706]" };
const STATUS_BADGE = {
  confirmed: "bg-[#F0FDF4] text-[#16A34A]", completed: "bg-[#F0FDF4] text-[#16A34A]",
  paid: "bg-[#F0FDF4] text-[#16A34A]", cancelled: "bg-[#FEF2F2] text-[#DC2626]",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function OperatorTransactionsPage() {
  const selectTxns = useCallback((res) => res.transactions ?? [], []);
  const {
    items: txns, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput,
  } = useServerList({ fetcher: fetchTransactions, select: selectTxns, limit: 20 });

  const activeType = filters.type ?? "all";
  const total = pagination?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Transactions</h1>
          <p className="text-sm text-[#64748B]">
            {loading ? "Loading…" : `${total.toLocaleString()} transaction${total === 1 ? "" : "s"} for your business`}
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
            color="green"
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#94A3B8]">
              <Loader2 size={24} className="animate-spin" /><p className="text-sm">Loading…</p>
            </div>
          ) : txns.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8] text-sm flex flex-col items-center gap-2">
              <Receipt size={22} /> No transactions match your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[t.type] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>{capitalize(t.type)}</span>
                      </td>
                      <td className="px-6 py-4 text-[#0F172A] font-medium">{t.customerName}</td>
                      <td className="px-6 py-4 text-[#475569] text-xs">{t.description}</td>
                      <td className="px-6 py-4 font-semibold text-[#16A34A]">₦{Number(t.amount).toLocaleString()}</td>
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
