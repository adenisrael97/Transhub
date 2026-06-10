'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Server-side pagination control. Renders nothing for a single page.
 * `pagination` is the backend meta block: { page, limit, total, totalPages }.
 * `onPageChange(nextPage)` should drive the list hook's setPage.
 */
export default function Pagination({ pagination, onPageChange, loading = false, className = '' }) {
  if (!pagination) return null;
  const { page, limit, total, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const btn =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <div className={`flex items-center justify-between gap-3 text-sm text-[#94A3B8] pt-3 ${className}`}>
      <span className="text-xs">
        Showing <span className="font-semibold text-[#475569]">{start}–{end}</span> of{' '}
        <span className="font-semibold text-[#475569]">{total.toLocaleString()}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className={btn}
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-xs font-medium text-[#0F172A] tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className={btn}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
