"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bus, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import useAuthStore from "@/store/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loginSchema, validate } from "@/lib/validation";
import { getErrorMessage } from "@/lib/utils";

const PERKS = [
  { icon: CheckCircle2, text: "Instant e-ticket delivery" },
  { icon: ShieldCheck,  text: "Secured by Paystack" },
  { icon: Clock,        text: "24/7 customer support" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { signIn } = useAuth({ redirectTo });
  const router = useRouter();

  const handleDemoLogin = () => {
    if (process.env.NODE_ENV !== "development") return;
    useAuthStore.setState({
      user: { fullName: "Admin User", email: "admin@transhub.ng", role: "admin" },
      token: "demo-token",
      isAuthenticated: true,
    });
    router.push("/admin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = validate(loginSchema, { email, password });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }

    setLoading(true);
    try {
      await signIn(result.data.email, result.data.password);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password. Please try again."));
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
            Nigeria&apos;s #1<br />Transport Platform
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Book seats, send goods, and charter vehicles across all 36 states — from your phone.
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

      {/* Right form area */}
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
            <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Log in to your TransHub account</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={fieldErrors.email}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                error={fieldErrors.password}
                required
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-[#E2E8F0] accent-[#2563EB]" />
                  <span className="text-[#475569]">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[#2563EB] hover:underline text-xs font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}
              <Button type="submit" loading={loading} fullWidth size="lg">
                Log In
              </Button>
            </form>

            <p className="text-center text-sm text-[#94A3B8] mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-[#2563EB] font-semibold hover:underline">
                Sign Up
              </Link>
            </p>

            {/* Dev only: bypass auth for quick admin UI testing without backend credentials */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-5 pt-5 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#94A3B8] text-center mb-3">No backend? Try the demo</p>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors"
                >
                  Demo Login as Admin
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#94A3B8]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
