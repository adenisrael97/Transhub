'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin, CheckCircle2, Circle, Building2 } from 'lucide-react';

export const STATUS_LABELS = {
  pending:        'Request Submitted',
  quote_sent:     'Quote Sent by Admin',
  paid:           'Payment Confirmed',
  dropped_off:    'Dropped at Origin Hub',
  picked_up:      'Picked Up by Carrier',
  in_transit:     'In Transit',
  arrived_at_hub: 'Arrived at Destination Hub',
  completed:      'Completed — Parcel Collected',
  cancelled:      'Cancelled',
};

const STATUS_COLORS = {
  completed:      'bg-[#DCFCE7] text-[#15803D]',
  arrived_at_hub: 'bg-[#DBEAFE] text-[#1D4ED8]',
  in_transit:     'bg-[#FEF3C7] text-[#92400E]',
  picked_up:      'bg-[#E0E7FF] text-[#4338CA]',
  dropped_off:    'bg-[#CCFBF1] text-[#0F766E]',
  paid:           'bg-[#DCFCE7] text-[#15803D]',
  quote_sent:     'bg-[#DBEAFE] text-[#1D4ED8]',
  pending:        'bg-[#F1F5F9] text-[#475569]',
  cancelled:      'bg-[#FEF2F2] text-[#DC2626]',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

export default function Tracker({ waybill }) {
  if (!waybill) return null;

  const statusColor = STATUS_COLORS[waybill.status] ?? 'bg-[#F1F5F9] text-[#475569]';
  const events = waybill.events ?? [];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide mb-1">Waybill Number</p>
          <p className="text-xl font-bold text-[#0F172A] font-mono">{waybill.waybillNo}</p>
        </div>
        <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold ${statusColor}`}>
          {STATUS_LABELS[waybill.status] ?? waybill.status}
        </span>
      </div>

      {/* Route summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F8FAFC] rounded-xl p-4">
        {[
          ['From',      waybill.fromLocation],
          ['To',        waybill.toLocation],
          ['Sender',    waybill.senderName],
          ['Recipient', waybill.recipientName],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-[#0F172A] mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Carrier + fee */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {waybill.description && (
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-0.5">Contents</p>
            <p className="text-[#0F172A] font-medium">{waybill.description}</p>
          </div>
        )}
        {waybill.weightKg && (
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-0.5">Weight</p>
            <p className="text-[#0F172A] font-medium">{waybill.weightKg} kg</p>
          </div>
        )}
        {waybill.fee && Number(waybill.fee) > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-0.5">Shipping Fee</p>
            <p className="text-[#16A34A] font-bold">₦{parseFloat(waybill.fee).toLocaleString('en-NG')}</p>
          </div>
        )}
        {waybill.assignedOperator && (
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-0.5">Carrier</p>
            <p className="text-[#0F172A] font-medium flex items-center gap-1">
              <Building2 size={12} className="text-[#94A3B8]" />
              {waybill.assignedOperator.companyName}
            </p>
          </div>
        )}
      </div>

      {/* Completion date */}
      {waybill.status === 'completed' && waybill.completedAt && (
        <div className="flex items-center gap-2 text-sm font-medium text-[#15803D] bg-[#DCFCE7] px-4 py-2.5 rounded-xl">
          <CalendarDays size={15} />
          Completed on {formatDate(waybill.completedAt)}
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#0F172A] mb-4">Tracking History</p>
          <div className="space-y-0">
            {events.map((event, i, arr) => {
              const isFirst = i === 0;
              const isLast  = i === arr.length - 1;
              return (
                <motion.div
                  key={event.id ?? i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    {isFirst ? (
                      <CheckCircle2 size={18} className="text-[#2563EB] shrink-0" />
                    ) : (
                      <Circle size={18} className="text-[#CBD5E1] shrink-0" />
                    )}
                    {!isLast && <div className="w-px flex-1 bg-[#E2E8F0] my-1" />}
                  </div>

                  <div className={`flex-1 ${!isLast ? 'pb-5' : 'pb-0'}`}>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {STATUS_LABELS[event.status] ?? event.status}
                      {event.note ? ` — ${event.note}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                          <MapPin size={10} />
                          {event.location}
                        </span>
                      )}
                      <span className="text-xs text-[#94A3B8]">{formatDate(event.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
