"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Landmark, Smartphone, ShieldCheck, Ticket, ArrowRight, Clock, AlertTriangle, Loader2, Heart, ChevronDown, ChevronUp } from "lucide-react";
import useBookingStore from "@/store/bookingStore";
import useToastStore from "@/store/toastStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatTime, getErrorMessage } from "@/lib/utils";
import { checkoutSchema, validate } from "@/lib/validation";
import AuthGuard from "@/components/shared/AuthGuard";
import { initializePayment, verifyPayment } from "@/services/payments";

const EMPTY_PASSENGER = {
  name: "", phone: "", email: "",
  nextOfKinName: "", nextOfKinPhone: "", specialNeeds: "",
};

const PAYMENT_ICONS = { card: CreditCard, transfer: Landmark, ussd: Smartphone };
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS       = 15; // 30 seconds

// ---------------------------------------------------------------------------
// Countdown timer — MM:SS until hold expires
// ---------------------------------------------------------------------------
function useCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!expiresAt) return null;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (secondsLeft === null) return null;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, expired: secondsLeft === 0, secondsLeft };
}

// ---------------------------------------------------------------------------
// Payment-callback verifier — polls /payments/verify/:ref until booking confirmed
// ---------------------------------------------------------------------------
function PaymentVerifier({ reference }) {
  const router       = useRouter();
  const toast        = useToastStore();
  const { clearBooking } = useBookingStore();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [failed, setFailed]     = useState("");
  const pollRef = useRef(false);

  useEffect(() => {
    if (pollRef.current) return;
    pollRef.current = true;

    let count = 0;
    const poll = async () => {
      try {
        const result = await verifyPayment(reference);
        if (result.state === "success") {
          toast.success("Payment confirmed!");
          clearBooking();
          router.push(`/booking-success?bookingId=${result.booking.id}`);
          return;
        }
        if (result.state === "failed") {
          // Paystack reported the charge did not complete (cancelled / failed) —
          // stop immediately and offer a retry rather than spinning for 30s.
          clearBooking();
          setFailed(result.reason);
          return;
        }
        // state === "pending" → fall through and keep polling.
      } catch (err) {
        // A 4xx is a definite, non-transient failure (e.g. 403 — the reference
        // belongs to another user; 401 is already redirected to login by the API
        // client). Stop immediately and surface it rather than spinning for 30s.
        // 5xx / network errors fall through and keep polling — the webhook may
        // still be in flight and the API client already retried transient 5xx.
        const status = err?.status;
        if (status && status >= 400 && status < 500) {
          setFailed(getErrorMessage(err, "We couldn't verify this payment. Please check My Tickets."));
          return;
        }
      }

      count += 1;
      setAttempt(count);
      if (count >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      // Jitter (±up to 1s) so a wave of clients completing payment at the same
      // time (lunch-hour rush) doesn't poll in lockstep and stampede the API.
      setTimeout(poll, POLL_INTERVAL_MS + Math.random() * 1000);
    };

    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-[#DC2626]" />
          </div>
          <p className="text-base font-semibold text-[#0F172A] mb-2">Payment not completed</p>
          <p className="text-sm text-[#64748B] mb-6">{failed}</p>
          <div className="space-y-2">
            <Button fullWidth onClick={() => router.push("/search")}>
              Try Again
            </Button>
            <Button variant="ghost" fullWidth onClick={() => router.push("/tickets")}>
              Check My Tickets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#FEF3C7] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-[#D97706]" />
          </div>
          <p className="text-base font-semibold text-[#0F172A] mb-2">Payment is taking longer than expected</p>
          <p className="text-sm text-[#64748B] mb-6">
            If your payment went through, your booking will appear in{" "}
            <Link href="/tickets" className="text-[#2563EB] underline">My Tickets</Link>{" "}
            within a few minutes.
          </p>
          <Button fullWidth onClick={() => router.push("/tickets")}>
            Check My Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 size={26} className="text-[#2563EB] animate-spin" />
        </div>
        <p className="text-base font-semibold text-[#0F172A] mb-2">Verifying your payment…</p>
        <p className="text-sm text-[#64748B]">
          This takes a few seconds. Please don&apos;t close this tab.
        </p>
        {attempt >= 1 && (
          <p className="mt-4 text-xs text-[#94A3B8]">Still checking… ({attempt}/{MAX_POLLS})</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout form
// ---------------------------------------------------------------------------
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const {
    selectedTrip,
    quantity,
    expiresAt,
    setPassengers,
    setPaymentMethod,
    paymentMethod,
  } = useBookingStore();
  const toast = useToastStore();

  const countdown = useCountdown(expiresAt);

  const [passengers, setPassengerForms] = useState(
    Array.from({ length: quantity }, () => ({ ...EMPTY_PASSENGER }))
  );
  // Next of kin section open by default; key=passenger index, value=boolean
  const [expandedNok, setExpandedNok] = useState(
    Array.from({ length: quantity }, (_, i) => [i, true]).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const total = quantity * (selectedTrip?.price ?? 0);

  // Paystack redirects back to /checkout?reference=REF — show verifier instead of form
  if (reference) {
    return <PaymentVerifier reference={reference} />;
  }

  function updatePassenger(idx, field, value) {
    setPassengerForms((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setFieldErrors((prev) => ({ ...prev, [`passengers.${idx}.${field}`]: undefined }));
  }

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (countdown?.expired) {
      toast.error("Your seat hold has expired. Please select seats again.");
      router.push(`/trips/${selectedTrip?.id}`);
      return;
    }

    const result = validate(checkoutSchema, { passengers, paymentMethod });
    if (!result.success) {
      setFieldErrors(result.errors);
      setError("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      setPassengers(passengers);

      const tripId = selectedTrip?.id;

      const passengerPayload = passengers.map((p) => ({
        fullName:       p.name,
        phone:          p.phone,
        email:          p.email || undefined,
        nextOfKinName:  p.nextOfKinName,
        nextOfKinPhone: p.nextOfKinPhone,
        specialNeeds:   p.specialNeeds || undefined,
      }));

      const { authorizationUrl } = await initializePayment(tripId, passengerPayload);

      // Full-page redirect to Paystack hosted checkout
      window.location.href = authorizationUrl;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        toast.error("Seat hold expired or conflict detected. Please select seats again.");
        router.push(`/trips/${selectedTrip?.id}`);
      } else {
        const msg = getErrorMessage(err, "Could not initialize payment. Please try again.");
        toast.error(msg);
        setError(msg);
        setLoading(false);
      }
    }
    // Don't setLoading(false) on success — page is navigating away
  };

  if (!selectedTrip || quantity < 1) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={28} className="text-[#94A3B8]" />
          </div>
          <p className="text-lg font-semibold text-[#0F172A] mb-1">No booking in progress</p>
          <p className="text-sm text-[#94A3B8] mb-4">Select a trip and seats first</p>
          <Button onClick={() => router.push("/search")}>Search Trips</Button>
        </div>
      </div>
    );
  }

  const holdWarning = countdown && countdown.secondsLeft < 120 && !countdown.expired;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-[#0F172A]">Complete Your Booking</h1>

          {/* Hold countdown */}
          {countdown && !countdown.expired && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              holdWarning
                ? "bg-[#FEF3C7] text-[#D97706]"
                : "bg-[#EFF6FF] text-[#2563EB]"
            }`}>
              <Clock size={14} />
              Hold expires in {countdown.display}
            </div>
          )}

          {countdown?.expired && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FEE2E2] text-[#DC2626]">
              <AlertTriangle size={14} />
              Hold expired — please select seats again
            </div>
          )}
        </div>

        <form onSubmit={handlePay} className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            {/* Passenger forms */}
            {passengers.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                {/* Passenger header */}
                <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
                  <div className="w-7 h-7 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-xs font-bold text-[#2563EB]">
                    {i + 1}
                  </div>
                  <h2 className="font-semibold text-[#0F172A]">Passenger {i + 1}</h2>
                </div>

                <div className="p-6 space-y-4">
                  {/* Basic info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Full Name" required value={p.name} onChange={(e) => updatePassenger(i, "name", e.target.value)} placeholder="e.g. Emeka Okafor" error={fieldErrors[`passengers.${i}.name`]} />
                    <Input label="Phone Number" required type="tel" value={p.phone} onChange={(e) => updatePassenger(i, "phone", e.target.value)} placeholder="08012345678" error={fieldErrors[`passengers.${i}.phone`]} />
                    <Input label="Email" type="email" value={p.email} onChange={(e) => updatePassenger(i, "email", e.target.value)} placeholder="optional@email.com" wrapperClassName="sm:col-span-2" error={fieldErrors[`passengers.${i}.email`]} />
                  </div>

                  {/* Next of Kin — collapsible toggle */}
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedNok((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-[#EF4444]" />
                        <span className="text-sm font-semibold text-[#0F172A]">Next of Kin</span>
                        <span className="text-xs text-[#EF4444] font-medium">(Required)</span>
                      </div>
                      {expandedNok[i]
                        ? <ChevronUp size={14} className="text-[#94A3B8]" />
                        : <ChevronDown size={14} className="text-[#94A3B8]" />
                      }
                    </button>

                    {expandedNok[i] !== false && (
                      <div className="p-4 grid sm:grid-cols-2 gap-4 bg-white">
                        <Input
                          label="Next of Kin Full Name"
                          required
                          value={p.nextOfKinName}
                          onChange={(e) => updatePassenger(i, "nextOfKinName", e.target.value)}
                          placeholder="e.g. Ngozi Okafor"
                          error={fieldErrors[`passengers.${i}.nextOfKinName`]}
                        />
                        <Input
                          label="Next of Kin Phone"
                          required
                          type="tel"
                          value={p.nextOfKinPhone}
                          onChange={(e) => updatePassenger(i, "nextOfKinPhone", e.target.value)}
                          placeholder="08087654321"
                          error={fieldErrors[`passengers.${i}.nextOfKinPhone`]}
                        />
                      </div>
                    )}
                  </div>

                  {/* Special needs */}
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Special Needs / Accessibility{" "}
                      <span className="text-[#94A3B8] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={p.specialNeeds}
                      onChange={(e) => updatePassenger(i, "specialNeeds", e.target.value)}
                      placeholder="e.g. Requires wheelchair assistance, dietary restrictions, medical needs…"
                      rows={2}
                      maxLength={200}
                      className="w-full px-3 py-2.5 text-sm border border-[#D1D5DB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                    <p className="text-xs text-[#94A3B8] mt-1 text-right">{p.specialNeeds?.length ?? 0}/200</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-4">Payment Method</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((m) => {
                  const Icon   = PAYMENT_ICONS[m.id] ?? CreditCard;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                        active
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-[#E2E8F0] hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <Icon size={22} className={active ? "text-[#2563EB]" : "text-[#94A3B8]"} />
                      <span className={`text-xs font-semibold text-center ${active ? "text-[#2563EB]" : "text-[#475569]"}`}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-semibold text-[#0F172A] mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                {[
                  ["Route",      `${selectedTrip.from} → ${selectedTrip.to}`],
                  ["Departure",  formatTime(selectedTrip.departureTime)],
                  ["Passengers", String(quantity)],
                  ["Price/seat", `₦${selectedTrip.price?.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#94A3B8]">{label}</span>
                    <span className="font-medium text-[#0F172A] text-right max-w-35 truncate">{value}</span>
                  </div>
                ))}
                <div className="border-t border-[#F1F5F9] pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-[#2563EB]">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              disabled={countdown?.expired}
              rightIcon={<ArrowRight size={16} />}
            >
              Pay ₦{total.toLocaleString()}
            </Button>

            <div className="flex items-center gap-2 text-xs text-[#94A3B8] justify-center">
              <ShieldCheck size={13} className="text-[#16A34A]" />
              Secured by Paystack
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
