/**
 * Reusable data table with responsive overflow, consistent styling,
 * and optional empty state.
 *
 * @param {{
 *   columns: { key: string, label: string, className?: string }[],
 *   data: Record<string, any>[],
 *   renderRow: (item: any, index: number) => React.ReactNode,
 *   emptyIcon?: string,
 *   emptyMessage?: string,
 * }} props
 *
 * @example
 * <DataTable
 *   columns={[{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }]}
 *   data={items}
 *   renderRow={(item) => (
 *     <tr key={item.id} className="hover:bg-gray-50/50">
 *       <td className="px-5 py-3 text-sm">{item.name}</td>
 *       <td className="px-5 py-3 text-sm">{item.status}</td>
 *     </tr>
 *   )}
 * />
 */
export default function DataTable({
  columns = [],
  data = [],
  renderRow,
  emptyIcon = '📋',
  emptyMessage = 'No data found.',
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-3xl mb-3">{emptyIcon}</p>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
