'use client';

/**
 * Reusable loading skeleton for placeholder content.
 *
 * Usage:
 *   <Skeleton className="h-6 w-40" />               — single bar
 *   <Skeleton lines={4} />                           — 4 text lines
 *   <Skeleton variant="card" />                      — card placeholder
 *   <Skeleton variant="table" rows={5} cols={4} />   — table placeholder
 */
export default function Skeleton({ className = '', variant = 'bar', lines = 1, rows = 5, cols = 4 }) {
  const pulse = 'animate-pulse bg-gray-200 rounded-lg';

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-gray-100 p-6 space-y-4 ${className}`}>
        <div className={`${pulse} h-10 w-10 rounded-xl`} />
        <div className={`${pulse} h-6 w-1/2`} />
        <div className={`${pulse} h-4 w-3/4`} />
        <div className={`${pulse} h-4 w-1/3`} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex gap-4 px-6 py-4 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className={`${pulse} h-4 flex-1`} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className={`${pulse} h-4 flex-1`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${pulse} h-4`}
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Full-page loading state. Use as loading.js in App Router.
 */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      {/* Table */}
      <Skeleton variant="table" rows={6} cols={5} />
    </div>
  );
}
