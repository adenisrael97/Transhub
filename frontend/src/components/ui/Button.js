'use client';

/**
 * Reusable button component with multiple variants, sizes, and loading state.
 * Variants: primary, secondary, success, danger, warning, ghost, outline.
 * Sizes: xs, sm, md, lg.
 */
const variants = {
  primary:  'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary:'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
  success:  'bg-green-600 hover:bg-green-700 text-white',
  danger:   'bg-red-600 hover:bg-red-700 text-white',
  warning:  'bg-amber-500 hover:bg-amber-600 text-white',
  ghost:    'hover:bg-gray-100 text-gray-600',
  outline:  'border border-blue-600 text-blue-600 hover:bg-blue-50',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
