"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FilterTabs from "@/components/ui/FilterTabs";
import StatCard from "@/components/ui/StatCard";
import useOperatorStore from "@/store/operatorStore";
import useToastStore from "@/store/toastStore";
import { capitalize } from "@/lib/utils";
import { STATUS_BADGE } from "@/lib/constants";

export default function AdminOperatorsPage() {
  const { operators, approveOperator, declineOperator, getCounts } = useOperatorStore();
  const toast = useToastStore();
  const counts = getCounts();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOp, setSelectedOp] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve'|'decline', opId, name }

  const filtered = operators.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      o.companyName.toLowerCase().includes(q) ||
      o.contactName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.city?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleConfirm() {
    if (!confirmAction) return;
    const { type, opId, name } = confirmAction;
    if (type === "approve") {
      approveOperator(opId);
      toast.success(`${name} has been approved`);
      if (selectedOp?.id === opId) setSelectedOp({ ...selectedOp, status: "approved", reviewedAt: new Date().toISOString() });
    } else {
      declineOperator(opId);
      toast.error(`${name} has been declined`);
      if (selectedOp?.id === opId) setSelectedOp({ ...selectedOp, status: "declined", reviewedAt: new Date().toISOString() });
    }
    setConfirmAction(null);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operator Requests</h1>
            <p className="text-sm text-gray-500">
              {counts.total} total · {counts.pending} pending review
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total",    value: counts.total,    color: "text-blue-600",   bg: "bg-blue-50",   icon: "🏢" },
            { label: "Pending",  value: counts.pending,  color: "text-amber-600",  bg: "bg-amber-50",  icon: "⏳" },
            { label: "Approved", value: counts.approved, color: "text-green-600",  bg: "bg-green-50",  icon: "✅" },
            { label: "Declined", value: counts.declined, color: "text-red-600",    bg: "bg-red-50",    icon: "❌" },
          ].map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} bg={s.bg} color={s.color} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, name, email…"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
          <FilterTabs items={["all", "pending", "approved", "declined"]} active={filter} onChange={setFilter} counts={counts} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Fleet</th>
                  <th className="px-6 py-4">Applied</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{op.companyName}</p>
                      <p className="text-xs text-gray-400 font-mono">{op.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{op.contactName}</p>
                      <p className="text-xs text-gray-400">{op.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{op.city}</td>
                    <td className="px-6 py-4 text-gray-600">{op.fleetSize}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{fmtDate(op.appliedAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[op.status]}`}>
                        {capitalize(op.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOp(op)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          View
                        </button>
                        {op.status === "pending" && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ type: "approve", opId: op.id, name: op.companyName })}
                              className="text-green-600 hover:underline text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: "decline", opId: op.id, name: op.companyName })}
                              className="text-red-500 hover:underline text-xs font-medium"
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
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏢</p>
              <p className="font-medium">No operator requests match your filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedOp}
        onClose={() => setSelectedOp(null)}
        title="Operator Details"
        size="lg"
      >
        {selectedOp && (
          <div className="space-y-6">
            {/* Status banner */}
            <div className={`flex items-center justify-between p-4 rounded-xl ${
              selectedOp.status === "pending"
                ? "bg-amber-50 border border-amber-100"
                : selectedOp.status === "approved"
                ? "bg-green-50 border border-green-100"
                : "bg-red-50 border border-red-100"
            }`}>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Status</p>
                <p className={`text-lg font-bold ${
                  selectedOp.status === "pending" ? "text-amber-700" : selectedOp.status === "approved" ? "text-green-700" : "text-red-700"
                }`}>
                  {capitalize(selectedOp.status)}
                </p>
              </div>
              {selectedOp.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => setConfirmAction({ type: "approve", opId: selectedOp.id, name: selectedOp.companyName })}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmAction({ type: "decline", opId: selectedOp.id, name: selectedOp.companyName })}
                  >
                    ✕ Decline
                  </Button>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["Company Name", selectedOp.companyName],
                ["Contact Person", selectedOp.contactName],
                ["Email", selectedOp.email],
                ["Phone", selectedOp.phone],
                ["City", selectedOp.city],
                ["Fleet Size", selectedOp.fleetSize],
                ["Years in Operation", selectedOp.yearsInOperation],
                ["CAC Number", selectedOp.cacNumber || "—"],
                ["Applied", fmtDate(selectedOp.appliedAt)],
                ["Reviewed", selectedOp.reviewedAt ? fmtDate(selectedOp.reviewedAt) : "Not yet reviewed"],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-sm text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Vehicle types */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Vehicle Types</p>
              <div className="flex flex-wrap gap-2">
                {(selectedOp.vehicleTypes ?? []).map((t) => (
                  <span key={t} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Routes */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Preferred Routes</p>
              <p className="text-sm text-gray-700">{selectedOp.routes}</p>
            </div>

            {/* Additional info */}
            {selectedOp.additionalInfo && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Additional Information</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedOp.additionalInfo}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm approve / decline dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === "approve" ? "Approve Operator" : "Decline Operator"}
        message={
          confirmAction?.type === "approve"
            ? `Approve ${confirmAction?.name}? They will be able to create trips and accept bookings.`
            : `Decline ${confirmAction?.name}? They will be notified that their application was not accepted.`
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve" : "Decline"}
        variant={confirmAction?.type === "approve" ? "warning" : "danger"}
      />
    </div>
  );
}
