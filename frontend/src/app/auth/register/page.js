"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bus, Users, MapPin, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { registerSchema, validate } from "@/lib/validation";

const PERKS = [
  { icon: Users, text: "50,000+ happy travellers" },
  { icon: MapPin, text: "120+ routes across Nigeria" },
  { icon: Star,  text: "4.8★ average rating" },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { signUp } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // ignore re-entrant submits before the button disables
    setError("");
    setFieldErrors({});

    const result = validate(registerSchema, formData);
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }

    setLoading(true);
    try {
      const { fullName, email, phone, password } = result.data;
      await signUp({ fullName, email, phone, password });
    } catch (err) {
      // Surface the backend's message (e.g. "An account with this email already
      // exists") instead of a blanket failure — the old hardcoded string hid the
      // real reason and looked like an unstable/failed request.
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-105 shrink-0 bg-[#1E40AF] text-white p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bus size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">TransHub</span>
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold leading-snug mb-4">
            Travel smarter<br />with TransHub
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Create a free account and start booking interstate trips, sending goods, and chartering vehicles today.
          </p>
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-blue-100">
                <Icon size={16} className="text-[#FCD34D] shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-300">© {new Date().getFullYear()} TransHub Technologies Ltd.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden mb-6">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <Bus size={15} className="text-white" />
              </div>
              <span className="font-bold text-[#0F172A]">TransHub</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Create your account</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Join 50,000+ Nigerians on TransHub</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" error={fieldErrors.fullName} required />
              <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" error={fieldErrors.email} required />
              <Input label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 800 000 0000" error={fieldErrors.phone} required />
              <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" error={fieldErrors.password} required />
              <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" error={fieldErrors.confirmPassword} required />

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-[#E2E8F0] mt-0.5 accent-[#2563EB]" required />
                <span className="text-[#475569]">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#2563EB] hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}
              <Button type="submit" loading={loading} fullWidth size="lg">Create Account</Button>
            </form>

            <p className="text-center text-sm text-[#94A3B8] mt-5">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#2563EB] font-semibold hover:underline">Log In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
