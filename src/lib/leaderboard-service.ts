/**
 * leaderboard-service — SP1-T004
 *
 * Query logic for the weekly leaderboard. Extracted from the route handler
 * so it can be integration-tested directly (same pattern as sync-service.ts).
 */

import { getCurrentWeekRange } from './getCurrentWeekRange';

export interface LeaderboardRow {
  athlete_id: number;
  name: string;
  avatar_url: string;
  total_distance_km: number;
  total_duration_sec: number;
  total_calories: number;
  activity_count: number;
  total_elevation_gain: number | null;
  avg_heartrate: number | null;
  avg_speed: number | null;
}

export interface LeaderboardServiceResult {
  week_start: string;
  week_end: string;
  type_filter: string;
  last_synced_at: number | null;
  members: LeaderboardRow[];
}

export const VALID_TYPES = ['Run', 'Ride', 'Walk', 'WeightTraining', 'Other'] as const;
export type ActivityType = (typeof VALID_TYPES)[number];

export class InvalidTypeError extends Error {
  code = 'INVALID_TYPE' as const;
  constructor(type: string) {
    super(`Invalid activity type: "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
    this.name = 'InvalidTypeError';
  }
}

// Use anonymous ? parameters for compatibility with better-sqlite3 in tests.
// D1 (Cloudflare) also supports ? parameters — same positional semantics.
const BASE_SQL = `
SELECT
    m.athlete_id,
    m.name,
    m.avatar_url,
    ROUND(SUM(a.distance_km), 1)                   AS total_distance_km,
    SUM(a.duration_sec)                            AS total_duration_sec,
    COALESCE(SUM(a.calories), 0)                   AS total_calories,
    COUNT(a.id)                                    AS activity_count,
    ROUND(SUM(a.total_elevation_gain), 0)          AS total_elevation_gain,
    ROUND(AVG(CASE WHEN a.average_heartrate > 0 THEN a.average_heartrate END), 1) AS avg_heartrate,
    ROUND(AVG(CASE WHEN a.average_speed > 0 THEN a.average_speed END), 4)         AS avg_speed,
    (SELECT MAX(last_synced_at) FROM members)      AS last_synced_at
FROM members m
INNER JOIN activities a ON a.athlete_id = m.athlete_id
WHERE a.activity_date >= ?
  AND a.activity_date <= ?
`;

const BASE_SQL_TAIL = `
GROUP BY m.athlete_id, m.name, m.avatar_url
ORDER BY total_distance_km DESC, total_duration_sec ASC
`;

export async function getLeaderboard(
  db: D1Database,
  type?: string | null,
): Promise<LeaderboardServiceResult> {
  const { weekStartEpoch, weekEndEpoch, weekStartISO, weekEndISO } = getCurrentWeekRange();

  // Normalize: null / undefined / 'all' → no filter
  const normalizedType = (!type || type.toLowerCase() === 'all') ? null : type;

  // Validate if a specific type was provided
  if (normalizedType !== null && !(VALID_TYPES as readonly string[]).includes(normalizedType)) {
    throw new InvalidTypeError(normalizedType);
  }

  // Build SQL with optional type WHERE clause
  let sql: string;
  let bindings: unknown[];

  if (normalizedType !== null) {
    sql = BASE_SQL + '  AND a.type = ?' + BASE_SQL_TAIL;
    bindings = [weekStartEpoch, weekEndEpoch, normalizedType];
  } else {
    sql = BASE_SQL + BASE_SQL_TAIL;
    bindings = [weekStartEpoch, weekEndEpoch];
  }

  const result = await db
    .prepare(sql)
    .bind(...bindings)
    .all<LeaderboardRow & { last_synced_at: number | null }>();

  const rows = result.results;
  const lastSyncedAt = rows[0]?.last_synced_at ?? null;

  // Strip the last_synced_at scalar subquery field from each member row
  const members: LeaderboardRow[] = rows.map(({ last_synced_at: _ls, ...member }) => member);

  return {
    week_start: weekStartISO,
    week_end: weekEndISO,
    type_filter: normalizedType ?? 'all',
    last_synced_at: lastSyncedAt,
    members,
  };
}
