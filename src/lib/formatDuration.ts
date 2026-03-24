/**
 * formatDuration — SP1-T004
 *
 * Converts total seconds to h:mm format.
 * No leading zero on hours; always two digits on minutes.
 *
 * Examples:
 *   0     → "0:00"
 *   540   → "0:09"
 *   3720  → "1:02"
 *   18000 → "5:00"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}
