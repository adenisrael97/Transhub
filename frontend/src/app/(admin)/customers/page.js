"use client";
import { useCallback } from "react";
import { Loader2, Users, Ticket, Package, CalendarRange } from "lucide-react";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { capitalize } from "@/lib/utils";
import { useServerList } from "@/hooks/useServerList";
import { fetchUsers } from "@/services/users";

const ROLE_TABS = ["passenger", "operator", "driver", "admin", "all"];
const ROLE_LABELS = {
  passenger: "Customers",
  operator:  "Operators",
  driver:    "Drivers",
  admin:     "Admins",
  all:       "All Users",
};

const ROLE_BADGE = {
  passenger: "bg-[#EFF6FF] text-[#2563EB]",
  operator:  "bg-[#F0FDF4] text-[#16A34A]",
  driver:    "bg-[#FFFBEB] text-[#D97706]",
  admin:     "bg-[#FEF2F2] text-[#DC2626]",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCustomersPage() {
  // Default to the Customers (passenger) view, per the spec's "Customers" tab.
  const selectUsers = useCallback((res) => res.users ?? [], []);
  const {
    items: users, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput,
  } = useServerList({
    fetcher: fetchUsers,
    select: selectUsers,
    limit: 20,
    initialFilters: { role: "passenger" },
  });

  const activeRole = filters.role ?? "all";
  const total = pagination?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Customers &amp; Users</h1>
          <p className="text-sm text-[#64748B]">
            {loading ? "Loading…" : `${total.toLocaleString()} ${ROLE_LABELS[activeRole]?.toLowerCase() ?? "users"}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search name, email, phone…"
            className="w-72 max-w-full"
          />
          <FilterTabs
            items={ROLE_TABS}
            labels={ROLE_LABELS}
            active={activeRole}
            onChange={(tab) => setFilter({ role: tab === "all" ? undefined : tab })}
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#94A3B8]">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8] text-sm flex flex-col items-center gap-2">
              <Users size={22} />
              No users match your search
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">
                    {["Name", "Email", "Phone", "Role", "Activity", "Joined"].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">{u.fullName}</td>
                      <td className="px-6 py-4 text-[#64748B]">{u.email}</td>
                      <td className="px-6 py-4 text-[#64748B]">{u.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
                          {capitalize(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-xs text-[#64748B]">
                          <span className="inline-flex items-center gap-1" title="Bookings"><Ticket size={12} />{u.counts.bookings}</span>
                          <span className="inline-flex items-center gap-1" title="Charters"><CalendarRange size={12} />{u.counts.charters}</span>
                          <span className="inline-flex items-center gap-1" title="Waybills"><Package size={12} />{u.counts.waybills}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">{fmtDate(u.createdAt)}</td>
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
