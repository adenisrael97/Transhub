import { create } from 'zustand';

const VEHICLE_RATES = {
  'suv':        15_000,
  'bus-18':     35_000,
  'bus-33':     80_000,  // Full Bus (33 seats)
  'coaster':    60_000,  // Coaster Bus (33 seats)
  'pickup':     20_000,
  'cargo-van':  25_000,
};

const useCharterStore = create((set, get) => ({
  vehicleType:     '',
  pickupLocation:  '',
  destination:     '',
  date:            '',
  returnDate:      '',
  passengers:      1,
  purpose:         '',
  duration:        'one-way',   // 'one-way' | 'round-trip'
  estimatedCost:   0,
  contactName:     '',
  contactPhone:    '',
  contactEmail:    '',

  setField(field, value) {
    set({ [field]: value });
    // Recalculate estimate whenever vehicle type or duration changes
    if (field === 'vehicleType' || field === 'duration') {
      const { vehicleType, duration } = { ...get(), [field]: value };
      const base = VEHICLE_RATES[vehicleType] ?? 0;
      set({ estimatedCost: duration === 'round-trip' ? base * 2 : base });
    }
  },

  reset() {
    set({
      vehicleType: '', pickupLocation: '', destination: '', date: '',
      returnDate: '', passengers: 1, purpose: '', duration: 'one-way',
      estimatedCost: 0, contactName: '', contactPhone: '', contactEmail: '',
    });
  },
}));

export default useCharterStore;
