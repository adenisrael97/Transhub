"use client";

import { useState, useCallback } from "react";
import { User, Plus, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import useToastStore from "@/store/toastStore";
import { useServerList } from "@/hooks/useServerList";
import { fetchDrivers, createDriver } from "@/services/trips";

const EMPTY_FORM = { fullName: "", phone: "", password: "", licenseNo: "" };
const STATUS_TABS = ["all", "active", "inactive"];

export default function OperatorDriversPage() {
  const toast = useToastStore();

  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formError,   setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const selectDrivers = useCallback((res) => res.drivers ?? [], []);
  const {
    items: drivers, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: fetchDrivers, select: selectDrivers, limit: 20 });

  // FilterTabs uses "all"/"active"/"inactive"; map to the isActive boolean param.
  const activeTab = filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive";
  const total = pagination?.total ?? 0;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function openAdd() { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }

  function validate() {
    if (!form.fullName.trim()) { setFormError("Full name is required."); return false; }
    if (!form.phone.trim() || form.phone.trim().length < 7) { setFormError("A valid phone number is required."); return false; }
    if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return false; }
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setFormError("Password must contain uppercase, lowercase, and a number."); return false;
    }
    return true;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setFormLoading(true);
    try {
      const { driver } = await createDriver({
        fullName:  form.fullName.trim(),
        phone:     form.phone.trim(),
        password:  form.password,
        licenseNo: form.licenseNo.trim() || undefined,
      });
      setShowModal(false);
      toast.success(`Driver "${driver.fullName}" created successfully`);
      refetch();
    } catch (err) {
      setFormError(
        err?.error?.details?.[0]?.message || err?.error?.message || err?.message || "Failed to create driver."
      );
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">My Drivers</h1>
            <p className="text-sm text-[#64748B]">{loading ? "Loading…" : `${total.toLocaleString()} driver${total === 1 ? "" : "s"}`}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={refetch} loading={loading && drivers.length > 0}>Refresh</Button>
            <Button onClick={openAdd} variant="success" rightIcon={<Plus size={15} />}>Add Driver</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search name, phone, license…"
            className="w-full sm:w-64"
          />
          <FilterTabs
            items={STATUS_TABS}
            active={activeTab}
            onChange={(tab) => setFilter({ isActive: tab === "all" ? undefined : tab === "active" })}
            color="green"
          />
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading && drivers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Loading drivers…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider border-b border-[#F1F5F9]">
                  {["Name", "Phone", "License No.", "Status", "Created"].map((h) => (
                    <th key={h} className="px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EFF6FF] rounded-full flex items-center justify-center">
                          <User size={14} className="text-[#2563EB]" />
                        </div>
                        <span className="font-semibold text-[#0F172A]">{driver.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{driver.phone}</td>
                    <td className="px-6 py-4 text-[#64748B]">{driver.licenseNo || <span className="text-[#CBD5E1]">—</span>}</td>
                    <td className="px-6 py-4">
                      {driver.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A]">
                          <Check size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#DC2626]">
                          <X size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] text-xs">
                      {new Date(driver.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {drivers.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User size={24} className="text-[#94A3B8]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8]">No drivers match your search</p>
                <p className="text-xs text-[#CBD5E1] mt-1">Drivers log in with phone + password</p>
              </div>
            )}
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(""); }} title="Add New Driver" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-[#64748B]">
            The driver will log in at <strong>/driver/login</strong> using their phone number and the password you set here.
          </p>
          <Input label="Full Name" placeholder="Emeka Okafor" required value={form.fullName} onChange={set("fullName")} />
          <Input label="Phone Number" type="tel" placeholder="+2348012345678" required value={form.phone} onChange={set("phone")} />
          <Input label="Password" type="password" placeholder="Min 8 chars, upper, lower, number" required value={form.password} onChange={set("password")} />
          <Input label="License Number (optional)" placeholder="Lagos ABC-12345" value={form.licenseNo} onChange={set("licenseNo")} />
          {formError && (
            <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">{formError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" variant="success" loading={formLoading} className="flex-1">Create Driver</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
