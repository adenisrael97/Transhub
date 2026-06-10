"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bus, MailCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { forgotPasswordSchema, validate } from "@/lib/validation";
import { forgotPassword } from "@/services/auth";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = validate(forgotPasswordSchema, { email });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(result.data.email);
      // The API intentionally returns the same response whether or not the email
      // exists, so we always move to the confirmation state — no enumeration.
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't send the reset link. Please try again."));
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
            Forgot your<br />password?
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            No worries — it happens. Enter your email and we&apos;ll send you a secure link to set a new one.
          </p>
          <div className="flex items-center gap-3 text-sm text-blue-100">
            <ShieldCheck size={16} className="text-[#FCD34D] shrink-0" />
            Reset links expire after 1 hour for your security
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
            <h1 className="text-2xl font-bold text-[#0F172A]">Reset your password</h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              We&apos;ll email you a link to create a new password
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck size={26} className="text-[#2563EB]" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-2">Check your email</h2>
                <p className="text-sm text-[#475569] leading-relaxed mb-1">
                  If an account exists for{" "}
                  <span className="font-semibold text-[#0F172A] break-all">{email}</span>, you&apos;ll
                  receive a password reset link shortly.
                </p>
                <p className="text-xs text-[#94A3B8] mb-6">
                  Didn&apos;t get it? Check your spam folder or try again in a few minutes.
                </p>
                <Button as={Link} href="/auth/login" variant="secondary" fullWidth>
                  Back to Log In
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    error={fieldErrors.email}
                    autoFocus
                    required
                  />
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    Send Reset Link
                  </Button>
                </form>

                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-[#2563EB] font-semibold hover:underline mt-5"
                >
                  <ArrowLeft size={15} />
                  Back to Log In
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
