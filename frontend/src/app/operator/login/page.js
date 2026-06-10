"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bus, BarChart3, Route, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/utils";

const PERKS = [
  { icon: BarChart3, text: "Real-time revenue analytics" },
  { icon: Route,     text: "Full trip & fleet management" },
  { icon: Shield,    text: "Secure operator dashboard" },
];

export default function OperatorLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const { signIn } = useAuth({ redirectTo: "/operator" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left panel — green accent for operator */}
      <div className="hidden lg:flex flex-col justify-between w-105 shrink-0 bg-[#14532D] text-white p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bus size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">TransHub</span>
        </Link>
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-4">
            Operator Portal
          </span>
          <h2 className="text-3xl font-extrabold leading-snug mb-4">
            Manage your fleet<br />from anywhere
          </h2>
          <p className="text-green-200 text-sm leading-relaxed mb-8">
            Access your operator dashboard to manage trips, bookings, fleet, and revenue — all in one place.
          </p>
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-green-100">
                <Icon size={16} className="text-[#4ADE80] shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-green-400">© {new Date().getFullYear()} TransHub Technologies Ltd.</p>
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
              <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center">
                <Bus size={15} className="text-white" />
              </div>
              <span className="font-bold text-[#0F172A]">TransHub</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-[#F0FDF4] text-[#16A34A] px-3 py-1 rounded-full border border-[#BBF7D0] mb-3">
              <Bus size={11} /> Operator Portal
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Sign in to your portal</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Manage your fleet, trips and bookings</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}
              <Button type="submit" loading={loading} fullWidth size="lg" variant="success">
                Log In
              </Button>
            </form>

            <p className="text-center text-sm text-[#94A3B8] mt-5">
              Not registered?{" "}
              <Link href="/register-operator" className="text-[#16A34A] font-semibold hover:underline">
                Apply as an Operator
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
