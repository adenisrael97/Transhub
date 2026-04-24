/**
 * Shared utility helpers used across TransHub.
 * Centralised to avoid duplication and keep formatting consistent.
 */

/**
 * Format an ISO date string as a localised 12-hour time (e.g. "06:00 AM").
 * Returns '--:--' for falsy input.
 */
export function formatTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Return a human-readable duration between two ISO timestamps (e.g. "7h 0m").
 * Returns an empty string if either value is missing.
 */
export function formatDuration(dep, arr) {
  if (!dep || !arr) return '';
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60_000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * Format a number as Nigerian Naira with commas (e.g. "9,500").
 * Pass the raw number — the ₦ prefix is NOT included so callers can add their own.
 */
export function formatCurrency(amount) {
  return (amount ?? 0).toLocaleString();
}

/**
 * Capitalise the first letter of a string (e.g. "confirmed" → "Confirmed").
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
