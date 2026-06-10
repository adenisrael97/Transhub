"use client";

import AuthGuard from "@/components/shared/AuthGuard";
import AccountSettings from "@/components/shared/AccountSettings";

export default function PassengerSettingsPage() {
  return (
    <AuthGuard>
      <AccountSettings
        title="Account Settings"
        subtitle="Manage your personal information and password"
        accent="blue"
      />
    </AuthGuard>
  );
}
