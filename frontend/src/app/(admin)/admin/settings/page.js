"use client";

import AccountSettings from "@/components/shared/AccountSettings";

// The AdminShell layout already wraps this in AuthGuard role="admin".
export default function AdminSettingsPage() {
  return (
    <AccountSettings
      title="Account Settings"
      subtitle="Manage your administrator account and password"
      accent="blue"
    />
  );
}
