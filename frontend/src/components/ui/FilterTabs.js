'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function FilterTabs({
  items = [],
  active,
  onChange,
  color    = 'blue',
  counts,
  labels,
  variant  = 'pill',   // 'pill' | 'underline'
}) {
  const ACTIVE_PILL = {
    blue:  'bg-[#2563EB] text-white',
    green: 'bg-[#16A34A] text-white',
    amber: 'bg-[#D97706] text-white',
  };

  if (variant === 'underline') {
    return (
      <div className="flex gap-1 border-b border-[#E2E8F0]" role="tablist">
        {items.map((item) => {
          const lbl = labels?.[item] ?? item;
          const cnt = counts?.[item];
          const isActive = active === item;
          return (
            <button
              key={item}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item)}
              className={`relative px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${isActive ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              {lbl}
              {cnt != null && cnt > 0 && (
                <span className="ml-1.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {cnt}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="underline-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pill variant
  const activePillClass = ACTIVE_PILL[color] ?? ACTIVE_PILL.blue;

  return (
    <div
      className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 flex-wrap"
      role="tablist"
    >
      {items.map((item) => {
        const lbl = labels?.[item] ?? item;
        const cnt = counts?.[item];
        const isActive = active === item;
        return (
          <button
            key={item}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item)}
            className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${isActive ? activePillClass : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
          >
            {isActive && (
              <motion.div
                layoutId={`pill-tab-${color}`}
                className={`absolute inset-0 rounded-lg ${activePillClass}`}
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {lbl}
              {cnt != null && cnt > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${isActive ? 'bg-white/20' : 'bg-[#2563EB] text-white'}`}>
                  {cnt}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
