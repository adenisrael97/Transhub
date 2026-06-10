"use client";
import { useState, useCallback } from "react";
import { Bus, CheckCircle2, Users2, Plus, Pencil, Trash2, X } from "lucide-react";
import { capitalize } from "@/lib/utils";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import FilterTabs from "@/components/ui/FilterTabs";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import { useServerList } from "@/hooks/useServerList";
import { getFleet, addVehicle, updateVehicle, removeVehicle } from "@/services/vehicles";

const VEHICLE_TYPES = ["bus", "minibus", "coaster", "van"];
const TYPE_TABS = ["all", "bus", "minibus", "coaster", "van"];

const STATUS_COLOR = {
  true:  "bg-[#F0FDF4] text-[#16A34A]",
  false: "bg-[#F1F5F9] text-[#94A3B8]",
};

const EMPTY_FORM = { plate: "", make: "", model: "", capacity: "", type: "bus" };

export default function OperatorFleetPage() {
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // Vehicle being edited, or null for add
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null); // id awaiting confirmation

  const selectVehicles = useCallback((res) => res.vehicles ?? [], []);
  const {
    items: vehicles, pagination, loading, error,
    page, setPage, filters, setFilter, searchInput, setSearchInput, refetch,
  } = useServerList({ fetcher: getFleet, select: selectVehicles, limit: 12 });

  const activeType = filters.type ?? "all";
  // The fleet endpoint returns active vehicles only, so total == active count.
  const total = pagination?.total ?? vehicles.length;
  const pageSeats = vehicles.reduce((s, v) => s + v.capacity, 0);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(v) {
    setEditTarget(v);
    setForm({ plate: v.plate, make: v.make, model: v.model, capacity: String(v.capacity), type: v.type });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = { ...form, capacity: Number(form.capacity) };
    try {
      if (editTarget) {
        await updateVehicle(editTarget.id, payload);
      } else {
        await addVehicle(payload);
      }
      closeModal();
      refetch();
    } catch (err) {
      setFormError(err?.message ?? "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await removeVehicle(id);
      refetch();
    } catch (err) {
      alert(err?.message ?? "Failed to remove vehicle");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Fleet Management</h1>
            <p className="text-sm text-[#64748B]">
              {loading ? "Loading…" : `${total.toLocaleString()} active vehicle${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button variant="success" onClick={openAdd}>
            <span className="flex items-center gap-1.5"><Plus size={15} /> Add Vehicle</span>
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
            {error} — <button className="underline" onClick={refetch}>retry</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Vehicles", value: total,     Icon: Bus,         bg: "bg-blue-50",   color: "text-blue-600"   },
            { label: "Active",         value: total,     Icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600"  },
            { label: "Capacity (page)", value: pageSeats, Icon: Users2,      bg: "bg-blue-50", color: "text-[#0A1B3D]" },
          ].map(({ Icon, label, value, bg, color }) => (
            <StatCard key={label} icon={<Icon size={22} />} label={label} value={value} bg={bg} color={color} />
          ))}
        </div>

        {/* Search + type filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search plate, make, model…"
            className="w-full sm:w-64"
          />
          <FilterTabs
            items={TYPE_TABS}
            labels={{ all: "All", bus: "Bus", minibus: "Minibus", coaster: "Coaster", van: "Van" }}
            active={activeType}
            onChange={(tab) => setFilter({ type: tab === "all" ? undefined : tab })}
            color="green"
          />
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-[#E2E8F0] animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 text-[#94A3B8]">
            <Bus size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No vehicles found</p>
            <p className="text-sm mt-1">Add your first vehicle or adjust your search</p>
          </div>
        ) : (
          <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-[#0F172A]">{v.make} {v.model}</p>
                    <p className="text-xs text-[#94A3B8] font-mono">{v.plate}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[String(v.active)]}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B]"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteId(v.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Type",     capitalize(v.type)],
                    ["Capacity", `${v.capacity} seats`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[#94A3B8]">{label}</span>
                      <span className="font-medium text-[#475569]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} loading={loading} />
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-[#0F172A]">
                {editTarget ? "Edit Vehicle" : "Add Vehicle"}
              </h2>
              <button onClick={closeModal} className="text-[#94A3B8] hover:text-[#475569]">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Plate number</label>
                <input
                  required
                  value={form.plate}
                  onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                  placeholder="e.g. LAG-123-AB"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Make</label>
                  <input
                    required
                    value={form.make}
                    onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                    placeholder="e.g. Toyota"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Model</label>
                  <input
                    required
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. Coaster"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] bg-white"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{capitalize(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Capacity</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={100}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="e.g. 18"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="success" className="flex-1" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h2 className="font-bold text-lg text-[#0F172A] mb-1">Remove vehicle?</h2>
            <p className="text-sm text-[#64748B] mb-6">The vehicle will be marked inactive and hidden from your fleet.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(deleteId)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
