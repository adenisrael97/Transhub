'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatTime, formatDuration } from '@/lib/utils';

const AMENITY_MAX_VISIBLE = 3;

export default function TripCard({ trip }) {
  const { id, from, to, departureTime, arrivalTime, operator, price, availableSeats, vehicleType, isFull, parkName, amenities } = trip;

  const blocked = isFull || availableSeats === 0;
  const seatsLow = !blocked && availableSeats <= 5;
  const visibleAmenities = (amenities ?? []).slice(0, AMENITY_MAX_VISIBLE);
  const extraAmenities   = (amenities ?? []).length - AMENITY_MAX_VISIBLE;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:shadow-md transition-shadow"
    >
      {/* Top row: vehicle type + operator */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
          {vehicleType}
        </span>
        <div className="text-right">
          <span className="text-xs font-medium text-[#94A3B8]">{operator}</span>
          {parkName && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <MapPin size={10} className="text-[#94A3B8] shrink-0" />
              <span className="text-[10px] text-[#94A3B8] truncate max-w-36">{parkName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Route timeline */}
      <div className="flex items-center gap-3">
        <div className="text-center min-w-18">
          <p className="text-xl font-bold text-[#0F172A]">{formatTime(departureTime)}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{from}</p>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-[10px] font-medium text-[#94A3B8]">{formatDuration(departureTime, arrivalTime)}</p>
          <div className="w-full flex items-center gap-1.5">
            <div className="h-px flex-1 bg-[#E2E8F0]" />
            <ArrowRight size={14} className="text-[#2563EB] shrink-0" />
            <div className="h-px flex-1 bg-[#E2E8F0]" />
          </div>
          {blocked ? (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#DC2626]">
              <Users size={10} />
              FULL
            </div>
          ) : (
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${seatsLow ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
              <Users size={10} />
              {availableSeats} seat{availableSeats !== 1 ? 's' : ''} left
            </div>
          )}
        </div>

        <div className="text-center min-w-18">
          <p className="text-xl font-bold text-[#0F172A]">{formatTime(arrivalTime)}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{to}</p>
        </div>
      </div>

      {/* Amenity badges */}
      {visibleAmenities.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#F1F5F9]">
          {visibleAmenities.map((a) => (
            <span key={a} className="text-[10px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
          {extraAmenities > 0 && (
            <span className="text-[10px] font-medium text-[#94A3B8]">+{extraAmenities} more</span>
          )}
        </div>
      )}

      {/* Footer: price + CTA */}
      <div className={`flex items-center justify-between pt-4 border-t border-[#F1F5F9] ${visibleAmenities.length > 0 ? 'mt-3' : 'mt-4'}`}>
        <div>
          <p className="text-xl font-bold text-[#2563EB]">₦{(price ?? 0).toLocaleString()}</p>
          <p className="text-xs text-[#94A3B8]">per seat</p>
        </div>
        <Button as={Link} href={`/trips/${id}`} size="sm">View Trip</Button>
      </div>
    </motion.div>
  );
}
