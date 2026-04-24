"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input, { Select } from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { STATUS_BADGE, CITIES } from "@/lib/constants";
import { capitalize } from "@/lib/utils";
import useToastStore from "@/store/toastStore";

const OPERATORS = ["Peace Mass Transit", "GUO Transport", "ABC Transport", "Chisco Transport", "God is Good Motors"];
const EMPTY_FORM = { from: "", to: "", dep: "", operator: "", price: "", seats: "", vehicle: "Bus" };

const MOCK_TRIPS = [
  { id: "1", from: "Lagos", to: "Abuja",          dep: "2026-03-26 06:00", operator: "Peace Mass Transit", price: 9500,  seats: 18, booked: 14, status: "active"    },
  { id: "2", from: "Abuja", to: "Port Harcourt",  dep: "2026-03-26 08:00", operator: "GUO Transport",     price: 12000, seats: 33, booked: 20, status: "active"    },
  { id: "3", from: "Lagos", to: "Enugu",           dep: "2026-03-25 05:00", operator: "ABC Transport",    price: 11000, seats: 18, booked: 18, status: "completed" },
  { id: "4", from: "Kano",  to: "Lagos",           dep: "2026-03-27 07:00", operator: "Peace Mass Transit",price: 15000, seats: 33, booked: 0,  status: "scheduled" },
];

export default function AdminTripsPage() {
  const toast = useToastStore();
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [showModal, setShowModal] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = trips.filter(
    (t) => t.from.toLowerCase().includes(search.toLowerCase()) || t.to.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(trip) {
    setEditTrip(trip);
    setForm({ from: trip.from, to: trip.to, dep: trip.dep, operator: trip.operator, price: String(trip.price), seats: String(trip.seats), vehicle: "Bus" });
    setFormError("");
  }

  function handleAddTrip(e) {
    e.preventDefault();
    setFormError("");
    if (!form.from || !form.to || !form.dep || !form.operator || !form.price || !form.seats) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.from === form.to) { setFormError("Origin and destination cannot be the same."); return; }
    const priceNum = parseInt(form.price, 10);
    const seatsNum = parseInt(form.seats, 10);
    if (isNaN(priceNum) || priceNum < 1) { setFormError("Enter a valid price."); return; }
    if (isNaN(seatsNum) || seatsNum < 1) { setFormError("Enter a valid seat count."); return; }
    const newTrip = {
      id: String(trips.length + 1),
      from: form.from, to: form.to, dep: form.dep,
      operator: form.operator,
      price: priceNum, seats: seatsNum, booked: 0,
      status: "scheduled",
    };
    setTrips([newTrip, ...trips]);
    setShowModal(false);
    toast.success("Trip created successfully");
  }

  function handleEditTrip(e) {
    e.preventDefault();
    setFormError("");
    if (!form.from || !form.to || !form.dep || !form.operator || !form.price || !form.seats) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.from === form.to) { setFormError("Origin and destination cannot be the same."); return; }
    const priceNum = parseInt(form.price, 10);
    const seatsNum = parseInt(form.seats, 10);
    if (isNaN(priceNum) || priceNum < 1) { setFormError("Enter a valid price."); return; }
    if (isNaN(seatsNum) || seatsNum < 1) { setFormError("Enter a valid seat count."); return; }
    setTrips(trips.map((t) =>
      t.id === editTrip.id
        ? { ...t, from: form.from, to: form.to, dep: form.dep, operator: form.operator, price: priceNum, seats: seatsNum }
        : t
    ));
    setEditTrip(null);
    toast.success("Trip updated successfully");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
            <p className="text-sm text-gray-500">{trips.length} trips total</p>
          </div>
          <Button onClick={openAdd}>+ Add Trip</Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by city…"
            className="w-full max-w-xs border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Departure</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Seats</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{trip.from} → {trip.to}</td>
                    <td className="px-6 py-4 text-gray-500">{trip.operator}</td>
                    <td className="px-6 py-4 text-gray-500">{trip.dep}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">₦{trip.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{trip.booked}</span>
                      <span className="text-gray-400">/{trip.seats}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[trip.status]}`}>
                        {capitalize(trip.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(trip)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                        <button onClick={() => setDeleteTarget(trip)}
                          className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add trip modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Trip">
        <form onSubmit={handleAddTrip} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="From" required value={form.from} onChange={set("from")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="To" required value={form.to} onChange={set("to")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <Select label="Operator" required value={form.operator} onChange={set("operator")}>
            <option value="">Select operator</option>
            {OPERATORS.map((o) => <option key={o}>{o}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" type="datetime-local" required value={form.dep} onChange={set("dep")} />
            <Input label="Price (₦)" type="number" placeholder="9500" required value={form.price} onChange={set("price")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Seats" type="number" placeholder="18" required value={form.seats} onChange={set("seats")} />
            <Select label="Vehicle Type" value={form.vehicle} onChange={set("vehicle")}>
              <option>Bus</option>
              <option>Luxury Bus</option>
              <option>Coaster</option>
              <option>Car</option>
            </Select>
          </div>
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button fullWidth variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button fullWidth type="submit">Create Trip</Button>
          </div>
        </form>
      </Modal>

      {/* Edit trip modal */}
      <Modal isOpen={!!editTrip} onClose={() => setEditTrip(null)} title="Edit Trip">
        <form onSubmit={handleEditTrip} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="From" required value={form.from} onChange={set("from")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="To" required value={form.to} onChange={set("to")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <Select label="Operator" required value={form.operator} onChange={set("operator")}>
            <option value="">Select operator</option>
            {OPERATORS.map((o) => <option key={o}>{o}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" type="datetime-local" required value={form.dep} onChange={set("dep")} />
            <Input label="Price (₦)" type="number" required value={form.price} onChange={set("price")} />
          </div>
          <Input label="Total Seats" type="number" required value={form.seats} onChange={set("seats")} />
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button fullWidth variant="secondary" type="button" onClick={() => setEditTrip(null)}>Cancel</Button>
            <Button fullWidth type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          setTrips((t) => t.filter((x) => x.id !== deleteTarget.id));
          toast.success("Trip deleted");
          setDeleteTarget(null);
        }}
        title="Delete Trip"
        message={`Delete the trip ${deleteTarget?.from} → ${deleteTarget?.to}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
