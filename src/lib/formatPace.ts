/**
 * Format m/s speed as min/km pace string — e.g. "5:30 /km"
 */
export function formatPace(metersPerSec: number): string {
  if (metersPerSec <= 0) return '—';
  const secPerKm = 1000 / metersPerSec;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${min}:${sec} /km`;
}
