/**
 * getCurrentWeekRange — SP1-T004
 *
 * Returns the current ISO week range: Monday 00:00:00 UTC → Sunday 23:59:59 UTC.
 * Week is defined as Mon–Sun UTC regardless of caller locale.
 */

export interface WeekRange {
  weekStartEpoch: number; // Unix seconds — Monday 00:00:00 UTC
  weekEndEpoch: number;   // Unix seconds — Sunday 23:59:59 UTC
  weekStartISO: string;   // "YYYY-MM-DD"
  weekEndISO: string;     // "YYYY-MM-DD"
}

export function getCurrentWeekRange(): WeekRange {
  const now = new Date(Date.now());

  // getUTCDay(): 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
  const dayOfWeek = now.getUTCDay();
  // Days since Monday: Sun=6, Mon=0, Tue=1, ..., Sat=5
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Monday at 00:00:00 UTC
  const weekStartMs =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
    daysFromMonday * 86400 * 1000;

  // Sunday at 23:59:59 UTC = Monday + 6 days + 23h59m59s
  const weekEndMs = weekStartMs + 6 * 86400 * 1000 + (23 * 3600 + 59 * 60 + 59) * 1000;

  const weekStartEpoch = Math.floor(weekStartMs / 1000);
  const weekEndEpoch = Math.floor(weekEndMs / 1000);

  const weekStartDate = new Date(weekStartMs);
  const weekEndDate = new Date(weekEndMs);

  function toISO(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return {
    weekStartEpoch,
    weekEndEpoch,
    weekStartISO: toISO(weekStartDate),
    weekEndISO: toISO(weekEndDate),
  };
}
