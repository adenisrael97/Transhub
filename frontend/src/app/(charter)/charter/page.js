"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VehicleSelector from "@/components/charter/VehicleSelector";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import useCharterStore from "@/store/charterStore";
import useToastStore from "@/store/toastStore";
import { createCharter } from "@/services/charters";
import { CITIES } from "@/lib/constants";
const PURPOSES = ["Group Travel","Corporate Trip","Goods Delivery","Event / Occasion","School Excursion","Airport Transfer","Wedding"];

export default function CharterPage() {
  const router = useRouter();
  const store = useCharterStore();
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createCharter(store);
      toast.success("Charter request submitted! We'll call you within 30 minutes.");
      router.push("/");
    } catch {
      if (process.env.NODE_ENV === 'development') {
        toast.success("Charter request submitted! (dev mock)");
        router.push("/");
      } else {
        toast.error("Failed to submit charter request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Charter</span>
          <h1 className="text-3xl font-extrabold text-gray-900">Charter a Vehicle</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Need the whole vehicle? Book a charter for group travel, corporate trips, events, or bulk goods delivery across Nigeria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <VehicleSelector />
            {store.estimatedCost > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800 font-medium">
                Estimated cost: <strong>₦{store.estimatedCost.toLocaleString()}</strong>
                {store.duration === "round-trip" && " (round-trip)"}
              </div>
            )}
          </div>

          {/* Route & dates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Route &amp; Schedule</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Pickup Location" required value={store.pickupLocation} onChange={(e) => store.setField("pickupLocation", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Destination" required value={store.destination} onChange={(e) => store.setField("destination", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Input label="Departure Date" type="date" required value={store.date} onChange={(e) => store.setField("date", e.target.value)} />
              <Select label="Trip Type" value={store.duration} onChange={(e) => store.setField("duration", e.target.value)}>
                <option value="one-way">One-Way</option>
                <option value="round-trip">Round Trip</option>
              </Select>
              {store.duration === "round-trip" && (
                <Input label="Return Date" type="date" value={store.returnDate} onChange={(e) => store.setField("returnDate", e.target.value)} />
              )}
              <Input label="Number of Passengers" type="number" min="1" max="100" value={store.passengers} onChange={(e) => store.setField("passengers", Number(e.target.value))} />
              <Select label="Purpose" required value={store.purpose} onChange={(e) => store.setField("purpose", e.target.value)} wrapperClassName="sm:col-span-2">
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Contact Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" required value={store.contactName} onChange={(e) => store.setField("contactName", e.target.value)} placeholder="Your name" />
              <Input label="Phone Number" required type="tel" value={store.contactPhone} onChange={(e) => store.setField("contactPhone", e.target.value)} placeholder="08012345678" />
              <Input label="Email" type="email" value={store.contactEmail} onChange={(e) => store.setField("contactEmail", e.target.value)} placeholder="you@email.com" wrapperClassName="sm:col-span-2" />
            </div>
          </div>

          <Button type="submit" loading={loading} variant="warning" fullWidth size="lg" disabled={!store.vehicleType}>
            Submit Charter Request →
          </Button>
          <p className="text-xs text-center text-gray-400">Our team will call you within 30 minutes to confirm and collect payment.</p>
        </form>
      </div>
    </div>
  );
}
