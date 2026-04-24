"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import useToastStore from "@/store/toastStore";

const INITIAL = {
  companyName: "Peace Mass Transit",
  contactName: "Obiora Nwankwo",
  email: "info@peacemasstransit.com",
  phone: "08031234567",
  city: "Enugu",
  address: "45 Ogui Road, Enugu, Enugu State",
  cacNumber: "RC-123456",
  yearsInOperation: "15+",
  fleetSize: "120+",
  vehicleTypes: ["Bus", "Luxury Bus"],
  routes: "Lagos, Abuja, Enugu, Owerri, Port Harcourt",
  bankName: "First Bank of Nigeria",
  accountNumber: "301*****89",
  accountName: "Peace Mass Transit Ltd",
};

function ProfileField({ label, value, onChange, type = "text", editing, disabled }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={!editing || disabled}
        className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-colors ${
          editing && !disabled
            ? "border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            : "border-transparent bg-gray-50 text-gray-600"
        }`}
      />
    </div>
  );
}

export default function OperatorProfilePage() {
  const [profile, setProfile] = useState(INITIAL);
  const [editing, setEditing] = useState(false);
  const toast = useToastStore();

  function handleSave(e) {
    e.preventDefault();
    setEditing(false);
    toast.success("Profile updated successfully");
  }

  const f = (label, name, type = "text", disabled = false) => (
    <ProfileField
      label={label}
      value={profile[name]}
      onChange={(e) => setProfile({ ...profile, [name]: e.target.value })}
      type={type}
      editing={editing}
      disabled={disabled}
    />
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-sm text-gray-500">Manage your operator profile and settings</p>
          </div>
          {!editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>✏️ Edit Profile</Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Company info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Company Name", "companyName")}
              {f("CAC Number", "cacNumber", "text", true)}
              {f("City", "city")}
              {f("Years in Operation", "yearsInOperation", "text", true)}
              <div className="sm:col-span-2">
                {f("Address", "address")}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Contact Person", "contactName")}
              {f("Phone Number", "phone", "tel")}
              <div className="sm:col-span-2">
                {f("Email Address", "email", "email")}
              </div>
            </div>
          </div>

          {/* Fleet info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Fleet & Routes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Fleet Size", "fleetSize")}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vehicle Types</label>
                <div className="flex flex-wrap gap-2 py-2">
                  {profile.vehicleTypes.map((t) => (
                    <span key={t} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">{t}</span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                {f("Covered Routes", "routes")}
              </div>
            </div>
          </div>

          {/* Bank info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {f("Bank Name", "bankName")}
              {f("Account Number", "accountNumber")}
              {f("Account Name", "accountName")}
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => { setEditing(false); setProfile(INITIAL); }}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
