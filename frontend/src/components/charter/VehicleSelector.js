'use client';

import { motion } from 'framer-motion';
import { Car, Truck, Package, Bus } from 'lucide-react';
import useCharterStore from '@/store/charterStore';
import { CHARTER_VEHICLES } from '@/lib/constants';

// Icons live here (lucide components can't be serialised into the shared
// constants module); everything else comes from the single catalogue.
const VEHICLE_ICONS = { suv: Car, pickup: Truck, 'cargo-van': Package, 'bus-18': Bus, coaster: Bus, 'bus-33': Bus };
const VEHICLES = CHARTER_VEHICLES.map((v) => ({ ...v, icon: VEHICLE_ICONS[v.id] ?? Bus }));

export default function VehicleSelector() {
  const { vehicleType, setField } = useCharterStore();

  return (
    <div>
      <p className="text-sm font-semibold text-[#475569] mb-3">
        Select Vehicle Type <span className="text-red-500">*</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VEHICLES.map((v) => {
          const active = vehicleType === v.id;
          const Icon = v.icon;
          return (
            <motion.button
              key={v.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setField('vehicleType', v.id)}
              className={`relative flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-colors ${
                active
                  ? 'border-[#D97706] bg-[#FFFBEB]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#D97706]/40 hover:bg-[#FFFBEB]/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-[#D97706]' : 'bg-[#F8FAFC]'}`}>
                <Icon size={18} className={active ? 'text-white' : 'text-[#94A3B8]'} />
              </div>
              <p className={`text-sm font-semibold ${active ? 'text-[#92400E]' : 'text-[#0F172A]'}`}>
                {v.label}
              </p>
              <p className="text-xs text-[#94A3B8]">{v.seats} seats</p>
              <p className={`text-xs font-semibold ${active ? 'text-[#D97706]' : 'text-[#475569]'}`}>
                From ₦{v.rate.toLocaleString()}
              </p>
              {active && (
                <motion.div
                  layoutId="vehicle-active-ring"
                  className="absolute inset-0 rounded-2xl border-2 border-[#D97706] pointer-events-none"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
