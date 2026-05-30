"use client";
import { useState, useEffect, useCallback } from "react";
import { Bus, Plus, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input, { Select } from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { STATUS_BADGE, CITIES } from "@/lib/constants";
import { capitalize, formatTime } from "@/lib/utils";
import useToastStore from "@/store/toastStore";
import { fetchTrips, createTrip, deleteTrip, toggleTripActive, markTripFull, setTripOfflineCount } from "@/services/trips";

const VEHICLE_TYPES = ["Bus", "Luxury Bus", "Coaster", "Car", "SUV"];

const BUS_AMENITIES = [
  "Air Conditioning", "WiFi", "USB Charging", "Reclining Seats",
  "Restroom/Toilet", "TV/Entertainment", "Extra Legroom",
  "Water/Snacks", "Luggage Space",
];

const EMPTY_FORM = {
  from: "", to: "", departureTime: "", arrivalTime: "",
  price: "", totalSeats: "", vehicleType: "Bus", driverNumber: "",
  parkName: "", amenities: [],
};

function deriveStatus(trip) {
  if (trip.status === "cancelled") return "cancelled";
  const dep = new Date(trip.departureTime);
  const now = new Date();
  const diffH = (dep - now) / 36e5;
  if (diffH > 1)   return "scheduled";
  if (diffH > -24) return "active";
  return "completed";
}

export default function OperatorTripsPage() {
  const toast = useToastStore();

  const [trips, setTrips]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggling, setToggling]           = useState(null);
  const [fulling, setFulling]             = useState(null);
  const [offlineInputs, setOfflineInputs] = useState({});
  const [savingOffline, setSavingOffline] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTrips();
      setTrips(res.trips ?? []);
    } catch {
      setError("Failed to load trips. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd() { setForm(EMPTY_FORM); setFormError(""); setShowModal(true); }

  function validate() {
    if (!form.from || !form.to || !form.departureTime || !form.price || !form.totalSeats) {
      setFormError("Please fill in all required fields.");
      return false;
    }
    if (form.from === form.to) { setFormError("Origin and destination cannot be the same."); return false; }
    if (isNaN(parseInt(form.price)) || parseInt(form.price) < 1) {
      setFormError("Enter a valid price.");
      return false;
    }
    const seats = parseInt(form.totalSeats);
    if (isNaN(seats) || seats < 1 || seats > 100) {
      setFormError("Seat count must be between 1 and 100.");
      return false;
    }
    return true;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setFormLoading(true);
    try {
      const { trip } = await createTrip({
        from:          form.from,
        to:            form.to,
        departureTime: form.departureTime,
        arrivalTime:   form.arrivalTime || undefined,
        price:         parseInt(form.price),
        totalSeats:    parseInt(form.totalSeats),
        vehicleType:   form.vehicleType,
        driverNumber:  form.driverNumber || undefined,
        parkName:      form.parkName || undefined,
        amenities:     form.amenities,
      });
      setTrips((prev) => [trip, ...prev]);
      setShowModal(false);
      toast.success("Trip created successfully");
    } catch (err) {
      setFormError(
        err?.error?.details?.[0]?.message ||
        err?.error?.message ||
        err?.message ||
        "Failed to create trip."
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(trip) {
    setToggling(trip.id);
    try {
      const { trip: updated } = await toggleTripActive(trip.id, !trip.isActive);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      toast.success(updated.isActive ? "Trip is now online" : "Trip is now offline");
    } catch (err) {
      toast.error(err?.error?.message || "Failed to update trip availability.");
    } finally {
      setToggling(null);
    }
  }

  async function handleMarkFull(trip) {
    setFulling(trip.id);
    try {
      const { trip: updated } = await markTripFull(trip.id, !trip.isFull);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      toast.success(updated.isFull ? "Trip marked as full — no new bookings accepted" : "Trip reopened for booking");
    } catch (err) {
      toast.error(err?.error?.message || "Failed to update trip.");
    } finally {
      setFulling(null);
    }
  }

  async function handleOfflineSave(trip) {
    const raw = offlineInputs[trip.id];
    const val = parseInt(raw ?? String(trip.offlineCount ?? 0), 10);
    if (isNaN(val) || val < 0) return;
    setSavingOffline(trip.id);
    try {
      const { trip: updated } = await setTripOfflineCount(trip.id, val);
      setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setOfflineInputs((prev) => { const n = { ...prev }; delete n[trip.id]; return n; });
      toast.success("Offline bookings recorded");
    } catch (err) {
      toast.error(err?.error?.message || "Failed to save offline count.");
    } finally {
      setSavingOffline(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteTrip(deleteTarget.id);
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success("Trip deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.error?.message || err?.message || "Failed to delete trip.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">My Trips</h1>
            <p className="text-sm text-[#64748B]">{trips.length} trip{trips.length !== 1 ? "s" : ""} total</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={load} loading={loading && trips.length > 0}>
              Refresh
            </Button>
            <Button onClick={openAdd} variant="success" rightIcon={<Plus size={15} />}>
              Add New Trip
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && trips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Loading trips…</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#94A3B8] font-semibold uppercase tracking-wider border-b border-[#F1F5F9]">
                    {["Route", "Departure", "Price", "Seats", "Status", "Availability", "Capacity", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {trips.map((trip) => {
                    const status = deriveStatus(trip);
                    const booked = (trip.totalSeats ?? 0) - (trip.availableSeats ?? 0);
                    return (
                      <tr key={trip.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#0F172A]">{trip.from} → {trip.to}</p>
                          <p className="text-xs text-[#94A3B8]">{trip.vehicleType}</p>
                        </td>
                        <td className="px-6 py-4 text-[#64748B] text-sm">{formatTime(trip.departureTime)}</td>
                        <td className="px-6 py-4 font-semibold text-[#16A34A]">₦{trip.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#0F172A]">{booked}</span>
                          <span className="text-[#94A3B8]">/{trip.totalSeats}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[status] ?? STATUS_BADGE.scheduled}`}>
                            {capitalize(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggle(trip)}
                              disabled={toggling === trip.id}
                              title={trip.isActive !== false ? "Click to go offline" : "Click to go online"}
                              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                                trip.isActive !== false ? "bg-[#16A34A]" : "bg-[#94A3B8]"
                              } ${toggling === trip.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                trip.isActive !== false ? "translate-x-4.5" : "translate-x-0.5"
                              }`} />
                            </button>
                            <span className={`text-xs font-medium ${trip.isActive !== false ? "text-[#16A34A]" : "text-[#94A3B8]"}`}>
                              {toggling === trip.id ? "…" : trip.isActive !== false ? "Online" : "Offline"}
                            </span>
                          </div>
                        </td>
                        {/* Capacity: offline count + mark full */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {trip.isFull && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#DC2626]">
                                FULL
                              </span>
                            )}
                            {/* Offline bookings inline input */}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#94A3B8]">Walk-ins:</span>
                              <input
                                type="number"
                                min="0"
                                max={trip.totalSeats}
                                value={offlineInputs[trip.id] ?? (trip.offlineCount ?? 0)}
                                onChange={(e) => setOfflineInputs((prev) => ({ ...prev, [trip.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && handleOfflineSave(trip)}
                                className="w-12 text-xs border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                              />
                              {offlineInputs[trip.id] !== undefined && (
                                <button
                                  onClick={() => handleOfflineSave(trip)}
                                  disabled={savingOffline === trip.id}
                                  title="Save offline count"
                                  className="text-[#16A34A] hover:text-[#15803D] disabled:opacity-40"
                                >
                                  <Check size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => handleMarkFull(trip)}
                              disabled={fulling === trip.id}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${
                                trip.isFull
                                  ? "bg-[#16A34A] text-white hover:bg-[#15803D]"
                                  : "bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]"
                              }`}
                            >
                              {fulling === trip.id ? "…" : trip.isFull ? "Reopen" : "Mark Full"}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(trip)}
                              className="text-[#DC2626] hover:underline text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {trips.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bus size={24} className="text-[#94A3B8]" />
                </div>
                <p className="text-sm font-medium text-[#94A3B8]">No trips yet — add your first trip above</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(""); }} title="Add New Trip" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="From" required value={form.from} onChange={set("from")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="To" required value={form.to} onChange={set("to")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Departure" type="datetime-local" required value={form.departureTime} onChange={set("departureTime")} />
            <Input label="Arrival (optional)" type="datetime-local" value={form.arrivalTime} onChange={set("arrivalTime")} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Price (₦)" type="number" placeholder="9500" required value={form.price} onChange={set("price")} />
            <Input label="Total Seats" type="number" placeholder="18" min="1" max="100" required value={form.totalSeats} onChange={set("totalSeats")} />
            <Select label="Vehicle Type" value={form.vehicleType} onChange={set("vehicleType")}>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </div>
          <Input label="Driver Phone (optional)" placeholder="+234 800 000 0000" value={form.driverNumber} onChange={set("driverNumber")} />
          <Input
            label="Bus Park / Terminal (optional)"
            placeholder="e.g. Ojota Motor Park, Lagos"
            value={form.parkName}
            onChange={set("parkName")}
          />

          {/* Amenities checkbox grid */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Bus Amenities <span className="text-[#94A3B8] font-normal">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUS_AMENITIES.map((amenity) => {
                const checked = form.amenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors text-sm ${
                      checked
                        ? "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]"
                        : "border-[#E2E8F0] text-[#64748B] hover:border-[#BBF7D0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        setForm((f) => ({
                          ...f,
                          amenities: checked
                            ? f.amenities.filter((a) => a !== amenity)
                            : [...f.amenities, amenity],
                        }));
                      }}
                    />
                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      checked ? "bg-[#16A34A] border-[#16A34A]" : "border-[#CBD5E1]"
                    }`}>
                      {checked && <Check size={10} className="text-white" />}
                    </span>
                    <span className="font-medium leading-tight">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="text-sm text-[#DC2626] bg-[#FEF2F2] rounded-xl px-4 py-2.5">{formError}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setFormError(""); }}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={formLoading}>
              Create Trip
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Trip"
        message={`Delete the trip ${deleteTarget?.from} → ${deleteTarget?.to}? All ${deleteTarget?.totalSeats} seats will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
