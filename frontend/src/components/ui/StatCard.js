'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Map the value-size prop to a real, literal class so Tailwind v4's JIT keeps it
// (a constructed `text-${size}` string would get tree-shaken away).
const VALUE_SIZE = {
  lg:   'text-2xl',
  xl:   'text-[1.75rem]',
  '2xl':'text-3xl',
  '3xl':'text-4xl',
};

export default function StatCard({
  icon,           // Lucide icon component or emoji string
  label,
  value,
  bg    = 'bg-blue-50',
  color = 'text-blue-600',
  change,
  hover = false,
  href,
  valueSize = '2xl',
}) {
  const isUp = change && (change.startsWith('+') || (!change.startsWith('-') && parseFloat(change) > 0));
  const isDown = change && change.startsWith('-');
  const valueCls = VALUE_SIZE[valueSize] ?? VALUE_SIZE['2xl'];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.04]`}>
          {typeof icon === 'string' ? (
            <span className="text-xl">{icon}</span>
          ) : icon ? (
            <span className={color}>{icon}</span>
          ) : null}
        </div>
        {change && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg ${
            isUp ? 'text-[#16A34A] bg-[#F0FDF4]' : isDown ? 'text-[#DC2626] bg-[#FEF2F2]' : 'text-[#64748B] bg-[#F1F5F9]'
          }`}>
            {isUp && <TrendingUp size={12} />}
            {isDown && <TrendingDown size={12} />}
            {change}
          </span>
        )}
      </div>
      <p className={`${valueCls} font-extrabold text-[#0F172A] leading-none tracking-tight tabular-nums`}>{value}</p>
      <p className="text-[13px] font-medium text-[#64748B] mt-1.5 leading-tight">{label}</p>
    </>
  );

  const base = 'th-card p-5';

  if (href) {
    return (
      <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Link href={href} className={`${base} th-card-hover block`}>{inner}</Link>
      </motion.div>
    );
  }

  if (hover) {
    return (
      <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300 }} className={`${base} th-card-hover`}>
        {inner}
      </motion.div>
    );
  }

  return <div className={base}>{inner}</div>;
}
