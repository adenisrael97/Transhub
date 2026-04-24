'use client';

/**
 * Reusable filter tabs — pill-style buttons for filtering lists/tables.
 *
 * @param {{ items: string[], active: string, onChange: (item: string) => void, color?: string, counts?: Record<string, number>, labels?: Record<string, string> }} props
 * @example <FilterTabs items={['all','active','completed']} active={filter} onChange={setFilter} />
 * @example <FilterTabs items={['all','pending','approved']} active={filter} onChange={setFilter} counts={{ pending: 3, approved: 12 }} />
 */
export default function FilterTabs({ items = [], active, onChange, color = 'blue', counts, labels }) {
  const colors = {
    blue:  { active: 'bg-blue-600 text-white', inactive: 'text-gray-500 hover:bg-gray-50' },
    green: { active: 'bg-green-600 text-white', inactive: 'text-gray-500 hover:bg-gray-50' },
    amber: { active: 'bg-amber-500 text-white', inactive: 'text-gray-500 hover:bg-gray-50' },
  };
  const palette = colors[color] ?? colors.blue;

  return (
    <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1" role="tablist">
      {items.map((item) => {
        const label = labels?.[item] ?? item;
        const count = counts?.[item];
        return (
          <button
            key={item}
            role="tab"
            aria-selected={active === item}
            onClick={() => onChange(item)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              active === item ? palette.active : palette.inactive
            }`}
          >
            {label}{count != null ? ` (${count})` : ''}
          </button>
        );
      })}
    </div>
  );
}
