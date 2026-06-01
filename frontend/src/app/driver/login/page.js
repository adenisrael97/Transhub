"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, Phone, Lock } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { driverLogin } from "@/services/auth";
import { getErrorMessage } from "@/lib/utils";

export default function DriverLoginPage() {
  const router   = useRouter();
  const loginFn  = useAuthStore((s) => s.login);

  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!phone.trim() || !password) {
      setError("Phone number and password are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await driverLogin(phone.trim(), password);
      loginFn(data.token);
      router.push("/driver/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid phone number or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#D97706] rounded-xl flex items-center justify-center">
            <Bus size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-[#0F172A] tracking-tight">TransHub</span>
            <span className="block text-xs font-semibold text-[#D97706]">Driver Portal</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#0F172A] mb-1">Driver Login</h1>
          <p className="text-sm text-[#64748B] mb-6">
            Enter your phone number and password to access your dashboard.
          </p>

          {error && (
            <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#D97706] text-white font-semibold rounded-xl text-sm hover:bg-[#B45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#94A3B8]">
            Your login credentials were provided by your operator.
          </p>
        </div>
      </div>
    </div>
  );
}
