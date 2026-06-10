"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bus, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { resetPasswordSchema, validate } from "@/lib/validation";
import { resetPassword } from "@/services/auth";
import { getErrorMessage } from "@/lib/utils";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);

  // After a successful reset, send the user to login automatically (with a
  // manual fallback button) so the new password can be used right away.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/auth/login"), 2500);
    return () => clearTimeout(t);
  }, [done, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = validate(resetPasswordSchema, { password, confirmPassword });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, result.data.password);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't reset your password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // No token in the URL → the link is malformed or was opened directly.
  const missingToken = !token;

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
            Create a new<br />password
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Choose a strong password you haven&apos;t used before. You&apos;ll use it to log in next time.
          </p>
          <div className="flex items-center gap-3 text-sm text-blue-100">
            <ShieldCheck size={16} className="text-[#FCD34D] shrink-0" />
            Your password is encrypted and never stored in plain text
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
            <h1 className="text-2xl font-bold text-[#0F172A]">Set a new password</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Almost there — pick a new password below</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            {missingToken ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={26} className="text-[#DC2626]" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-2">Invalid reset link</h2>
                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  This password reset link is missing or malformed. Please request a new one.
                </p>
                <Button as={Link} href="/auth/forgot-password" fullWidth>
                  Request a New Link
                </Button>
              </div>
            ) : done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={26} className="text-[#16A34A]" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-2">Password reset</h2>
                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  Your password has been updated. Redirecting you to log in…
                </p>
                <Button as={Link} href="/auth/login" fullWidth>
                  Go to Log In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a new password"
                  hint="At least 8 characters with upper & lowercase letters and a number"
                  error={fieldErrors.password}
                  autoFocus
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  error={fieldErrors.confirmPassword}
                  required
                />
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    {error}
                    <Link
                      href="/auth/forgot-password"
                      className="block mt-1 font-semibold underline"
                    >
                      Request a new reset link
                    </Link>
                  </div>
                )}
                <Button type="submit" loading={loading} fullWidth size="lg">
                  Reset Password
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#94A3B8]">Loading…</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
