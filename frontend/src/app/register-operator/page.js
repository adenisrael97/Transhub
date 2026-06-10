"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, CreditCard, BarChart3, ShieldCheck, Smartphone, HeartHandshake, Building2, User, Bus, FileText, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import { CITIES } from "@/lib/constants";
import { registerOperator } from "@/services/operators";

const VEHICLE_TYPE_OPTIONS = ["Bus", "Luxury Bus", "Coaster", "Mini Bus", "SUV / Car", "Pickup Truck", "Cargo Van"];
const FLEET_SIZE_OPTIONS   = ["1–5", "6–15", "16–30", "31–50", "51–100", "100+"];

const BENEFITS = [
  { Icon: TrendingUp,    color: "#2563EB", title: "Grow Your Business",    desc: "Access thousands of travellers searching for trips daily across Nigeria." },
  { Icon: CreditCard,    color: "#16A34A", title: "Instant Payments",      desc: "Receive payments directly to your account within 24 hours of each trip." },
  { Icon: BarChart3,     color: "#2563EB", title: "Analytics Dashboard",   desc: "Track bookings, revenue, seat occupancy, and performance in real time." },
  { Icon: ShieldCheck,   color: "#16A34A", title: "Insurance Coverage",    desc: "All trips are covered by our comprehensive passenger insurance policy." },
  { Icon: Smartphone,    color: "#D97706", title: "Driver App",            desc: "Your drivers get a dedicated app to manage manifests and check-ins." },
  { Icon: HeartHandshake, color: "#2563EB", title: "Dedicated Support",   desc: "Get a dedicated account manager and 24/7 operational support." },
];

const STEPS = [
  { num: "01", title: "Apply Online",         desc: "Fill out the registration form with your company details, fleet information, and preferred routes." },
  { num: "02", title: "Review & Verification", desc: "Our operations team reviews your application and verifies your company documents within 48 hours." },
  { num: "03", title: "Onboarding",            desc: "Once approved, our team onboards you — set up routes, pricing, schedules, and driver accounts." },
  { num: "04", title: "Go Live!",              desc: "Start receiving bookings from thousands of passengers across Nigeria on TransHub." },
];

const FORM_SECTIONS = [
  { Icon: Building2, color: "#2563EB", bg: "#EFF6FF", label: "Company Information" },
  { Icon: User,      color: "#16A34A", bg: "#F0FDF4", label: "Contact Person"      },
  { Icon: Bus,       color: "#D97706", bg: "#FFFBEB", label: "Fleet Details"       },
  { Icon: FileText,  color: "#2563EB", bg: "#EFF6FF", label: "Additional Info"     },
];

export default function RegisterOperatorPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "", contactName: "", email: "", phone: "", city: "",
    fleetSize: "", vehicleTypes: [], routes: "", yearsInOperation: "",
    cacNumber: "", additionalInfo: "",
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
    if (loading) return; // ignore re-entrant submits before the button disables
    if (form.vehicleTypes.length === 0) { setError("Please select at least one vehicle type."); return; }
    setLoading(true);
    setError("");
    try {
      await registerOperator(form);
      setStep(3);
    } catch (err) {
      setError(err?.message || err?.error?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success ──────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Application Submitted!</h1>
          <p className="text-sm text-[#64748B] mb-1 leading-relaxed">
            Thank you, <strong>{form.companyName}</strong>. Your operator registration has been received.
          </p>
          <p className="text-sm text-[#64748B] mb-7 leading-relaxed">
            Our team will review your application and get back to you within <strong>48 hours</strong> via email at <strong>{form.email}</strong>.
          </p>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-3">What&apos;s Next?</p>
            <ul className="space-y-2.5 text-sm text-[#475569]">
              {[
                [CheckCircle2, "You'll receive a confirmation email shortly",    "#16A34A"],
                [ArrowRight,   "Our operations team reviews your documents",     "#2563EB"],
                [ArrowRight,   "Once approved, we'll schedule an onboarding call", "#2563EB"],
              ].map(([Icon, text, color], i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Icon size={14} style={{ color }} className="shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")} variant="secondary" fullWidth>Back to Home</Button>
            <Button
              fullWidth
              onClick={() => { setStep(1); setForm({ companyName: "", contactName: "", email: "", phone: "", city: "", fleetSize: "", vehicleTypes: [], routes: "", yearsInOperation: "", cacNumber: "", additionalInfo: "" }); }}
            >
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Info page (step 1) ────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="bg-white text-[#0F172A]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D97706]/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse" />
              Now accepting new operators
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-5">
              Grow your transport<br />
              <span className="text-[#FCD34D]">business with TransHub</span>
            </h1>
            <p className="text-[#CBD5E1] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Join Nigeria&apos;s fastest-growing interstate transport platform. Reach more passengers, fill more seats, and manage your operations effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setStep(2)}>Register as Operator</Button>
              <Link href="/contact" className="border-2 border-white/40 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm text-center">
                Talk to Our Team
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-[#E2E8F0] py-8 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E2E8F0]">
            {[["50+","Active Operators"],["500+","Vehicles Listed"],["50,000+","Monthly Passengers"],["36","States Covered"]].map(([v,l]) => (
              <div key={l} className="text-center px-4 py-2">
                <p className="text-3xl font-extrabold text-[#2563EB]">{v}</p>
                <p className="text-sm text-[#64748B] mt-1">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-[#EFF6FF] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Why Partner With Us</span>
              <h2 className="text-3xl font-extrabold">Everything you need to grow your fleet</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {BENEFITS.map(({ Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F172A] mb-1">{title}</h4>
                    <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-[#EFF6FF] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Simple Process</span>
              <h2 className="text-3xl font-extrabold">Get started in 4 steps</h2>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-linear-to-r from-[#2563EB] via-[#2563EB] to-[#16A34A]" />
              {STEPS.map((s, i) => (
                <div key={s.num} className="text-center relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-5 shadow-lg ${i === 3 ? "bg-[#16A34A] text-white" : "bg-[#2563EB] text-white"}`}>
                    {s.num}
                  </div>
                  <h4 className="font-bold text-lg text-[#0F172A] mb-2">{s.title}</h4>
                  <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-linear-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold mb-4">Ready to start earning?</h2>
            <p className="text-[#BFDBFE] mb-8 leading-relaxed">Registration is free. No hidden fees. Start receiving bookings within days of approval.</p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-white text-[#2563EB] hover:bg-[#EFF6FF] px-8 py-3 rounded-xl font-bold transition-colors text-sm"
            >
              Register Your Company
            </button>
            <p className="text-[#93C5FD] text-sm mt-5">
              Already an operator?{" "}
              <Link href="/operator/login" className="text-white font-semibold underline hover:text-[#BFDBFE]">Log in here</Link>
            </p>
          </div>
        </section>
      </div>
    );
  }

  // ── Registration form (step 2) ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2563EB] font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back to info
        </button>

        <div className="mb-8">
          <span className="inline-block bg-[#EFF6FF] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Operator Registration
          </span>
          <h1 className="text-2xl font-bold text-[#0F172A]">Register Your Company</h1>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            Fill out the form below to apply as a transport operator on TransHub. We&apos;ll review your application within 48 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={17} className="text-[#2563EB]" />
              </div>
              <h2 className="font-semibold text-[#0F172A]">Company Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company / Business Name" required placeholder="e.g. Peace Mass Transit" {...field("companyName")} />
              <Input label="CAC Registration Number" placeholder="e.g. RC-123456" hint="Optional for sole proprietors" {...field("cacNumber")} />
              <Input label="Years in Operation" type="number" min="0" required placeholder="e.g. 5" {...field("yearsInOperation")} />
              <Select label="Head Office City" required value={form.city} onChange={(e) => set("city", e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#F0FDF4] rounded-xl flex items-center justify-center shrink-0">
                <User size={17} className="text-[#16A34A]" />
              </div>
              <h2 className="font-semibold text-[#0F172A]">Contact Person</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" required placeholder="e.g. John Okafor" {...field("contactName")} />
              <Input label="Phone Number" type="tel" required placeholder="08012345678" {...field("phone")} />
              <Input label="Email Address" type="email" required placeholder="info@company.com" wrapperClassName="sm:col-span-2" {...field("email")} />
            </div>
          </div>

          {/* Fleet Details */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#FFFBEB] rounded-xl flex items-center justify-center shrink-0">
                <Bus size={17} className="text-[#D97706]" />
              </div>
              <h2 className="font-semibold text-[#0F172A]">Fleet Details</h2>
            </div>
            <Select label="Fleet Size" required value={form.fleetSize} onChange={(e) => set("fleetSize", e.target.value)}>
              <option value="">How many vehicles?</option>
              {FLEET_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} vehicles</option>)}
            </Select>
            <div>
              <p className="text-sm font-medium text-[#0F172A] mb-2">Vehicle Types <span className="text-red-500">*</span></p>
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
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#BFDBFE]"
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
              placeholder="e.g. Lagos → Abuja, Lagos → Ibadan"
              hint="Comma-separated list of routes you want to operate"
              {...field("routes")}
            />
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center shrink-0">
                <FileText size={17} className="text-[#2563EB]" />
              </div>
              <h2 className="font-semibold text-[#0F172A]">Additional Information</h2>
            </div>
            <div>
              <label className="text-sm font-medium text-[#0F172A] block mb-1">Tell us more about your company</label>
              <textarea
                value={form.additionalInfo}
                onChange={(e) => set("additionalInfo", e.target.value)}
                rows={4}
                placeholder="Any additional information about your company, certifications, safety record, or special services…"
                className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm px-1">
            <input type="checkbox" className="rounded border-[#E2E8F0] mt-1" required />
            <span className="text-[#64748B]">
              I confirm that the information provided is accurate and I agree to TransHub&apos;s{" "}
              <Link href="/terms" className="text-[#2563EB] hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl p-4 text-sm">{error}</div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">Submit Registration</Button>
          <p className="text-xs text-center text-[#94A3B8]">Free to apply · Review within 48 hours · No hidden fees</p>
        </form>
      </div>
    </div>
  );
}
