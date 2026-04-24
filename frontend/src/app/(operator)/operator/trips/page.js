"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FilterTabs from "@/components/ui/FilterTabs";
import Input, { Select } from "@/components/ui/Input";
import { capitalize } from "@/lib/utils";
import { CITIES } from "@/lib/constants";
import useToastStore from "@/store/toastStore";

const STATUS_COLOR = {
  "in-transit": "bg-blue-100 text-blue-700",
  boarding:     "bg-amber-100 text-amber-700",
  scheduled:    "bg-gray-100 text-gray-600",
  completed:    "bg-gray-100 text-gray-500",
  cancelled:    "bg-red-100 text-red-700",
};

const SEED_TRIPS = [
  { id: "TR-101", route: "Lagos → Abuja",        dep: "6:00 AM",  arr: "12:30 PM", booked: 16, seats: 18, price: 12000, status: "in-transit", date: "2026-03-25", vehicle: "Bus #PMT-012" },
  { id: "TR-102", route: "Enugu → Lagos",         dep: "7:30 AM",  arr: "3:00 PM",  booked: 30, seats: 33, price: 9500,  status: "in-transit", date: "2026-03-25", vehicle: "Bus #PMT-045" },
  { id: "TR-103", route: "Lagos → Owerri",        dep: "9:00 AM",  arr: "4:30 PM",  booked: 14, seats: 18, price: 8000,  status: "boarding",   date: "2026-03-25", vehicle: "Bus #PMT-008" },
  { id: "TR-104", route: "Abuja → Port Harcourt", dep: "11:00 AM", arr: "6:00 PM",  booked: 8,  seats: 18, price: 14000, status: "scheduled",  date: "2026-03-25", vehicle: "Bus #PMT-021" },
  { id: "TR-105", route: "Enugu → Abuja",         dep: "1:00 PM",  arr: "7:00 PM",  booked: 22, seats: 33, price: 11000, status: "scheduled",  date: "2026-03-25", vehicle: "Bus #PMT-033" },
  { id: "TR-098", route: "Lagos → Enugu",         dep: "6:00 AM",  arr: "1:00 PM",  booked: 18, seats: 18, price: 9500,  status: "completed",  date: "2026-03-24", vehicle: "Bus #PMT-012" },
  { id: "TR-097", route: "Abuja → Lagos",         dep: "7:00 AM",  arr: "1:30 PM",  booked: 17, seats: 18, price: 12000, status: "completed",  date: "2026-03-24", vehicle: "Bus #PMT-008" },
];

const VEHICLES = [
  "Bus #PMT-008 (18 seats)",
  "Bus #PMT-012 (18 seats)",
  "Bus #PMT-021 (18 seats)",
  "Bus #PMT-033 (33 seats)",
  "Bus #PMT-045 (33 seats)",
];

const EMPTY_FORM = { from: "", to: "", date: "", dep: "", arr: "", vehicle: "", price: "", seats: "" };

/** Convert "HH:MM" (from <input type="time">) → "h:mm AM/PM" */
function fmtTime(hhmm) {
  if (!hhmm) return hhmm;
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${suffix}`;
}

export default function OperatorTripsPage() {
  const toast = useToastStore();
  const [trips, setTrips] = useState(SEED_TRIPS);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const filtered = trips.filter((t) => filter === "all" || t.status === filter);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function handleAddTrip(e) {
    e.preventDefault();
    setFormError("");

    if (!form.from || !form.to || !form.date || !form.dep || !form.arr || !form.vehicle || !form.price || !form.seats) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (form.from === form.to) {
      setFormError("Origin and destination cannot be the same.");
      return;
    }

    const seatsNum = parseInt(form.seats, 10);
    const priceNum = parseInt(form.price, 10);
    if (isNaN(seatsNum) || seatsNum < 1) { setFormError("Enter a valid seat count."); return; }
    if (isNaN(priceNum) || priceNum < 100) { setFormError("Enter a valid price (min ₦100)."); return; }

    const newTrip = {
      id: `TR-${String(trips.length + 100).padStart(3, "0")}`,
      route: `${form.from} → ${form.to}`,
      dep: fmtTime(form.dep),
      arr: fmtTime(form.arr),
      booked: 0,
      seats: seatsNum,
      price: priceNum,
      status: "scheduled",
      date: form.date,
      vehicle: form.vehicle.split(" (")[0],
    };

    setTrips([newTrip, ...trips]);
    setForm(EMPTY_FORM);
    setShowModal(false);
    toast.success("Trip created successfully");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <p className="text-sm text-gray-500">{trips.length} total trips</p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Add New Trip</Button>
        </div>

        {/* Filters */}
        <div className="mb-6 w-fit">
          <FilterTabs
            items={["all", "scheduled", "boarding", "in-transit", "completed", "cancelled"]}
            active={filter}
            onChange={setFilter}
            color="green"
            labels={{ "in-transit": "In Transit" }}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-50">
                  <th className="px-6 py-4">Trip ID</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Seats</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{t.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{t.route}</p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{t.dep} → {t.arr}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{t.vehicle}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{t.booked}</span>
                      <span className="text-gray-400">/{t.seats}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">₦{t.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[t.status]}`}>
                        {t.status === "in-transit" ? "In Transit" : capitalize(t.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🚌</p>
              <p className="font-medium">No trips match this filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Trip Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(""); }} title="Add New Trip" size="lg">
        <form onSubmit={handleAddTrip} className="space-y-5">
          {/* Route */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Origin" required value={form.from} onChange={set("from")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Destination" required value={form.to} onChange={set("to")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>

          {/* Date & times */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Date" type="date" required value={form.date} onChange={set("date")} />
            <Input label="Departure Time" type="time" required value={form.dep} onChange={set("dep")} />
            <Input label="Arrival Time" type="time" required value={form.arr} onChange={set("arr")} />
          </div>

          {/* Vehicle, seats, price */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Select label="Vehicle" required value={form.vehicle} onChange={set("vehicle")}>
              <option value="">Select vehicle</option>
              {VEHICLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
            <Input label="Available Seats" type="number" min="1" max="60" required value={form.seats} onChange={set("seats")} placeholder="e.g. 18" />
            <Input label="Price (₦)" type="number" min="100" required value={form.price} onChange={set("price")} placeholder="e.g. 12000" />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{formError}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setFormError(""); }}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Create Trip
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
