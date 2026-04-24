'use client';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatTime, formatDuration } from '@/lib/utils';

/**
 * Trip search result card — shows departure/arrival times, operator,
 * price, available seats, and a link to the seat selection page.
 */
export default function TripCard({ trip }) {
  const { id, from, to, departureTime, arrivalTime, operator, price, availableSeats, vehicleType } = trip;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          {vehicleType}
        </span>
        <span className="text-xs text-gray-400">{operator}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Departure */}
        <div className="text-center min-w-18">
          <p className="text-xl font-bold text-gray-900">{formatTime(departureTime)}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{from}</p>
        </div>

        {/* Middle */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400">{formatDuration(departureTime, arrivalTime)}</p>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-gray-200" />
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-xs text-green-600 font-medium">{availableSeats} seats left</p>
        </div>

        {/* Arrival */}
        <div className="text-center min-w-18">
          <p className="text-xl font-bold text-gray-900">{formatTime(arrivalTime)}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{to}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <div>
          <p className="text-xl font-bold text-blue-600">₦{(price ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">per seat</p>
        </div>
        <Link href={`/trips/${id}`}>
          <Button size="sm">Select Seat</Button>
        </Link>
      </div>
    </div>
  );
}

