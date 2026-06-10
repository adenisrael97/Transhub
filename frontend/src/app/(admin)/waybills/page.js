"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, ArrowRight, RefreshCw, Building2, DollarSign, Truck, ChevronDown, ChevronUp, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { useServerList } from "@/hooks/useServerList";
import useToastStore from "@/store/toastStore";
import {
  listWaybills,
  sendQuote,
  updateWaybillStatus,
  listApprovedOperators,
} from "@/services/waybills";
import { getErrorMessage } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  pending:        "Pending Review",
  quote_sent:     "Quote Sent",
  paid:           "Paid",
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

// What action(s) an admin can take at each status
const NEXT_ACTIONS = {
  paid:           [{ label: "Mark Dropped Off",          status: "dropped_off" }],
  dropped_off:    [{ label: "Mark Picked Up by Carrier", status: "picked_up" }],
  picked_up:      [{ label: "Mark In Transit",           status: "in_transit" }],
  in_transit:     [{ label: "Mark Arrived at Hub",       status: "arrived_at_hub" }],
  arrived_at_hub: [{ label: "Mark Completed",            status: "completed" }],
};

const TABS = [
  { label: "All",             value: "all"          },
  { label: "Pending",         value: "pending"      },
  { label: "Quote Sent",      value: "quote_sent"   },
  { label: "Paid",            value: "paid"         },
  { label: "In Transit",      value: "in_transit"   },
  { label: "Arrived",         value: "arrived_at_hub" },
  { label: "Completed",       value: "completed"    },
];

function fmtFee(fee) {
  if (!fee || Number(fee) === 0) return "No quote yet";
  return `₦${Number(fee).toLocaleString("en-NG")}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ── Quote Modal ────────────────────────────────────────────────────────────

function QuoteModal({ waybill, operators, onClose, onSent }) {
  const toast = useToastStore();
  const [form, setForm] = useState({ assignedOperatorId: "", quoteAmount: "", quoteNote: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.assignedOperatorId) { toast.error("Select a transport company"); return; }
    if (!form.quoteAmount || Number(form.quoteAmount) <= 0) { toast.error("Enter a valid quote amount"); return; }
    setSaving(true);
    try {
      const updated = await sendQuote(waybill.id, {
        assignedOperatorId: form.assignedOperatorId,
        quoteAmount: parseFloat(form.quoteAmount),
        quoteNote: form.quoteNote || undefined,
      });
      toast.success("Quote sent to customer!");
      onSent(updated);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send quote"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Send Quote">
      <div className="space-y-4">
        <div className="bg-[#F8FAFC] rounded-xl p-4 text-sm space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
            <span>{waybill.fromLocation}</span>
            <ArrowRight size={13} className="text-[#94A3B8]" />
            <span>{waybill.toLocation}</span>
          </div>
          <p className="text-[#475569]">Sender: {waybill.senderName}</p>
          <p className="text-[#475569]">Recipient: {waybill.recipientName} · {waybill.description}</p>
          {waybill.weightKg && <p className="text-[#475569]">Weight: {waybill.weightKg} kg</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
              Assign Transport Company <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.assignedOperatorId}
              onChange={(e) => setForm((f) => ({ ...f, assignedOperatorId: e.target.value }))}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">Select transport company…</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>{op.companyName} — {op.city}</option>
              ))}
            </select>
            {operators.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No approved operators found. Approve operators first.</p>
            )}
          </div>

          <Input
            label="Quote Amount (₦)"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 3500"
            required
            value={form.quoteAmount}
            onChange={(e) => setForm((f) => ({ ...f, quoteAmount: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Note to Customer (optional)</label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g. Package will be handled with care. Contact us for fragile items."
              value={form.quoteNote}
              onChange={(e) => setForm((f) => ({ ...f, quoteNote: e.target.value }))}
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button type="submit" fullWidth loading={saving}>Send Quote</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── Status Update Modal ────────────────────────────────────────────────────

function StatusModal({ waybill, nextAction, onClose, onUpdated }) {
  const toast = useToastStore();
  const [form, setForm] = useState({ location: "", note: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateWaybillStatus(waybill.id, {
        status:   nextAction.status,
        location: form.location || undefined,
        note:     form.note || undefined,
      });
      toast.success(`Status updated to "${STATUS_LABEL[nextAction.status]}"`);
      onUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={nextAction.label}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[#475569]">
          Update waybill <span className="font-mono font-bold text-[#0F172A]">{waybill.waybillNo}</span> to{" "}
          <span className="font-semibold text-[#2563EB]">{STATUS_LABEL[nextAction.status]}</span>.
        </p>
        <Input
          label="Location (optional)"
          placeholder="e.g. Lagos Bus Terminal"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Note (optional)</label>
          <textarea
            rows={2}
            maxLength={500}
            placeholder="Any additional info…"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={saving}>{nextAction.label}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Waybill row card ───────────────────────────────────────────────────────

function WaybillRow({ waybill, operators, onUpdate }) {
  const [expanded,   setExpanded]   = useState(false);
  const [showQuote,  setShowQuote]  = useState(false);
  const [statusModal, setStatusModal] = useState(null); // nextAction object

  const badgeClass = STATUS_COLOR[waybill.status] ?? "bg-gray-100 text-gray-600";
  const label      = STATUS_LABEL[waybill.status]  ?? waybill.status;
  const actions    = NEXT_ACTIONS[waybill.status]  ?? [];

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Main row */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium mb-0.5">Waybill</p>
              <p className="text-base font-bold text-[#0F172A] font-mono">{waybill.waybillNo}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
              {label}
            </span>
          </div>

          {/* Route + sender */}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            {waybill.fromLocation} <ArrowRight size={13} className="text-[#94A3B8]" /> {waybill.toLocation}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-[#64748B]">
            <span>Sender: <strong className="text-[#0F172A]">{waybill.senderName}</strong></span>
            <span>Recipient: <strong className="text-[#0F172A]">{waybill.recipientName}</strong></span>
            <span>Created: <strong className="text-[#0F172A]">{fmtDate(waybill.createdAt)}</strong></span>
            <span>Fee: <strong className={Number(waybill.fee) > 0 ? "text-[#16A34A]" : "text-[#94A3B8]"}>{fmtFee(waybill.fee)}</strong></span>
            {waybill.assignedOperator && (
              <span>Carrier: <strong className="text-[#0F172A]">{waybill.assignedOperator.companyName}</strong></span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {waybill.status === "pending" && (
              <Button size="sm" onClick={() => setShowQuote(true)} rightIcon={<DollarSign size={13} />}>
                Send Quote
              </Button>
            )}
            {actions.map((action) => (
              <Button key={action.status} size="sm" variant="secondary" onClick={() => setStatusModal(action)}>
                {action.label}
              </Button>
            ))}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-auto text-xs text-[#94A3B8] flex items-center gap-1 hover:text-[#475569]"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? "Less" : "Details"}
            </button>
          </div>
        </div>

        {/* Expanded: timeline */}
        {expanded && waybill.events?.length > 0 && (
          <div className="border-t border-[#F1F5F9] px-5 py-4 bg-[#F8FAFC] space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Timeline</p>
            {waybill.events.map((ev, i) => (
              <div key={ev.id ?? i} className="flex items-start gap-3 text-xs text-[#475569]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[#0F172A]">{STATUS_LABEL[ev.status] ?? ev.status}</span>
                  {ev.note && <span className="text-[#64748B]"> — {ev.note}</span>}
                  {ev.location && <span className="text-[#94A3B8]"> · {ev.location}</span>}
                  <span className="text-[#CBD5E1] ml-2">{fmtDate(ev.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuote && (
        <QuoteModal
          waybill={waybill}
          operators={operators}
          onClose={() => setShowQuote(false)}
          onSent={onUpdate}
        />
      )}

      {statusModal && (
        <StatusModal
          waybill={waybill}
          nextAction={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdated={onUpdate}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminWaybillsPage() {
  const toast = useToastStore();
  const [operators, setOperators] = useState([]);

  const selectWaybills = useCallback((res) => res.waybills ?? [], []);
  const {
    items: waybills, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: listWaybills, select: selectWaybills, limit: 15 });

  const activeTab = filters.status ?? "all";

  // Approved operators for the assignment dropdown — fetched once.
  useEffect(() => {
    let active = true;
    listApprovedOperators()
      .then((ops) => { if (active) setOperators(ops); })
      .catch((err) => toast.error(getErrorMessage(err, "Failed to load operators")));
    return () => { active = false; };
  }, [toast]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  function handleUpdate() {
    refetch();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Waybill Management</h1>
          <p className="text-sm text-[#64748B]">Review requests, send quotes, and manage shipment lifecycle.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={refetch} loading={loading} rightIcon={<RefreshCw size={13} />}>
          Refresh
        </Button>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search waybill no, sender, recipient, route…"
          className="w-full sm:w-72"
        />
        <FilterTabs
          items={TABS.map((t) => t.value)}
          labels={Object.fromEntries(TABS.map((t) => [t.value, t.label]))}
          active={activeTab}
          onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse h-32" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && waybills.length === 0 && (
        <div className="text-center py-16">
          <Package size={32} className="text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#475569] font-semibold">No waybills found</p>
          <p className="text-sm text-[#94A3B8]">
            {activeTab === "all" ? "No waybill requests yet." : `No waybills with status "${STATUS_LABEL[activeTab] ?? activeTab}".`}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && waybills.length > 0 && (
        <>
          <div className="space-y-4">
            {waybills.map((w) => (
              <WaybillRow key={w.id} waybill={w} operators={operators} onUpdate={handleUpdate} />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}
    </div>
  );
}
