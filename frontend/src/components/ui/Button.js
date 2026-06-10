'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm hover:shadow-[0_8px_24px_rgba(37,99,235,.25)]',
  secondary: 'bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569]',
  outline:   'border border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF]',
  ghost:     'hover:bg-[#F1F5F9] text-[#475569]',
  danger:    'bg-[#DC2626] hover:bg-[#B91C1C] text-white',
  success:   'bg-[#16A34A] hover:bg-[#15803D] text-white',
  warning:   'bg-[#D97706] hover:bg-[#B45309] text-white',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export default function Button({
  as: Component = 'button',
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  fullWidth = false,
  className = '',
  leftIcon  = null,
  rightIcon = null,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant] ?? variants.primary,
    sizes[size] ?? sizes.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  const content = (
    <>
      {loading && <Loader2 className="animate-spin shrink-0" size={size === 'xs' || size === 'sm' ? 14 : 16} />}
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  );

  // Polymorphic: render as a custom element/component (e.g. next/link) with
  // button styling. Skips the motion/disabled props that only apply to <button>.
  if (Component !== 'button') {
    return (
      <Component className={classes} {...props}>
        {content}
      </Component>
    );
  }

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {content}
    </motion.button>
  );
}
