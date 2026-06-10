"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bus, ArrowRight, MapPin, Clock, CheckCircle, XCircle,
  DollarSign, Truck, Info, AlertCircle, Users, Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AuthGuard from "@/components/shared/AuthGuard";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { useServerList } from "@/hooks/useServerList";
import {
  getMyCharters,
  acceptCharterQuote,
  rejectCharterQuote,
  initiateCharterPayment,
  verifyCharterPayment,
} from "@/services/charters";
import useToastStore from "@/store/toastStore";
import { charterVehicleLabel } from "@/lib/constants";

const STATUS_TABS = ["all", "pending", "quote_sent", "awaiting_payment", "confirmed", "completed", "cancelled"];
const TAB_LABELS = {
  all: "All", pending: "Pending", quote_sent: "Quoted", awaiting_payment: "To Pay",
  confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled",
};

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
  pending:          "Awaiting Quote",
  quote_sent:       "Quote Available",
  awaiting_payment: "Awaiting Payment",
  confirmed:        "Confirmed",
  completed:        "Completed",
  cancelled:        "Cancelled",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtPrice(price) {
  if (!price) return null;
  return `₦${Number(price).toLocaleString("en-NG")}`;
}

// ---------------------------------------------------------------------------
// Charter card
// ---------------------------------------------------------------------------

function CharterCard({ charter, onRefresh }) {
  const toast = useToastStore();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [paying,    setPaying]    = useState(false);

  const statusClass = STATUS_COLOR[charter.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[charter.status] ?? charter.status;
  const ref         = charter.referenceNo ?? charter.id.slice(0, 8).toUpperCase();

  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptCharterQuote(charter.id);
      toast.success("Quote accepted! You can now complete payment.");
      onRefresh();
    } catch (err) {
      toast.error(err?.message || "Could not accept quote. Please try again.");
      setAccepting(false);
    }
  }

  async function handleReject() {
    if (!window.confirm("Reject this quote? The charter request will be cancelled.")) return;
    setRejecting(true);
    try {
      await rejectCharterQuote(charter.id);
      toast.info("Quote rejected. The charter has been cancelled.");
      onRefresh();
    } catch (err) {
      toast.error(err?.message || "Could not reject quote. Please try again.");
      setRejecting(false);
    }
  }

  async function handlePay() {
    setPaying(true);
    try {
      const { paymentUrl } = await initiateCharterPayment(charter.id);
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err?.message || "Could not initiate payment. Please try again.");
      setPaying(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded">
                {ref}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
              <Bus size={14} className="text-[#D97706] shrink-0" />
              <span className="text-sm">{charterVehicleLabel(charter.vehicleType)}</span>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Route & date */}
        <div className="flex items-center gap-2 text-sm text-[#374151] mb-2">
          <MapPin size={13} className="text-[#94A3B8] shrink-0" />
          <span className="font-medium">{charter.fromLocation}</span>
          <ArrowRight size={12} className="text-[#94A3B8]" />
          <span className="font-medium">{charter.toLocation}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#64748B] mb-3">
          <span className="flex items-center gap-1.5">
            <Clock size={11} className="text-[#94A3B8]" />
            {fmt(charter.departureAt)}
          </span>
          {charter.returnAt && (
            <span className="flex items-center gap-1.5">
              <ArrowRight size={11} className="text-[#94A3B8]" />
              Return: {fmt(charter.returnAt)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={11} className="text-[#94A3B8]" />
            {charter.passengerCount} pax
          </span>
        </div>
      </div>

      {/* Status-specific sections */}

      {/* Pending: waiting for admin */}
      {charter.status === "pending" && (
        <div className="px-5 pb-5">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex items-start gap-2">
            <Info size={14} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              Your request has been received. We&apos;re sourcing a transport operator and will
              send you a quote shortly (usually within 30 minutes).
            </p>
          </div>
        </div>
      )}

      {/* Quote sent: accept or reject */}
      {charter.status === "quote_sent" && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0F172A]">Quote Ready</p>
            <p className="text-lg font-bold text-[#D97706]">{fmtPrice(charter.quotedPrice)}</p>
          </div>
          {charter.adminNotes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
              <p className="text-xs text-blue-800">{charter.adminNotes}</p>
            </div>
          )}
          <p className="text-xs text-[#64748B] mb-4">
            Review the quote above. Accept to proceed to payment, or reject to cancel.
          </p>
          <div className="flex gap-3">
            <Button
              variant="warning" size="sm" loading={accepting}
              onClick={handleAccept}
              leftIcon={<CheckCircle size={13} />}
            >
              Accept Quote
            </Button>
            <Button
              variant="ghost" size="sm" loading={rejecting}
              onClick={handleReject}
              leftIcon={<XCircle size={13} />}
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Awaiting payment */}
      {charter.status === "awaiting_payment" && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0F172A]">Complete Payment</p>
            <p className="text-lg font-bold text-[#D97706]">{fmtPrice(charter.quotedPrice)}</p>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            Quote accepted. Click below to complete payment and secure your charter.
          </p>
          <Button variant="warning" size="sm" loading={paying} onClick={handlePay}
            leftIcon={<DollarSign size={13} />}
          >
            Pay Now
          </Button>
        </div>
      )}

      {/* Confirmed: show booking details */}
      {charter.status === "confirmed" && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700">Payment Confirmed</p>
          </div>

          {charter.assignedOperator ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Truck size={13} className="text-[#94A3B8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">Operator</p>
                  <p className="text-[#0F172A] font-semibold">{charter.assignedOperator}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={13} className="text-[#94A3B8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">Pickup</p>
                  <p className="text-[#374151]">{charter.pickupInfo}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Info size={13} className="text-[#94A3B8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#94A3B8] font-medium">Travel Details</p>
                  <p className="text-[#374151]">{charter.travelInfo}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-start gap-2">
              <Info size={13} className="text-green-700 shrink-0 mt-0.5" />
              <p className="text-xs text-green-800">
                Payment received! Our team is finalising the booking details and will
                update this page shortly with your operator and pickup information.
              </p>
            </div>
          )}

          {charter.paidAt && (
            <p className="text-xs text-[#94A3B8] mt-3">
              Paid {fmt(charter.paidAt)} · {fmtPrice(charter.paidAmount ?? charter.quotedPrice)}
            </p>
          )}
        </div>
      )}

      {/* Completed */}
      {charter.status === "completed" && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={15} className="text-[#0A1B3D]" />
            <p className="text-sm font-semibold text-[#0A1B3D]">Trip Completed</p>
          </div>
          <p className="text-xs text-[#64748B]">
            This charter journey has been completed. Thank you for choosing TransHub!
          </p>
          {charter.completedAt && (
            <p className="text-xs text-[#94A3B8] mt-2">Completed on {fmt(charter.completedAt)}</p>
          )}
        </div>
      )}

      {/* Cancelled */}
      {charter.status === "cancelled" && (
        <div className="border-t border-[#F1F5F9] px-5 py-4">
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-gray-500" />
            <p className="text-sm text-[#64748B]">Charter cancelled.</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 pb-4">
        <p className="text-xs text-[#CBD5E1]">Submitted {fmt(charter.createdAt)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content (inside AuthGuard)
// ---------------------------------------------------------------------------

function MyChartersContent() {
  const toast        = useToastStore();
  const router       = useRouter();
  const searchParams = useSearchParams();
  // Paystack redirects back to /my-charters?reference=... after a charter
  // payment. Confirmation is webhook-driven and may land a beat after the
  // redirect, so we poll until the charter flips to confirmed.
  const reference    = searchParams.get("reference");

  const [verifying, setVerifying] = useState(Boolean(reference));

  const selectCharters = useCallback((res) => res.charters ?? [], []);
  const {
    items: charters, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: getMyCharters, select: selectCharters, limit: 10 });

  const activeStatus = filters.status ?? "all";

  // Resolve payment after returning from Paystack. Webhook-independent: we ask
  // the backend to verify with Paystack directly, so a confirmed payment shows
  // immediately even if the webhook is delayed, and a cancelled/failed one is
  // reported as such (the charter stays awaiting_payment so "Pay Now" can retry).
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let attempts  = 0;
    const MAX_ATTEMPTS = 8;       // ~20s total
    const INTERVAL_MS  = 2500;

    const clearRef = () => router.replace("/my-charters", { scroll: false });

    async function poll() {
      attempts += 1;
      // Find the charter this reference belongs to so we can verify by id. The
      // just-paid charter is the newest, so it lands on page 1 of the default
      // (newest-first) list — fetch that directly to resolve the id.
      let charterId = null;
      try {
        const res = await getMyCharters();
        if (cancelled) return;
        charterId = (res.charters ?? []).find((c) => c.paymentRef === reference)?.id ?? null;
      } catch {
        /* transient — fall through to retry */
      }

      if (charterId) {
        try {
          const { state } = await verifyCharterPayment(charterId);
          if (cancelled) return;
          if (state === "success") {
            setVerifying(false);
            toast.success("Payment confirmed — your charter is booked!");
            refetch();
            clearRef();
            return;
          }
          if (state === "failed") {
            setVerifying(false);
            toast.error("Payment was not completed. You can try paying again.");
            refetch();
            clearRef();
            return;
          }
          // state === "pending" → keep polling.
        } catch {
          /* transient — keep polling */
        }
      }

      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setVerifying(false);
        toast.info("Payment received. Confirmation is processing — refresh in a moment.");
        clearRef();
        return;
      }
      setTimeout(poll, INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const verifyingBanner = verifying ? (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
      <Loader2 size={18} className="text-[#D97706] animate-spin shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#92400E]">Confirming your payment…</p>
        <p className="text-xs text-[#B45309]">This usually takes a few seconds. Please don&apos;t close this page.</p>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {verifyingBanner}

      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search ref, route…"
          className="w-full sm:w-60"
        />
        <FilterTabs
          items={STATUS_TABS}
          labels={TAB_LABELS}
          active={activeStatus}
          onChange={(tab) => setFilter({ status: tab === "all" ? undefined : tab })}
          color="amber"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 animate-pulse">
              <div className="h-4 w-24 bg-[#F1F5F9] rounded mb-3" />
              <div className="h-5 w-36 bg-[#F1F5F9] rounded mb-2" />
              <div className="h-3 w-56 bg-[#F1F5F9] rounded mb-2" />
              <div className="h-3 w-40 bg-[#F1F5F9] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      ) : charters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Bus size={40} className="mx-auto text-[#CBD5E1] mb-4" />
          <p className="text-[#64748B] font-medium mb-1">No charter requests found</p>
          <p className="text-sm text-[#94A3B8] mb-6">
            Need a full vehicle? Submit a charter request and we&apos;ll quote you within 30 minutes.
          </p>
          <Link
            href="/charter"
            className="inline-flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Charter a Vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {charters.map((c) => (
            <CharterCard key={c.id} charter={c} onRefresh={refetch} />
          ))}
          <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyChartersPage() {
  return (
    <AuthGuard allowedRoles={["passenger"]}>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-linear-to-r from-[#92400E] to-[#D97706] py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-1">My Charter Requests</h1>
            <p className="text-sm text-white/70">Track and manage your charter bookings</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-end mb-6">
            <Link
              href="/charter"
              className="inline-flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Bus size={14} /> New Charter
            </Link>
          </div>
          <MyChartersContent />
        </div>
      </div>
    </AuthGuard>
  );
}
