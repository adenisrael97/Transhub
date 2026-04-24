'use client';
import { Fragment } from 'react';
import useBookingStore from '@/store/bookingStore';

/**
 * Interactive seat map for a bus layout (2 + aisle + 2).
 * Reads/writes selected seats from bookingStore via toggleSeat.
 * Seat states: available, selected, taken (isBooked).
 */
export default function SeatMap({ seats = [] }) {
  const { selectedSeats, toggleSeat } = useBookingStore();

  const getStatus = (seat) => {
    if (seat.isBooked) return 'taken';
    if (selectedSeats.some((s) => s.id === seat.id)) return 'selected';
    return 'available';
  };

  const styles = {
    available: 'bg-gray-100 border-gray-200 hover:bg-blue-50 hover:border-blue-400 cursor-pointer',
    taken:     'bg-red-100 border-red-200 cursor-not-allowed opacity-60',
    selected:  'bg-blue-600 border-blue-600 text-white cursor-pointer',
  };

  return (
    <div className="select-none">
      {/* Legend */}
      <div className="flex items-center gap-5 mb-5 text-xs text-gray-500">
        {(['available', 'selected', 'taken']).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${styles[s]}`} />
            <span className="capitalize">{s}</span>
          </div>
        ))}
      </div>

      {/* Driver row */}
      <div className="flex justify-end mb-3">
        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">🚌 Driver</span>
      </div>

      {/* Seats — 2 + aisle + 2 layout */}
      <div className="grid grid-cols-[1fr_1fr_0.5fr_1fr_1fr] gap-2">
        {seats.map((seat, i) => {
          const status = getStatus(seat);
          const posInRow = i % 4;
          return (
            <Fragment key={seat.id}>
              <button
                disabled={status === 'taken'}
                onClick={() => status !== 'taken' && toggleSeat(seat)}
                aria-label={`Seat ${seat.label}${status === 'taken' ? ' (taken)' : status === 'selected' ? ' (selected)' : ''}`}
                className={`h-10 rounded-xl border text-xs font-semibold transition-all ${styles[status]}`}
              >
                {seat.label}
              </button>
              {posInRow === 1 && <div />}
            </Fragment>
          );
        })}
      </div>

      {/* Selection summary */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium">
          Selected: {selectedSeats.map((s) => s.label).join(', ')}
          <span className="ml-2 text-blue-400">({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})</span>
        </div>
      )}
    </div>
  );
}
