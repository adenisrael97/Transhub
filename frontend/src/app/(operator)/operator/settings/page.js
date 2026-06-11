"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import AccountSettings from "@/components/shared/AccountSettings";

// The OperatorShell layout already wraps this in AuthGuard role="operator".
export default function OperatorSettingsPage() {
  return (
    <AccountSettings
      title="Account Settings"
      subtitle="Manage your personal login details and password"
      accent="green"
      extra={
        <Link
          href="/operator/profile"
          className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:border-[#16A34A] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#0F172A]">Company profile</p>
              <p className="text-sm text-[#64748B] truncate">
                Edit your company name, city, fleet, and routes
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-[#64748B] shrink-0" />
        </Link>
      }
    />
  );
}
