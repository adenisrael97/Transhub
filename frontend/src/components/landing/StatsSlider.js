'use client';

import { Users, Route, Bus, MapPin, Star, Headphones } from 'lucide-react';

// Data preserved from the original stats block, extended with two trust metrics
// so the marquee reads as a continuous strip rather than a short loop.
const STATS = [
  { icon: Users,      value: '50,000+', label: 'Happy Travellers' },
  { icon: Route,      value: '120+',    label: 'Routes Covered' },
  { icon: Bus,        value: '500+',    label: 'Vehicles Available' },
  { icon: MapPin,     value: '36',      label: 'States Covered' },
  { icon: Star,       value: '4.9/5',   label: 'Average Rating' },
  { icon: Headphones, value: '24/7',    label: 'Customer Support' },
];

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-4 shrink-0 w-64 rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
        <Icon size={22} className="text-[#1D4ED8]" />
      </div>
      <div>
        <p className="text-2xl font-extrabold leading-none text-[#0A1B3D]">{value}</p>
        <p className="mt-1.5 text-sm text-[#64748B]">{label}</p>
      </div>
    </div>
  );
}

export default function StatsSlider() {
  return (
    <section className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-10">
      {/* th-marquee-paused pauses the animation on hover (see globals.css).
          The track is rendered twice so the -50% loop is seamless. Edges are
          faded with a mask for a polished, premium feel. */}
      <div
        className="th-marquee-paused overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <div className="th-marquee-track flex w-max gap-4">
          {[...STATS, ...STATS].map((s, i) => (
            <StatCard key={`${s.label}-${i}`} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
