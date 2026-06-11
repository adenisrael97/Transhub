"use client";
import { useState, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import useToastStore from "@/store/toastStore";
import { getMyOperatorProfile, updateMyOperatorProfile } from "@/services/operators";

function ProfileField({ label, value, onChange, type = "text", editing, disabled }) {
  return (
    <div>
      <label className="block text-xs text-[#64748B] mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={!editing || disabled}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${
          editing && !disabled
            ? "border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] text-[#0F172A]"
            : "border-transparent bg-[#F8FAFC] text-[#64748B]"
        }`}
      />
    </div>
  );
}

const EMPTY = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  cacNumber: "",
  yearsInOperation: "",
  fleetSize: "",
  vehicleTypes: [],
  routes: "",
};

export default function OperatorProfilePage() {
  const [profile, setProfile] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastStore();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { operator } = await getMyOperatorProfile();
      setProfile(operator);
      setSaved(operator);
    } catch {
      toast.error("Failed to load profile. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { operator } = await updateMyOperatorProfile({
        companyName: profile.companyName,
        contactName: profile.contactName,
        phone:       profile.phone,
        city:        profile.city,
        routes:      profile.routes,
        fleetSize:   profile.fleetSize,
      });
      setProfile(operator);
      setSaved(operator);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      const msg = err?.message ?? "Failed to save profile. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setProfile(saved);
    setEditing(false);
  }

  const f = (label, name, type = "text", disabled = false, span = false) => (
    <div key={name} className={span ? "sm:col-span-2" : undefined}>
      <ProfileField
        label={label}
        value={profile[name]}
        onChange={(e) => setProfile({ ...profile, [name]: e.target.value })}
        type={type}
        editing={editing}
        disabled={disabled}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#64748B] text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Company Profile</h1>
            <p className="text-sm text-[#64748B]">Manage your operator profile and settings</p>
          </div>
          {!editing && (
            <Button variant="secondary" onClick={() => setEditing(true)} rightIcon={<Pencil size={14} />}>
              Edit Profile
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Company info */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Company Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Company Name",       "companyName")}
              {f("CAC Number",         "cacNumber",         "text", true)}
              {f("City",               "city")}
              {f("Years in Operation", "yearsInOperation",  "text", true)}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Contact Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Contact Person", "contactName")}
              {f("Phone Number",   "phone",       "tel")}
              {f("Email Address",  "email",       "email", true, true)}
            </div>
          </div>

          {/* Fleet info */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Fleet &amp; Routes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Fleet Size", "fleetSize")}
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Vehicle Types</label>
                <div className="flex flex-wrap gap-2 py-2">
                  {profile.vehicleTypes?.map((t) => (
                    <span key={t} className="bg-[#F0FDF4] text-[#16A34A] px-3 py-1 rounded-full text-xs font-semibold">{t}</span>
                  ))}
                </div>
              </div>
              {f("Covered Routes", "routes", "text", false, true)}
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
