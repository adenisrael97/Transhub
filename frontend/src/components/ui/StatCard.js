/**
 * Reusable KPI / stat card used on admin, operator, and driver dashboards.
 *
 * @param {{ icon: string, label: string, value: string|number, bg?: string, color?: string, change?: string, hover?: boolean, href?: string, valueSize?: 'xl'|'2xl' }} props
 */
import Link from 'next/link';

export default function StatCard({
  icon,
  label,
  value,
  bg = 'bg-blue-50',
  color = 'text-blue-600',
  change,
  hover = false,
  href,
  valueSize = '2xl',
}) {
  const inner = (
    <>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <p className={`text-${valueSize} font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
      {change && <p className="text-xs text-green-600 font-semibold mt-1">{change}</p>}
    </>
  );

  const cls = `bg-white rounded-2xl border border-gray-100 p-5${hover ? ' hover:shadow-md hover:-translate-y-0.5 transition-all' : ''}`;

  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>;
  }

  return <div className={cls}>{inner}</div>;
}
