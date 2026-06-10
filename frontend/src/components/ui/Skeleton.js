'use client';

const pulse = 'animate-pulse bg-[#E2E8F0] rounded-lg';

export function SkeletonLine({ width = '100%', height = 'h-4', className = '' }) {
  return <div className={`${pulse} ${height} ${className}`} style={{ width }} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 ${className}`}>
      <div className={`${pulse} h-11 w-11 rounded-full`} />
      <div className={`${pulse} h-7 w-1/2`} />
      <div className={`${pulse} h-3.5 w-3/4`} />
    </div>
  );
}

export function SkeletonStatCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className={`${pulse} h-11 w-11 rounded-full`} />
        <div className={`${pulse} h-4 w-16 rounded-full`} />
      </div>
      <div className={`${pulse} h-8 w-24`} />
      <div className={`${pulse} h-3 w-32`} />
    </div>
  );
}

export function SkeletonTripCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className={`${pulse} h-5 w-40`} />
          <div className={`${pulse} h-3.5 w-24`} />
        </div>
        <div className="space-y-2 text-right">
          <div className={`${pulse} h-6 w-20 ml-auto`} />
          <div className={`${pulse} h-3.5 w-16 ml-auto`} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className={`${pulse} h-4 w-24 rounded-full`} />
        <div className={`${pulse} h-4 w-20 rounded-full`} />
        <div className={`${pulse} h-8 w-24 rounded-xl ml-auto`} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden ${className}`}>
      <div className="flex gap-4 px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`${pulse} h-3.5 flex-1`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 border-b border-[#F1F5F9] last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`${pulse} h-4 flex-1`} style={{ opacity: 1 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Skeleton({ className = '', variant = 'bar', lines = 1, rows = 5, cols = 4 }) {
  if (variant === 'card')  return <SkeletonCard className={className} />;
  if (variant === 'table') return <SkeletonTable rows={rows} cols={cols} className={className} />;

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

export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <div className={`${pulse} h-7 w-48`} />
        <div className={`${pulse} h-4 w-32`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
