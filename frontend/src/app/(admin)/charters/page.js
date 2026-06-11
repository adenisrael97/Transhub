"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Bus, ArrowRight, MapPin, Users, Clock, DollarSign,
  Phone, Mail, User, FileText, Truck, CheckCircle, AlertCircle,
  ChevronRight, RefreshCw, Building2, Info,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { useServerList } from "@/hooks/useServerList";
import useToastStore from "@/store/toastStore";
import {
  getAllCharters,
  sendCharterQuote,
  adminConfirmBooking,
  completeCharter,
  cancelCharter,
} from "@/services/charters";
import { charterVehicleLabel } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLOR = {
  pending:          "bg-yellow-100 text-yellow-800",
  quote_sent:       "bg-blue-100 text-blue-800",
  awaiting_payment: "bg-orange-100 text-orange-800",
  confirmed:        "bg-green-100 text-green-800",
  completed:        "bg-purple-100 text-purple-800",
  cancelled:        "bg-gray-100 text-gray-600",
};

const STATUS_LABEL = {
  pending:          "Pending",
  quote_sent:       "Quote Sent",
  awaiting_payment: "Awaiting Payment",
  confirmed:        "Confirmed",
  completed:        "Completed",
  cancelled:        "Cancelled",
};

const TABS = [
  { label: "All",              value: "all"              },
  { label: "Pending",          value: "pending"          },
  { label: "Quote Sent",       value: "quote_sent"       },
  { label: "Awaiting Payment", value: "awaiting_payment" },
  { label: "Confirmed",        value: "confirmed"        },
  { label: "Completed",        value: "completed"        },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtPrice(price) {
  if (!price) return null;
  return `₦${Number(price).toLocaleString("en-NG")}`;
}

// ---------------------------------------------------------------------------
// Section header used inside detail modal
// ---------------------------------------------------------------------------

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F1F5F9]">
        {Icon && <Icon size={15} className="text-[#D97706]" />}
        <h3 className="text-sm font-semibold text-[#374151] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-[#F8FAFC] last:border-0">
      <span className="text-[#64748B] font-medium min-w-35">{label}</span>
      <span className={`text-[#0F172A] text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quote modal
// ---------------------------------------------------------------------------

function QuoteModal({ charter, onClose, onSuccess }) {
  const toast = useToastStore();
  const [form, setForm] = useState({
    operatorName: "",
    operatorCost: "",
    serviceFee: "",
    quotedPrice: "",
    adminNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const operatorCost = parseFloat(form.operatorCost);
    const serviceFee   = parseFloat(form.serviceFee);
    const quotedPrice  = parseFloat(form.quotedPrice);

    if (!form.operatorName.trim()) {
      toast.error("Operator name is required."); return;
    }
    if (isNaN(operatorCost) || operatorCost <= 0) {
      toast.error("Enter a valid operator cost."); return;
    }
    if (isNaN(serviceFee) || serviceFee < 0) {
      toast.error("Enter a valid service fee."); return;
    }
    if (isNaN(quotedPrice) || quotedPrice <= 0) {
      toast.error("Enter a valid final customer price."); return;
    }

    setSubmitting(true);
    try {
      const { charter: updated } = await sendCharterQuote(charter.id, {
        operatorName: form.operatorName.trim(),
        operatorCost,
        serviceFee,
        quotedPrice,
        adminNotes: form.adminNotes.trim() || undefined,
      });
      toast.success(`Quote of ${fmtPrice(updated.quotedPrice)} sent to ${updated.passenger.fullName}.`);
      onSuccess(updated);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to send quote.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen title="Send Quote" size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Charter summary */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 text-sm text-[#374151] mb-2">
          <p className="font-semibold text-[#0F172A]">
            {charter.fromLocation} → {charter.toLocation}
          </p>
          <p className="text-[#64748B] mt-0.5">
            {charterVehicleLabel(charter.vehicleType)} · {charter.passengerCount} passengers · {fmt(charter.departureAt)}
          </p>
          <p className="text-[#64748B]">Customer: {charter.passenger.fullName} ({charter.passenger.phone})</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Selected Operator <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.operatorName}
            onChange={(e) => setField("operatorName", e.target.value)}
            placeholder="e.g. ABC Transport Ltd"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Operator Cost (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="0" step="500" required
              value={form.operatorCost}
              onChange={(e) => setField("operatorCost", e.target.value)}
              placeholder="e.g. 120000"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              TransHub Service Fee (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="0" step="500" required
              value={form.serviceFee}
              onChange={(e) => setField("serviceFee", e.target.value)}
              placeholder="e.g. 15000"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Final Customer Price (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="0" step="500" required
            value={form.quotedPrice}
            onChange={(e) => setField("quotedPrice", e.target.value)}
            placeholder="e.g. 140000"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
          <p className="text-xs text-[#64748B] mt-1">
            This price is shown to the customer. Operator cost and service fee are internal.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Additional Notes (Optional)
          </label>
          <textarea
            value={form.adminNotes}
            onChange={(e) => setField("adminNotes", e.target.value)}
            placeholder="Any notes for the customer about the trip or operator..."
            rows={3}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="warning" size="sm" loading={submitting}>
            Send Quote
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Confirm Booking modal
// ---------------------------------------------------------------------------

function ConfirmBookingModal({ charter, onClose, onSuccess }) {
  const toast = useToastStore();
  const [form, setForm] = useState({
    assignedOperator: charter.assignedOperator || charter.operatorName || "",
    pickupInfo:       charter.pickupInfo || "",
    travelInfo:       charter.travelInfo || "",
  });
  const [submitting, setSubmitting] = useState(false);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.assignedOperator.trim()) { toast.error("Assigned operator is required."); return; }
    if (!form.pickupInfo.trim())       { toast.error("Pickup information is required."); return; }
    if (!form.travelInfo.trim())       { toast.error("Travel information is required."); return; }

    setSubmitting(true);
    try {
      const { charter: updated } = await adminConfirmBooking(charter.id, {
        assignedOperator: form.assignedOperator.trim(),
        pickupInfo:       form.pickupInfo.trim(),
        travelInfo:       form.travelInfo.trim(),
      });
      toast.success("Booking details updated. Customer has been notified.");
      onSuccess(updated);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen title="Confirm Booking Details" size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[#64748B] bg-blue-50 rounded-xl p-3 border border-blue-100">
          These details will be sent to the customer and shown on their booking page.
        </p>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Assigned Operator <span className="text-red-500">*</span>
          </label>
          <input
            type="text" required
            value={form.assignedOperator}
            onChange={(e) => setField("assignedOperator", e.target.value)}
            placeholder="e.g. ABC Transport Ltd"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Pickup Information <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={form.pickupInfo}
            onChange={(e) => setField("pickupInfo", e.target.value)}
            placeholder="e.g. Meet at Jibowu Motor Park, Lagos by 6:00 AM. Look for a white Toyota Coaster."
            rows={3}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Travel Information <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={form.travelInfo}
            onChange={(e) => setField("travelInfo", e.target.value)}
            placeholder="e.g. Bus plate number ABC-123-XY. Driver: John Doe (08012345678). Estimated journey: 4 hours."
            rows={3}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Update &amp; Notify Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Charter detail modal
// ---------------------------------------------------------------------------

function DetailModal({ charter, onClose, onUpdate }) {
  const toast = useToastStore();
  const [showQuoteModal, setShowQuoteModal]     = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completing, setCompleting]             = useState(false);
  const [cancelling, setCancelling]             = useState(false);

  if (!charter) return null;

  const statusClass = STATUS_COLOR[charter.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[charter.status] ?? charter.status;
  const ref         = charter.referenceNo ?? charter.id.slice(0, 8).toUpperCase();

  async function handleComplete() {
    if (!window.confirm("Mark this charter as completed?")) return;
    setCompleting(true);
    try {
      const { charter: updated } = await completeCharter(charter.id);
      toast.success("Charter marked as completed.");
      onUpdate(updated);
    } catch (err) {
      toast.error(err?.message || "Failed to complete charter.");
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this charter request? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const { charter: updated } = await cancelCharter(charter.id);
      toast.success("Charter cancelled.");
      onUpdate(updated);
    } catch (err) {
      toast.error(err?.message || "Failed to cancel charter.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <Modal isOpen title={`Charter ${ref}`} size="xl" onClose={onClose}>
        {/* Status badge */}
        <div className="flex items-center justify-between mb-6">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
          <span className="text-xs text-[#64748B]">Submitted {fmtDate(charter.createdAt)}</span>
        </div>

        {/* Customer Information */}
        <Section title="Customer Information" icon={User}>
          <InfoRow label="Name"         value={charter.passenger?.fullName} />
          <InfoRow label="Email"        value={charter.passenger?.email} />
          <InfoRow label="Phone"        value={charter.passenger?.phone} />
          {charter.contactName  && <InfoRow label="Contact Name"  value={charter.contactName} />}
          {charter.contactPhone && <InfoRow label="Contact Phone" value={charter.contactPhone} />}
          {charter.contactEmail && <InfoRow label="Contact Email" value={charter.contactEmail} />}
        </Section>

        {/* Trip Information */}
        <Section title="Trip Information" icon={MapPin}>
          <InfoRow label="From"         value={charter.fromLocation} />
          <InfoRow label="To"           value={charter.toLocation} />
          <InfoRow label="Departure"    value={fmt(charter.departureAt)} />
          {charter.returnAt && <InfoRow label="Return" value={fmt(charter.returnAt)} />}
          <InfoRow label="Vehicle Type" value={charterVehicleLabel(charter.vehicleType)} />
          <InfoRow label="Passengers"   value={`${charter.passengerCount} passenger${charter.passengerCount !== 1 ? "s" : ""}`} />
          {charter.notes && <InfoRow label="Special Requirements" value={charter.notes} />}
        </Section>

        {/* Quote Information */}
        {["quote_sent","awaiting_payment","confirmed","completed"].includes(charter.status) && (
          <Section title="Quote Information" icon={DollarSign}>
            <InfoRow label="Final Price (Customer)" value={fmtPrice(charter.quotedPrice)} />
            <InfoRow label="Operator"               value={charter.operatorName} />
            <InfoRow label="Operator Cost"          value={fmtPrice(charter.operatorCost)} />
            <InfoRow label="TransHub Fee"           value={fmtPrice(charter.serviceFee)} />
            {charter.adminNotes && <InfoRow label="Notes to Customer" value={charter.adminNotes} />}
          </Section>
        )}

        {/* Payment Information */}
        {charter.paidAt && (
          <Section title="Payment Information" icon={CheckCircle}>
            <InfoRow label="Payment Status" value="Paid" />
            <InfoRow label="Amount Paid"    value={fmtPrice(charter.paidAmount ?? charter.quotedPrice)} />
            <InfoRow label="Payment Date"   value={fmt(charter.paidAt)} />
            {charter.paymentRef && <InfoRow label="Transaction Ref" value={charter.paymentRef} mono />}
          </Section>
        )}

        {/* Operator / Booking Confirmation */}
        {(charter.assignedOperator || charter.pickupInfo || charter.travelInfo) && (
          <Section title="Booking Confirmation" icon={Truck}>
            <InfoRow label="Assigned Operator" value={charter.assignedOperator} />
            <InfoRow label="Pickup Info"        value={charter.pickupInfo} />
            <InfoRow label="Travel Info"        value={charter.travelInfo} />
          </Section>
        )}

        {/* Completion */}
        {charter.completedAt && (
          <Section title="Completion" icon={CheckCircle}>
            <InfoRow label="Completed On" value={fmt(charter.completedAt)} />
          </Section>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#F1F5F9]">
          {charter.status === "pending" && (
            <Button variant="warning" size="sm" onClick={() => setShowQuoteModal(true)}>
              Send Quote
            </Button>
          )}

          {charter.status === "confirmed" && (
            <>
              <Button variant="primary" size="sm" onClick={() => setShowConfirmModal(true)}>
                {charter.assignedOperator ? "Update Booking Details" : "Confirm Booking Details"}
              </Button>
              <Button
                variant="success" size="sm"
                loading={completing}
                onClick={handleComplete}
              >
                Mark Complete
              </Button>
            </>
          )}

          {["pending", "quote_sent", "awaiting_payment"].includes(charter.status) && (
            <Button
              variant="danger" size="sm"
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel Charter
            </Button>
          )}
        </div>
      </Modal>

      {showQuoteModal && (
        <QuoteModal
          charter={charter}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={(updated) => { onUpdate(updated); setShowQuoteModal(false); }}
        />
      )}

      {showConfirmModal && (
        <ConfirmBookingModal
          charter={charter}
          onClose={() => setShowConfirmModal(false)}
          onSuccess={(updated) => { onUpdate(updated); setShowConfirmModal(false); }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Charter list card (compact)
// ---------------------------------------------------------------------------

function CharterCard({ charter, onSelect }) {
  const statusClass = STATUS_COLOR[charter.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[charter.status] ?? charter.status;
  const ref         = charter.referenceNo ?? charter.id.slice(0, 8).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-[#D97706] hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded">
              {ref}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <p className="font-semibold text-[#0F172A] text-sm truncate">
            {charter.passenger?.fullName}
          </p>
          <p className="text-xs text-[#64748B]">{charter.passenger?.phone}</p>
        </div>
        <button
          onClick={() => onSelect(charter)}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-[#D97706] hover:text-[#B45309] bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          View <ChevronRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5 col-span-2">
          <MapPin size={11} className="text-[#64748B] shrink-0" />
          <span className="truncate font-medium text-[#374151]">
            {charter.fromLocation} → {charter.toLocation}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-[#64748B]" />
          <span>{fmtDate(charter.departureAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={11} className="text-[#64748B]" />
          <span>{charter.passengerCount} pax</span>
        </div>
        {charter.quotedPrice && (
          <div className="flex items-center gap-1.5 col-span-2 font-semibold text-[#D97706]">
            <DollarSign size={11} />
            <span>{fmtPrice(charter.quotedPrice)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminChartersPage() {
  const toast = useToastStore();
  void toast;

  const [selectedCharter, setSelected] = useState(null);

  const selectCharters = useCallback((res) => res.charters ?? [], []);
  const {
    items: charters, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: getAllCharters, select: selectCharters, limit: 12 });

  const activeStatus = filters.status ?? "all";
  const total = pagination?.total ?? 0;

  function handleUpdate(updated) {
    // Keep the detail modal showing fresh data, and refresh the underlying page.
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    refetch();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Charter Requests</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {loading ? "Loading…" : `${total.toLocaleString()} request${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={refetch} disabled={loading}
            leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
          >
            Refresh
          </Button>
        </div>

        {/* Search + filter tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search ref, route, customer…"
            className="w-full sm:w-72"
          />
          <FilterTabs
            items={TABS.map((t) => t.value)}
            labels={Object.fromEntries(TABS.map((t) => [t.value, t.label]))}
            active={activeStatus}
            onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm mb-6 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
                <div className="h-4 w-32 bg-[#F1F5F9] rounded mb-3" />
                <div className="h-5 w-44 bg-[#F1F5F9] rounded mb-2" />
                <div className="h-3 w-48 bg-[#F1F5F9] rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && charters.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
            <Bus size={40} className="mx-auto text-[#CBD5E1] mb-4" />
            <p className="text-[#64748B] font-medium">
              No {activeStatus !== "all" ? STATUS_LABEL[activeStatus] || activeStatus : ""} charter requests
            </p>
          </div>
        )}

        {/* Charter grid */}
        {!loading && !error && charters.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {charters.map((c) => (
                <CharterCard key={c.id} charter={c} onSelect={setSelected} />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedCharter && (
        <DetailModal
          charter={selectedCharter}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
