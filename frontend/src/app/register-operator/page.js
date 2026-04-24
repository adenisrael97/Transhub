"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import { CITIES } from "@/lib/constants";
import useOperatorStore from "@/store/operatorStore";

const VEHICLE_TYPE_OPTIONS = [
  "Bus",
  "Luxury Bus",
  "Coaster",
  "Mini Bus",
  "SUV / Car",
  "Pickup Truck",
  "Cargo Van",
];

const FLEET_SIZE_OPTIONS = [
  "1–5",
  "6–15",
  "16–30",
  "31–50",
  "51–100",
  "100+",
];

const BENEFITS = [
  {
    icon: "📈",
    title: "Grow Your Business",
    desc: "Access thousands of travellers searching for trips daily across Nigeria.",
  },
  {
    icon: "💳",
    title: "Instant Payments",
    desc: "Receive payments directly to your account within 24 hours of each trip.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Track bookings, revenue, seat occupancy, and performance in real time.",
  },
  {
    icon: "🛡️",
    title: "Insurance Coverage",
    desc: "All trips are covered by our comprehensive passenger insurance policy.",
  },
  {
    icon: "📱",
    title: "Driver App",
    desc: "Your drivers get a dedicated app to manage manifests and check-ins.",
  },
  {
    icon: "🤝",
    title: "Dedicated Support",
    desc: "Get a dedicated account manager and 24/7 operational support.",
  },
];

const STEPS = [
  { num: "01", title: "Apply Online", desc: "Fill out the registration form with your company details, fleet information, and preferred routes." },
  { num: "02", title: "Review & Verification", desc: "Our operations team reviews your application and verifies your company documents within 48 hours." },
  { num: "03", title: "Onboarding", desc: "Once approved, our team onboards you — set up routes, pricing, schedules, and driver accounts." },
  { num: "04", title: "Go Live!", desc: "Start receiving bookings from thousands of passengers across Nigeria on TransHub." },
];

export default function RegisterOperatorPage() {
  const router = useRouter();
  const addOperator = useOperatorStore((s) => s.addOperator);

  const [step, setStep] = useState(1); // 1 = info page, 2 = form, 3 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    fleetSize: "",
    vehicleTypes: [],
    routes: "",
    yearsInOperation: "",
    cacNumber: "",
    additionalInfo: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const field = (k) => ({ value: form[k], onChange: (e) => set(k, e.target.value) });

  function toggleVehicleType(type) {
    setForm((f) => ({
      ...f,
      vehicleTypes: f.vehicleTypes.includes(type)
        ? f.vehicleTypes.filter((t) => t !== type)
        : [...f.vehicleTypes, type],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.vehicleTypes.length === 0) {
      setError("Please select at least one vehicle type.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // In production this would call registerOperator(form) from @/services/operators
      await new Promise((r) => setTimeout(r, 1200)); // simulate API call
      addOperator(form);
      setStep(3);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2 leading-relaxed">
            Thank you, <strong>{form.companyName}</strong>. Your operator registration has been received.
          </p>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Our team will review your application and get back to you within <strong>48 hours</strong> via email at <strong>{form.email}</strong>.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 text-left">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">What&apos;s Next?</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                You&apos;ll receive a confirmation email shortly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                Our operations team reviews your documents
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                Once approved, we&apos;ll schedule an onboarding call
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push("/")} variant="secondary">
              Back to Home
            </Button>
            <Button onClick={() => { setStep(1); setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", fleetSize: "", vehicleTypes: [], routes: "", yearsInOperation: "", cacNumber: "", additionalInfo: "" }); }}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Info / landing section (step 1) ───────────────────────────────
  if (step === 1) {
    return (
      <div className="bg-white text-[#0F172A]">

        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now accepting new operators
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-5">
              Grow your transport<br />
              <span className="text-[#FCD34D]">business with TransHub</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Join Nigeria&apos;s fastest-growing interstate transport platform. Reach more passengers, fill more seats, and manage your operations effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setStep(2)}>
                Register as Operator →
              </Button>
              <Link href="/contact" className="border-2 border-white/40 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors text-base text-center">
                Talk to Our Team
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-gray-100 bg-white py-8 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: "50+", label: "Active Operators" },
              { value: "500+", label: "Vehicles Listed" },
              { value: "50,000+", label: "Monthly Passengers" },
              { value: "36", label: "States Covered" },
            ].map((s) => (
              <div key={s.label} className="text-center px-4 py-2">
                <p className="text-3xl font-extrabold text-blue-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="py-24 px-4 bg-[#F8FAFF]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                Why Partner With Us
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold">
                Everything you need to<br />grow your fleet
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all">
                  <div className="text-3xl">{b.icon}</div>
                  <div>
                    <h4 className="font-bold mb-1">{b.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                Simple Process
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold">Get started in 4 steps</h2>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-linear-to-r from-blue-600 via-blue-500 to-green-600" />
              {STEPS.map((s, i) => (
                <div key={s.num} className="text-center relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-5 shadow-lg ${i === 3 ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
                    {s.num}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{s.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-linear-to-br from-blue-700 via-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">Ready to start earning?</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Registration is free. No hidden fees. Start receiving bookings within days of approval.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-bold transition-colors text-base"
            >
              Register Your Company →
            </button>
            <p className="text-blue-200 text-sm mt-6">
              Already an operator?{" "}
              <Link href="/operator/login" className="text-white font-semibold underline hover:text-blue-100">
                Log in here
              </Link>
            </p>
          </div>
        </section>
      </div>
    );
  }

  // ─── Registration form (step 2) ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-2xl mx-auto px-4 py-14">
        {/* Back link */}
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to info
        </button>

        <div className="mb-8">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Operator Registration
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">Register Your Company</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Fill out the form below to apply as a transport operator on TransHub. We&apos;ll review your application within 48 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg">🏢</div>
              <h2 className="font-semibold text-gray-900">Company Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company / Business Name" required placeholder="e.g. Peace Mass Transit" {...field("companyName")} />
              <Input label="CAC Registration Number" placeholder="e.g. RC-123456" hint="Optional for sole proprietors" {...field("cacNumber")} />
              <Input label="Years in Operation" type="number" min="0" required placeholder="e.g. 5" {...field("yearsInOperation")} />
              <Select label="Head Office City" required value={form.city} onChange={(e) => set("city", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-lg">👤</div>
              <h2 className="font-semibold text-gray-900">Contact Person</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" required placeholder="e.g. John Okafor" {...field("contactName")} />
              <Input label="Phone Number" type="tel" required placeholder="08012345678" {...field("phone")} />
              <Input label="Email Address" type="email" required placeholder="info@company.com" wrapperClassName="sm:col-span-2" {...field("email")} />
            </div>
          </div>

          {/* Fleet Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-lg">🚌</div>
              <h2 className="font-semibold text-gray-900">Fleet Details</h2>
            </div>

            <Select label="Fleet Size" required value={form.fleetSize} onChange={(e) => set("fleetSize", e.target.value)}>
              <option value="">How many vehicles?</option>
              {FLEET_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} vehicles</option>
              ))}
            </Select>

            {/* Vehicle type checkboxes */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Vehicle Types <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VEHICLE_TYPE_OPTIONS.map((type) => {
                  const selected = form.vehicleTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleVehicleType(type)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                        selected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-100 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {selected ? "✓ " : ""}{type}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Preferred Routes"
              required
              placeholder="e.g. Lagos → Abuja, Lagos → Ibadan, Kano → Abuja"
              hint="Comma-separated list of routes you want to operate"
              {...field("routes")}
            />
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-lg">📝</div>
              <h2 className="font-semibold text-gray-900">Additional Information</h2>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Tell us more about your company
              </label>
              <textarea
                value={form.additionalInfo}
                onChange={(e) => set("additionalInfo", e.target.value)}
                rows={4}
                placeholder="Any additional information about your company, certifications, safety record, or special services you offer..."
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm px-1">
            <input type="checkbox" className="rounded border-gray-300 mt-1" required />
            <span className="text-gray-600">
              I confirm that the information provided is accurate and I agree to TransHub&apos;s{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Submit Registration →
          </Button>
          <p className="text-xs text-center text-gray-400">
            Free to apply · Review within 48 hours · No hidden fees
          </p>
        </form>
      </div>
    </div>
  );
}
