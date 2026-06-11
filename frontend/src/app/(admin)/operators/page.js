"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FilterTabs from "@/components/ui/FilterTabs";
import StatCard from "@/components/ui/StatCard";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import useToastStore from "@/store/toastStore";
import { capitalize } from "@/lib/utils";
import { STATUS_BADGE } from "@/lib/constants";
import { useServerList } from "@/hooks/useServerList";
import {
  fetchOperators,
  approveOperator as approveOperatorApi,
  declineOperator as declineOperatorApi,
} from "@/services/operators";

export default function AdminOperatorsPage() {
  const toast = useToastStore();

  const [selectedOp, setSelectedOp]       = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword]   = useState(null);
  const [copied, setCopied]               = useState(false);
  const [counts, setCounts]               = useState({ all: 0, pending: 0, approved: 0, declined: 0 });

  const selectOperators = useCallback((res) => res.operators ?? [], []);
  const {
    items: operators, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: fetchOperators, select: selectOperators, limit: 20 });

  const activeStatus = filters.status ?? "all";

  // Global per-status counts (independent of the current page) for the stat cards
  // + tab badges. Four cheap COUNT queries (the operators table is small).
  const loadCounts = useCallback(async () => {
    try {
      const [all, pending, approved, declined] = await Promise.all([
        fetchOperators({ limit: 1 }),
        fetchOperators({ status: "pending", limit: 1 }),
        fetchOperators({ status: "approved", limit: 1 }),
        fetchOperators({ status: "declined", limit: 1 }),
      ]);
      setCounts({
        all:      all.pagination?.total ?? 0,
        pending:  pending.pagination?.total ?? 0,
        approved: approved.pagination?.total ?? 0,
        declined: declined.pagination?.total ?? 0,
      });
    } catch { /* counts are best-effort */ }
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    const { type, opId, name } = confirmAction;
    setActionLoading(true);
    try {
      if (type === "approve") {
        const res = await approveOperatorApi(opId);
        if (selectedOp?.id === opId) setSelectedOp(res.operator);
        setTempPassword(res.tempPassword);
        toast.success(`${name} approved — temp password generated`);
      } else {
        const res = await declineOperatorApi(opId);
        if (selectedOp?.id === opId) setSelectedOp(res.operator);
        toast.error(`${name} has been declined`);
      }
      refetch();
      loadCounts();
    } catch (err) {
      toast.error(err?.error?.message || err?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function copyPassword() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Operator Requests</h1>
            <p className="text-sm text-[#64748B]">
              {counts.all} total · {counts.pending} pending review
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { refetch(); loadCounts(); }} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total",    value: counts.all,      Icon: Building2,    bg: "bg-blue-50",  color: "text-blue-600"  },
            { label: "Pending",  value: counts.pending,  Icon: Building2,    bg: "bg-amber-50", color: "text-amber-600" },
            { label: "Approved", value: counts.approved, Icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
            { label: "Declined", value: counts.declined, Icon: XCircle,      bg: "bg-red-50",   color: "text-red-600"   },
          ].map(({ Icon, label, value, bg, color }) => (
            <StatCard key={label} icon={<Icon size={22} />} label={label} value={value} bg={bg} color={color} />
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search company, contact, email, city…"
            className="w-full sm:w-64"
          />
          <FilterTabs
            items={["all", "pending", "approved", "declined"]}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
            counts={counts}
          />
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && operators.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">Loading operator applications…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-left text-xs text-[#64748B] font-semibold uppercase tracking-wider">
                    {["Company", "Contact", "City", "Fleet", "Applied", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {operators.map((op) => (
                    <tr key={op.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#0F172A]">{op.companyName}</p>
                        <p className="text-xs text-[#64748B] font-mono truncate max-w-35">{op.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#475569]">{op.contactName}</p>
                        <p className="text-xs text-[#64748B]">{op.email}</p>
                      </td>
                      <td className="px-6 py-4 text-[#64748B]">{op.city}</td>
                      <td className="px-6 py-4 text-[#64748B]">{op.fleetSize}</td>
                      <td className="px-6 py-4 text-xs text-[#64748B]">{fmtDate(op.appliedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[op.status]}`}>
                          {capitalize(op.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedOp(op)} className="text-[#2563EB] hover:underline text-xs font-medium">
                            View
                          </button>
                          {op.status === "pending" && (
                            <>
                              <button
                                onClick={() => setConfirmAction({ type: "approve", opId: op.id, name: op.companyName })}
                                className="text-[#16A34A] hover:underline text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: "decline", opId: op.id, name: op.companyName })}
                                className="text-[#DC2626] hover:underline text-xs font-medium"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {operators.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 size={24} className="text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#64748B]">No operator requests match your filter</p>
              </div>
            )}
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedOp} onClose={() => setSelectedOp(null)} title="Operator Details" size="lg">
        {selectedOp && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl ${
              selectedOp.status === "pending"  ? "bg-[#FFFBEB] border border-[#FDE68A]" :
              selectedOp.status === "approved" ? "bg-[#F0FDF4] border border-[#BBF7D0]" :
              "bg-[#FEF2F2] border border-[#FECACA]"
            }`}>
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">Status</p>
                <p className={`text-lg font-bold ${
                  selectedOp.status === "pending"  ? "text-[#D97706]" :
                  selectedOp.status === "approved" ? "text-[#16A34A]" : "text-[#DC2626]"
                }`}>
                  {capitalize(selectedOp.status)}
                </p>
              </div>
              {selectedOp.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => setConfirmAction({ type: "approve", opId: selectedOp.id, name: selectedOp.companyName })}>
                    <CheckCircle2 size={13} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmAction({ type: "decline", opId: selectedOp.id, name: selectedOp.companyName })}>
                    <XCircle size={13} /> Decline
                  </Button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Company Name",       selectedOp.companyName],
                ["Contact Person",     selectedOp.contactName],
                ["Email",              selectedOp.email],
                ["Phone",              selectedOp.phone],
                ["City",               selectedOp.city],
                ["Fleet Size",         selectedOp.fleetSize],
                ["Years in Operation", selectedOp.yearsInOperation],
                ["CAC Number",         selectedOp.cacNumber || "—"],
                ["Applied",            fmtDate(selectedOp.appliedAt)],
                ["Reviewed",           selectedOp.reviewedAt ? fmtDate(selectedOp.reviewedAt) : "Not yet reviewed"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
                  <p className="font-semibold text-sm text-[#0F172A]">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-[#64748B] mb-2">Vehicle Types</p>
              <div className="flex flex-wrap gap-2">
                {(selectedOp.vehicleTypes ?? []).map((t) => (
                  <span key={t} className="bg-[#EFF6FF] text-[#2563EB] px-3 py-1 rounded-full text-xs font-semibold">{t}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[#64748B] mb-1">Preferred Routes</p>
              <p className="text-sm text-[#475569]">{selectedOp.routes}</p>
            </div>

            {selectedOp.additionalInfo && (
              <div>
                <p className="text-xs text-[#64748B] mb-1">Additional Information</p>
                <p className="text-sm text-[#475569] leading-relaxed">{selectedOp.additionalInfo}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Temp password modal — shown once after approve */}
      <Modal isOpen={!!tempPassword} onClose={() => setTempPassword(null)} title="Operator Account Created" size="sm">
        <div className="space-y-4">
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-sm text-[#92400E]">
            Share this one-time password with the operator. It will <strong>not</strong> be shown again.
            They should change it after their first login.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#F1F5F9] rounded-xl px-4 py-3 font-mono text-sm text-[#0F172A] tracking-wider select-all">
              {tempPassword}
            </code>
            <button
              onClick={copyPassword}
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] transition-colors"
            >
              {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <Button fullWidth onClick={() => setTempPassword(null)}>Done</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={actionLoading}
        title={confirmAction?.type === "approve" ? "Approve Operator" : "Decline Operator"}
        message={
          confirmAction?.type === "approve"
            ? `Approve ${confirmAction?.name}? A login account will be created and they'll receive a temporary password.`
            : `Decline ${confirmAction?.name}? They will be notified that their application was not accepted.`
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Decline"}
        variant={confirmAction?.type === "approve" ? "warning" : "danger"}
      />
    </div>
  );
}
