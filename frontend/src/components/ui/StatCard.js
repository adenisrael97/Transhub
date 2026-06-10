'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const VARIANT_STYLES = {
  blue:  { pill: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-600'   },
  green: { pill: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-600'  },
  amber: { pill: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-600'  },
  red:   { pill: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-600'    },
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

  const inner = (
    <>
      <div className={`w-11 h-11 ${bg} rounded-full flex items-center justify-center mb-3 shrink-0`}>
        {typeof icon === 'string' ? (
          <span className="text-xl">{icon}</span>
        ) : icon ? (
          <span className={color}>{icon}</span>
        ) : null}
      </div>
      <p className={`text-${valueSize} font-bold ${color} leading-none`}>{value}</p>
      <p className="text-xs text-[#94A3B8] mt-1 leading-tight">{label}</p>
      {change && (
        <p className={`text-xs font-semibold mt-1 flex items-center gap-0.5 ${isUp ? 'text-[#16A34A]' : isDown ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
          {isUp && <TrendingUp size={11} />}
          {isDown && <TrendingDown size={11} />}
          {change}
        </p>
      )}
    </>
  );

  const cls = `bg-white rounded-2xl border border-[#E2E8F0] p-5`;

  if (href) {
    return (
      <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Link href={href} className={`${cls} block hover:shadow-md transition-shadow`}>{inner}</Link>
      </motion.div>
    );
  }

  if (hover) {
    return (
      <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }} className={`${cls} hover:shadow-md transition-shadow`}>
        {inner}
      </motion.div>
    );
  }

  return <div className={cls}>{inner}</div>;
}
