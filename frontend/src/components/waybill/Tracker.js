'use client';

import { STATUS_BADGE } from '@/lib/constants';

const STATUS_LABELS = {
  created:           'Waybill Created',
  picked_up:         'Picked Up from Sender',
  in_transit:        'In Transit',
  at_hub:            'At Sorting Hub',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
};

export default function Tracker({ waybill }) {
  if (!waybill) return null;

  const badge = STATUS_BADGE[waybill.status] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400">Waybill Number</p>
          <p className="text-lg font-bold text-gray-900">{waybill.waybillNo}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${badge}`}>
          {STATUS_LABELS[waybill.status] ?? waybill.status}
        </span>
      </div>

      {/* Route summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
        {[
          ['From', waybill.from],
          ['To', waybill.to],
          ['Sender', waybill.senderName],
          ['Receiver', waybill.receiverName],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {waybill.estimatedDelivery && (
        <p className="text-sm text-green-700 font-medium">
          📅 Est. delivery: {waybill.estimatedDelivery}
        </p>
      )}

      {/* Timeline */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-4">Tracking History</p>
        <div className="space-y-4">
          {(waybill.updates ?? []).map((update, i, arr) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 mt-0.5 ${
                  i === 0 ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`} />
                {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="pb-4">
                <p className="text-xs text-gray-400">{update.date}</p>
                <p className="text-sm font-medium text-gray-800">{update.status}</p>
                <p className="text-xs text-gray-500">{update.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
