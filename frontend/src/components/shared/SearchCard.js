'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ticket, Package, Bus, Calendar, Search, ArrowRight } from 'lucide-react';
import { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CITIES } from '@/lib/constants';

const TABS = [
  { key: 'book',    label: 'Book a Seat', icon: Ticket,  accent: '#2563EB' },
  { key: 'waybill', label: 'Send Goods',  icon: Package, accent: '#16A34A' },
  { key: 'charter', label: 'Charter',     icon: Bus,     accent: '#D97706' },
];

export default function SearchCard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('book');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    if (date) params.set('date', date);
    router.push(`/search?${params.toString()}`);
  };

  const activeAccent = TABS.find((t) => t.key === activeTab)?.accent ?? '#2563EB';

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-2 max-w-4xl mx-auto">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F8FAFC] rounded-2xl p-1 mb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'text-white' : 'text-[#94A3B8] hover:text-[#475569]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="search-tab-bg"
                  className="absolute inset-0 rounded-xl shadow-sm"
                  style={{ background: activeAccent }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={15} className="relative z-10 shrink-0" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Book a seat */}
      {activeTab === 'book' && (
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-1">
          <Select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Departure city"
          >
            <option value="">From</option>
            {CITIES.map((c) => <option key={`from-${c}`} value={c}>{c}</option>)}
          </Select>
          <Select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Arrival city"
          >
            <option value="">To</option>
            {CITIES.map((c) => <option key={`to-${c}`} value={c}>{c}</option>)}
          </Select>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Travel date"
              className="w-full rounded-xl border border-[#E2E8F0] pl-9 pr-3.5 py-2.5 text-sm text-[#0F172A] bg-white outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
            />
          </div>
          <Button type="submit" variant="primary" rightIcon={<Search size={15} />}>
            Search Trips
          </Button>
        </form>
      )}

      {/* Send goods */}
      {activeTab === 'waybill' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1">
          <Select aria-label="Sending from city">
            <option value="">Sending From</option>
            {CITIES.map((c) => <option key={`wfrom-${c}`} value={c}>{c}</option>)}
          </Select>
          <Select aria-label="Sending to city">
            <option value="">Sending To</option>
            {CITIES.map((c) => <option key={`wto-${c}`} value={c}>{c}</option>)}
          </Select>
          <Button as={Link} href="/send" variant="success" rightIcon={<ArrowRight size={15} />}>
            Send Goods
          </Button>
        </div>
      )}

      {/* Charter */}
      {activeTab === 'charter' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1">
          <Select aria-label="Vehicle type">
            <option value="">Vehicle Type</option>
            <option>Bus (18 seater)</option>
            <option>Bus (33 seater)</option>
            <option>Coaster Bus</option>
            <option>SUV / Car</option>
            <option>Pickup Truck</option>
            <option>Cargo Van</option>
          </Select>
          <Select aria-label="Charter purpose">
            <option value="">Purpose</option>
            <option>Group Travel</option>
            <option>Corporate Trip</option>
            <option>Goods Delivery</option>
            <option>Event / Occasion</option>
          </Select>
          <Button as={Link} href="/charter" variant="warning" rightIcon={<ArrowRight size={15} />}>
            Get a Quote
          </Button>
        </div>
      )}
    </div>
  );
}
