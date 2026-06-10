"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, Package, Copy, Check, Search, ArrowRight, ShieldCheck,
  Loader2, AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AuthGuard from "@/components/shared/AuthGuard";
import { verifyWaybillPayment } from "@/services/waybills";

const MAX_POLLS = 6;        // ~15s
const POLL_INTERVAL_MS = 2500;

function PaySuccessContent() {
  const searchParams = useSearchParams();
  const waybillNo = searchParams.get("waybillNo") ?? "";
  const reference = searchParams.get("reference") ?? "";

  // verifying → success | failed | pending. We NEVER assume success from the
  // redirect alone — a cancelled/failed payment also lands here.
  const [status, setStatus] = useState(reference ? "verifying" : "pending");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    let polls = 0;

    async function poll() {
      polls += 1;
      try {
        const { state } = await verifyWaybillPayment(reference);
        if (cancelled) return;
        if (state === "success") { setStatus("success"); return; }
        if (state === "failed")  { setStatus("failed");  return; }
        // pending → keep polling until the webhook/verify settles
      } catch {
        // 4xx (e.g. not your waybill) — treat as failed; transient errors retry
      }
      if (cancelled) return;
      if (polls >= MAX_POLLS) { setStatus("pending"); return; }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [reference]);

  // Confetti only on a CONFIRMED payment.
  useEffect(() => {
    if (status !== "success") return;
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.55 },
        colors: ["#2563EB", "#16A34A", "#D97706", "#ffffff"],
      });
    }).catch(() => {});
  }, [status]);

  function copyWaybillNo() {
    if (!waybillNo) return;
    navigator.clipboard.writeText(waybillNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  // ---- Verifying ----------------------------------------------------------
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 size={26} className="text-[#2563EB] animate-spin" />
          </div>
          <p className="text-base font-semibold text-[#0F172A] mb-2">Confirming your payment…</p>
          <p className="text-sm text-[#64748B]">This takes a few seconds. Please don&apos;t close this tab.</p>
        </div>
      </div>
    );
  }

  // ---- Failed / cancelled -------------------------------------------------
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-[#DC2626]" />
          </div>
          <p className="text-base font-semibold text-[#0F172A] mb-2">Payment not completed</p>
          <p className="text-sm text-[#64748B] mb-6">
            Your payment was cancelled or didn&apos;t go through. Your waybill is still saved — you can complete payment from My Shipments.
          </p>
          <div className="space-y-2">
            <Button as={Link} href="/my-shipments" fullWidth>Go to My Shipments</Button>
            {waybillNo && (
              <Button as={Link} href={`/track/${waybillNo}`} variant="ghost" fullWidth>Track Parcel</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Pending (verification didn't settle in time) -----------------------
  if (status === "pending") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#FEF3C7] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-[#D97706]" />
          </div>
          <p className="text-base font-semibold text-[#0F172A] mb-2">Payment is processing</p>
          <p className="text-sm text-[#64748B] mb-6">
            If your payment went through, your shipment will update shortly. You can check its status in My Shipments.
          </p>
          <div className="space-y-2">
            <Button as={Link} href="/my-shipments" fullWidth>Go to My Shipments</Button>
            {waybillNo && (
              <Button as={Link} href={`/track/${waybillNo}`} variant="ghost" fullWidth>Track Parcel</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Success ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-14">
      <div className="max-w-md w-full">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={40} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Waybill Confirmed!</h1>
          <p className="text-sm text-[#94A3B8] text-center">
            Your parcel has been registered. Share the waybill number with the recipient.
          </p>
        </motion.div>

        {/* Waybill number card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mb-4"
        >
          <div className="bg-[#EFF6FF] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#2563EB]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Waybill Number</span>
            </div>
          </div>

          <div className="px-6 py-6 text-center">
            <p className="text-3xl font-black text-[#0F172A] font-mono tracking-wider mb-2">
              {waybillNo || "—"}
            </p>
            <p className="text-xs text-[#94A3B8] mb-4">
              Save this number — anyone can track your parcel with it.
            </p>
            <button
              onClick={copyWaybillNo}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied!" : "Copy number"}
            </button>
          </div>
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] px-6 py-5 mb-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Next Steps</p>
          <ul className="space-y-2.5 text-sm text-[#475569]">
            {[
              [CheckCircle2, "Confirmation email sent to your inbox", "#16A34A"],
              [Package,      "Hand over your parcel at the nearest TransHub terminal", "#2563EB"],
              [Search,       "Track your parcel anytime using the waybill number", "#2563EB"],
            ].map(([Icon, text, color], i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Icon size={15} style={{ color }} className="shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {waybillNo && (
            <Button
              as={Link}
              href={`/track/${waybillNo}`}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={16} />}
              className="flex-1"
            >
              Track Parcel
            </Button>
          )}
          <Button as={Link} href="/send" fullWidth size="lg" variant="secondary" className="flex-1">
            Send Another
          </Button>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-[#94A3B8] justify-center mt-5">
          <ShieldCheck size={13} className="text-[#16A34A]" />
          Secured by Paystack
        </div>
      </div>
    </div>
  );
}

export default function WaybillPaySuccessPage() {
  return (
    <AuthGuard>
      <PaySuccessContent />
    </AuthGuard>
  );
}
