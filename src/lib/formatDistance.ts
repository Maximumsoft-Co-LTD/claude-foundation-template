/**
 * formatDistance — SP1-T004
 *
 * Formats a distance in km to one decimal place with "km" suffix.
 *
 * Examples:
 *   42.5 → "42.5 km"
 *   0    → "0.0 km"
 */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
