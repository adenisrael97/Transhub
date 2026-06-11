'use client';

import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  renderRow,
  emptyIcon,
  emptyMessage = 'No data found.',
  emptyAction,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  if (data.length === 0) {
    return (
      <div className="th-card p-16 text-center">
        {emptyIcon && <div className="flex justify-center mb-4 text-[#94A3B8]">{emptyIcon}</div>}
        <p className="text-sm font-medium text-[#64748B]">{emptyMessage}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  let sorted = [...data];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden sm:block th-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-3.5 text-xs font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-[#0F172A]' : ''} ${col.className ?? ''}`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? sortDir === 'asc' ? <ArrowUp size={12} className="text-[#2563EB]" /> : <ArrowDown size={12} className="text-[#2563EB]" />
                          : <ArrowUpDown size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {paginated.map((item, i) => {
                const row = renderRow(item, i + (page - 1) * PER_PAGE);
                // Add alternating + hover classes to each tr
                return row;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {paginated.map((item, i) => (
          <div key={i} className="th-card p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-3 py-1.5 text-sm border-b border-[#F1F5F9] last:border-0">
                <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wide">{col.label}</span>
                <span className="text-[#0F172A] font-semibold text-right">{String(item[col.key] ?? '—')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#64748B] pt-1">
          <span>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-[#0F172A] tabular-nums">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
