/**
 * formatCalories — SP1-T004
 *
 * Formats a calorie count with comma thousands separator and "kcal" suffix.
 *
 * Examples:
 *   1500 → "1,500 kcal"
 *   800  → "800 kcal"
 */
export function formatCalories(cal: number): string {
  return `${cal.toLocaleString('en-US')} kcal`;
}
