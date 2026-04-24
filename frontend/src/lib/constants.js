/**
 * Shared constants used across the TransHub frontend.
 * Centralised here to avoid duplication and ensure consistency.
 */

/** Nigerian cities served by TransHub, used in search forms and selectors. */
export const CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Enugu',
  'Benin City',
  'Kaduna',
  'Owerri',
  'Calabar',
  'Warri',
  'Jos',
  'Uyo',
];

/** Tailwind class maps for booking / ticket status badges. */
export const STATUS_BADGE = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
  upcoming:  'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  // Operator request statuses
  approved:  'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-700',
  // Waybill statuses
  in_transit:       'bg-amber-100 text-amber-700',
  delivered:        'bg-green-100 text-green-700',
  out_for_delivery: 'bg-blue-100 text-blue-700',
};

/** Payment methods available at checkout. */
export const PAYMENT_METHODS = [
  { id: 'card',     label: 'Debit / Credit Card', icon: '💳' },
  { id: 'transfer', label: 'Bank Transfer',        icon: '🏦' },
  { id: 'ussd',     label: 'USSD (*737#)',          icon: '📱' },
];
