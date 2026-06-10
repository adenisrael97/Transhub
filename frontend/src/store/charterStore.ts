import { create } from "zustand";
import type { CharterDuration } from "@/types";
import { CHARTER_VEHICLES } from "@/lib/constants";

// Derived from the shared catalogue so the estimate, the selector and the
// stored-charter labels can never drift apart.
const VEHICLE_RATES: Record<string, number> = Object.fromEntries(
  CHARTER_VEHICLES.map((v) => [v.id, v.rate])
);

interface CharterState {
  vehicleType: string;
  pickupLocation: string;
  destination: string;
  date: string;
  returnDate: string;
  passengers: number;
  purpose: string;
  duration: CharterDuration;
  estimatedCost: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;

  setField: <K extends keyof CharterState>(field: K, value: CharterState[K]) => void;
  reset: () => void;
}

const INITIAL = {
  vehicleType: "",
  pickupLocation: "",
  destination: "",
  date: "",
  returnDate: "",
  passengers: 1,
  purpose: "",
  duration: "one-way" as CharterDuration,
  estimatedCost: 0,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
};

const useCharterStore = create<CharterState>((set, get) => ({
  ...INITIAL,

  setField(field, value) {
    set({ [field]: value } as Pick<CharterState, typeof field>);
    // Recalculate estimate whenever vehicle type or duration changes
    if (field === "vehicleType" || field === "duration") {
      const next = { ...get(), [field]: value };
      const base = VEHICLE_RATES[next.vehicleType] ?? 0;
      set({ estimatedCost: next.duration === "round-trip" ? base * 2 : base });
    }
  },

  reset() {
    set({ ...INITIAL });
  },
}));

export default useCharterStore;
