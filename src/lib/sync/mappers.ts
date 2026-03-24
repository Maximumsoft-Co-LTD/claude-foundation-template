/**
 * Pure mapping functions for Strava activity data — SP1-T003
 */

const ALLOWED_TYPES = new Set(['Run', 'Ride', 'Walk', 'WeightTraining']);

/**
 * Normalise Strava activity type.
 * Run | Ride | Walk | WeightTraining → stored as-is.
 * All other values → "Other".
 */
export function normaliseType(stravaType: string): string {
  return ALLOWED_TYPES.has(stravaType) ? stravaType : 'Other';
}

/**
 * Convert meters to kilometers (3 decimal places).
 */
export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 1000) / 1000;
}

/**
 * Convert ISO-8601 date string to Unix epoch seconds.
 */
export function isoToUnix(iso8601: string): number {
  return Math.floor(Date.parse(iso8601) / 1000);
}
