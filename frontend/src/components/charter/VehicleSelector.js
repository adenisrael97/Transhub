'use client';
import useCharterStore from '@/store/charterStore';

const VEHICLES = [
  { id: 'suv',       label: 'SUV / Car',       icon: '🚗', seats: '1–4',   rate: 15_000 },
  { id: 'pickup',    label: 'Pickup Truck',     icon: '🛻', seats: '1–3',   rate: 20_000 },
  { id: 'cargo-van', label: 'Cargo Van',        icon: '🚐', seats: 'Cargo', rate: 25_000 },
  { id: 'bus-18',    label: 'Mini Bus (18)',    icon: '🚌', seats: '18',    rate: 35_000 },
  { id: 'coaster',   label: 'Coaster Bus (33)', icon: '🚌', seats: '33',    rate: 60_000 },
  { id: 'bus-33',    label: 'Full Bus (33)',     icon: '🚌', seats: '33',    rate: 80_000 },
];

export default function VehicleSelector() {
  const { vehicleType, setField } = useCharterStore();

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">
        Select Vehicle Type <span className="text-red-500">*</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VEHICLES.map((v) => {
          const active = vehicleType === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setField('vehicleType', v.id)}
              className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all
                ${active
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
            >
              <span className="text-2xl">{v.icon}</span>
              <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-800'}`}>
                {v.label}
              </p>
              <p className="text-xs text-gray-400">{v.seats} seats</p>
              <p className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                From ₦{v.rate.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
