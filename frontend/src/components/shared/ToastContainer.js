'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '@/store/toastStore';

const CONFIG = {
  success: {
    icon: CheckCircle2,
    bar:  'bg-[#16A34A]',
    bg:   'bg-white border-[#BBF7D0]',
    icon_cls: 'text-[#16A34A]',
    text: 'text-[#14532D]',
  },
  error: {
    icon: XCircle,
    bar:  'bg-[#DC2626]',
    bg:   'bg-white border-[#FECACA]',
    icon_cls: 'text-[#DC2626]',
    text: 'text-[#7F1D1D]',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-[#D97706]',
    bg:   'bg-white border-[#FDE68A]',
    icon_cls: 'text-[#D97706]',
    text: 'text-[#78350F]',
  },
  info: {
    icon: Info,
    bar:  'bg-[#2563EB]',
    bg:   'bg-white border-[#BFDBFE]',
    icon_cls: 'text-[#2563EB]',
    text: 'text-[#1E3A8A]',
  },
};

const DURATION_MS = 4000;

function Toast({ toast, onRemove }) {
  const cfg = CONFIG[toast.type] ?? CONFIG.info;
  const Icon = cfg.icon;
  const barRef = useRef(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.transition = `width ${DURATION_MS}ms linear`;
    requestAnimationFrame(() => { el.style.width = '0%'; });
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`relative w-80 rounded-xl border shadow-lg overflow-hidden pointer-events-auto ${cfg.bg}`}
      role="alert"
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-4">
        <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.icon_cls}`} />
        <p className={`flex-1 text-sm font-medium leading-snug ${cfg.text}`}>{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 text-[#94A3B8] hover:text-[#475569] transition-colors -mt-0.5"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
      {/* Progress bar */}
      <div
        ref={barRef}
        className={`absolute bottom-0 left-0 h-0.5 w-full ${cfg.bar}`}
      />
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-200 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
