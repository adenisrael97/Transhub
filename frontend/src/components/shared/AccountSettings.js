"use client";

/**
 * Reusable account-settings panel shared by the passenger, operator, and admin
 * dashboards. It edits the signed-in user's OWN account (the `users` table via
 * /users/me) — full name, email, phone, and password — so the same component
 * works for every role that owns a User row.
 *
 * After a profile change the backend returns a freshly-signed JWT (the old one's
 * embedded name/email/phone are stale); we swap it into the auth store via
 * login(token) so the navbar and any other token-derived UI update immediately
 * and survive a reload.
 */
import { useState, useEffect, useCallback } from "react";
import { User, Mail, Phone, Lock, Save, ShieldCheck, Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useToastStore from "@/store/toastStore";
import useAuthStore from "@/store/authStore";
import { getMe, updateProfile, changePassword } from "@/services/users";
import { validate, profileUpdateSchema, changePasswordSchema } from "@/lib/validation";
import { getErrorMessage } from "@/lib/utils";

const EMPTY_PROFILE = { name: "", email: "", phone: "" };
const EMPTY_PW = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function AccountSettings({
  title = "Settings",
  subtitle = "Manage your account information and password",
  accent = "blue",
  extra = null,
}) {
  const toast = useToastStore();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState(EMPTY_PROFILE);
  const [saved, setSaved] = useState(EMPTY_PROFILE);
  const [profileErrors, setProfileErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState(EMPTY_PW);
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const isGreen = accent === "green";
  const iconBox = isGreen ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#EFF6FF] text-[#2563EB]";
  const saveVariant = isGreen ? "success" : "primary";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { user } = await getMe();
      const next = {
        name: user.fullName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      };
      setForm(next);
      setSaved(next);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Couldn't load your account. Please refresh."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    form.name !== saved.name ||
    form.email !== saved.email ||
    form.phone !== saved.phone;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileErrors({});

    const result = validate(profileUpdateSchema, form);
    if (!result.success) {
      setProfileErrors(result.errors);
      return;
    }
    if (!dirty) {
      toast.info("No changes to save");
      return;
    }

    // Send only what actually changed — matches the backend's "at least one
    // field" contract and avoids a needless email-uniqueness check on no-ops.
    const payload = {};
    if (form.name !== saved.name) payload.name = result.data.name;
    if (form.email !== saved.email) payload.email = result.data.email;
    if (form.phone !== saved.phone) payload.phone = result.data.phone;

    setSavingProfile(true);
    try {
      const { user, token } = await updateProfile(payload);
      // Refresh the token-derived identity everywhere (navbar, guards, etc.).
      login(token);
      const next = {
        name: user.fullName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      };
      setForm(next);
      setSaved(next);
      toast.success("Profile updated");
    } catch (err) {
      if (err?.status === 409) {
        setProfileErrors({ email: err.message || "That email is already in use" });
      } else {
        toast.error(getErrorMessage(err, "Couldn't save changes. Please try again."));
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwErrors({});

    const result = validate(changePasswordSchema, pw);
    if (!result.success) {
      setPwErrors(result.errors);
      return;
    }

    setSavingPw(true);
    try {
      await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw(EMPTY_PW);
      toast.success("Password updated");
    } catch (err) {
      // 400 from this endpoint means the current password was wrong (the new
      // password is already validated client-side) — surface it on that field
      // rather than as a toast.
      if (err?.status === 400) {
        setPwErrors({ currentPassword: err.message || "Current password is incorrect" });
      } else {
        toast.error(getErrorMessage(err, "Couldn't update password. Please try again."));
      }
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBox}`}>
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">{title}</h1>
            <p className="text-sm text-[#64748B]">{subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-5">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <div className="h-5 w-40 bg-[#F1F5F9] rounded mb-5 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-11 bg-[#F1F5F9] rounded-xl animate-pulse" />
                  <div className="h-11 bg-[#F1F5F9] rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
            <p className="text-sm text-[#DC2626] mb-4">{loadError}</p>
            <Button variant="secondary" onClick={load}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile */}
            <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-5">
                <User size={16} className="text-[#94A3B8]" />
                <h2 className="font-semibold text-[#0F172A]">Profile</h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={profileErrors.name}
                  leadingIcon={<User size={16} />}
                  autoComplete="name"
                />
                <Input
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={profileErrors.email}
                  leadingIcon={<Mail size={16} />}
                  autoComplete="email"
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={profileErrors.phone}
                  leadingIcon={<Phone size={16} />}
                  autoComplete="tel"
                />
              </div>

              <div className="flex justify-end mt-5">
                <Button
                  type="submit"
                  variant={saveVariant}
                  loading={savingProfile}
                  disabled={savingProfile || !dirty}
                  leftIcon={<Save size={15} />}
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>

            {/* Password */}
            <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={16} className="text-[#94A3B8]" />
                <h2 className="font-semibold text-[#0F172A]">Password</h2>
              </div>
              <p className="text-xs text-[#94A3B8] mb-5">
                Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.
              </p>

              <div className="space-y-4">
                <Input
                  label="Current password"
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  error={pwErrors.currentPassword}
                  autoComplete="current-password"
                />
                <Input
                  label="New password"
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  error={pwErrors.newPassword}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={pw.confirmPassword}
                  onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                  error={pwErrors.confirmPassword}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex justify-end mt-5">
                <Button
                  type="submit"
                  variant={saveVariant}
                  loading={savingPw}
                  disabled={savingPw}
                  leftIcon={<ShieldCheck size={15} />}
                >
                  {savingPw ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>

            {extra}
          </div>
        )}
      </div>
    </div>
  );
}
