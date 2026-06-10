"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, ArrowRight, Users, Phone, Info } from "lucide-react";
import Link from "next/link";
import VehicleSelector from "@/components/charter/VehicleSelector";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import useCharterStore from "@/store/charterStore";
import useToastStore from "@/store/toastStore";
import { createCharter } from "@/services/charters";
import useAuthStore from "@/store/authStore";
import { getErrorMessage } from "@/lib/utils";
import { CITIES } from "@/lib/constants";

const PURPOSES = [
  "Group Travel", "Corporate Trip", "Goods Delivery", "Event / Occasion",
  "School Excursion", "Airport Transfer", "Wedding",
];

export default function CharterPage() {
  const router = useRouter();
  const store  = useCharterStore();
  const toast  = useToastStore();
  const user   = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  // Charters require ≥24h lead time (enforced server-side). Steer the date
  // pickers to the earliest valid day so a user can't pick a date the API
  // would reject with a 409.
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login?redirect=/charter");
      return;
    }
    setLoading(true);
    try {
      await createCharter(store);
      store.reset();
      toast.success("Charter request submitted! We'll be in touch within 30 minutes.");
      router.push("/my-charters");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit charter request. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  // Operators and admins manage trips — they can't request charters as passengers.
  if (user && user.role !== "passenger") {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-linear-to-r from-[#92400E] to-[#D97706] py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              <Bus size={11} /> Charter
            </span>
            <h1 className="text-2xl font-bold text-white mb-1">Charter a Vehicle</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-[#FFFBEB] rounded-2xl flex items-center justify-center">
              <Info size={26} className="text-[#D97706]" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Charter is for passengers</h2>
            <p className="text-sm text-[#64748B] max-w-sm">
              You&apos;re signed in as an <strong>{user.role}</strong>. Charter requests are made by passengers.
              {user.role === "operator" && " Head to the Operator Portal to manage your trips and fleet."}
            </p>
            {user.role === "operator" && (
              <Button as={Link} href="/operator" variant="warning" size="lg">
                Go to Operator Portal
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#92400E] to-[#D97706] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <Bus size={11} /> Charter
          </span>
          <h1 className="text-2xl font-bold text-white mb-1">Charter a Vehicle</h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Need the whole vehicle? Book a charter for group travel, corporate trips, events, or bulk goods delivery across Nigeria.
          </p>
          <div className="flex flex-wrap gap-5 mt-5 text-xs text-white/80">
            <span className="flex items-center gap-1.5"><Users size={13} className="text-white/60" /> 1–100 passengers</span>
            <span className="flex items-center gap-1.5"><Phone size={13} className="text-white/60" /> Confirmed in 30 minutes</span>
            <span className="flex items-center gap-1.5"><ArrowRight size={13} className="text-white/60" /> One-way &amp; round trips</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vehicle selector */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Vehicle Type</h2>
            <VehicleSelector />
            {store.estimatedCost > 0 && (
              <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-sm text-[#92400E] font-medium">
                Estimated cost: <strong>₦{store.estimatedCost.toLocaleString()}</strong>
                {store.duration === "round-trip" && " (round-trip)"}
              </div>
            )}
          </div>

          {/* Route & schedule */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <h2 className="font-semibold text-[#0F172A]">Route &amp; Schedule</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Pickup Location" required value={store.pickupLocation} onChange={(e) => store.setField("pickupLocation", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Destination" required value={store.destination} onChange={(e) => store.setField("destination", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Input label="Departure Date" type="date" required min={minDate} value={store.date} onChange={(e) => store.setField("date", e.target.value)} />
              <Select label="Trip Type" value={store.duration} onChange={(e) => store.setField("duration", e.target.value)}>
                <option value="one-way">One-Way</option>
                <option value="round-trip">Round Trip</option>
              </Select>
              {store.duration === "round-trip" && (
                <Input label="Return Date" type="date" min={store.date || minDate} value={store.returnDate} onChange={(e) => store.setField("returnDate", e.target.value)} />
              )}
              <Input label="Number of Passengers" type="number" min="1" max="100" value={store.passengers} onChange={(e) => store.setField("passengers", Number(e.target.value))} />
              <Select label="Purpose" required value={store.purpose} onChange={(e) => store.setField("purpose", e.target.value)} wrapperClassName="sm:col-span-2">
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <h2 className="font-semibold text-[#0F172A]">Contact Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" required value={store.contactName} onChange={(e) => store.setField("contactName", e.target.value)} placeholder="Your name" />
              <Input label="Phone Number" required type="tel" value={store.contactPhone} onChange={(e) => store.setField("contactPhone", e.target.value)} placeholder="08012345678" />
              <Input label="Email" type="email" value={store.contactEmail} onChange={(e) => store.setField("contactEmail", e.target.value)} placeholder="you@email.com" wrapperClassName="sm:col-span-2" />
            </div>
          </div>

          <Button type="submit" loading={loading} variant="warning" fullWidth size="lg" disabled={!store.vehicleType}>
            Submit Charter Request
          </Button>
          <p className="text-xs text-center text-[#94A3B8]">
            Our team will call you within 30 minutes to confirm and collect payment.
          </p>
        </form>
      </div>
    </div>
  );
}
