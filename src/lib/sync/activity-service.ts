/**
 * ActivityService — fetches activities from Strava and upserts them into D1.
 * SP1-T003
 */

import { normaliseType, metersToKm, isoToUnix } from './mappers';

interface ActivityEnv {
  DB: D1Database;
}

export class ActivityFetchError extends Error {
  constructor(
    public readonly athlete_id: number,
    public readonly http_status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ActivityFetchError';
  }
}

interface StravaRawActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  calories: number | null;
  start_date: string;
  total_elevation_gain: number | null;
  elev_high: number | null;
  elev_low: number | null;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_cadence: number | null;
  average_watts: number | null;
  max_watts: number | null;
  weighted_average_watts: number | null;
  kilojoules: number | null;
  achievement_count: number | null;
  kudos_count: number | null;
  comment_count: number | null;
  workout_type: number | null;
  commute: boolean | null;
  trainer: boolean | null;
  manual: boolean | null;
  visibility: string | null;
  gear_id: string | null;
  timezone: string | null;
  utc_offset: number | null;
  map: { summary_polyline: string | null } | null;
}

/**
 * Determines the `after` Unix timestamp for the Strava activities query.
 * Uses MAX(activity_date) for the athlete if any activities exist,
 * otherwise defaults to now minus 90 days.
 */
async function getAfterTimestamp(athleteId: number, db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT MAX(activity_date) as last_ts FROM activities WHERE athlete_id = ?')
    .bind(athleteId)
    .first<{ last_ts: number | null }>();

  if (row?.last_ts != null) {
    return row.last_ts;
  }

  // Default: 90 days ago
  return Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
}

/**
 * Fetch full detail for a single activity from Strava (includes calories).
 * Returns null on failure so we fall back to list data gracefully.
 */
async function fetchActivityDetail(
  activityId: number,
  accessToken: string,
): Promise<StravaRawActivity | null> {
  const res = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<StravaRawActivity>;
}

/**
 * Fetches recent activities for an athlete from Strava and upserts them into D1.
 * For each new activity not yet in DB, fetches the detail endpoint to get calories.
 * Throws ActivityFetchError on Strava API failure.
 */
export async function fetchAndUpsert(
  athleteId: number,
  accessToken: string,
  env: ActivityEnv,
): Promise<{ count: number }> {
  const after = await getAfterTimestamp(athleteId, env.DB);

  const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new ActivityFetchError(
      athleteId,
      response.status,
      `Strava activities fetch failed with status ${response.status}`,
    );
  }

  const activities = (await response.json()) as StravaRawActivity[];

  // Get IDs of activities already stored with valid calories so we skip re-fetching them
  const existingIds = new Set<number>();
  if (activities.length > 0) {
    const ids = activities.map((a) => a.id).join(',');
    const rows = await env.DB
      .prepare(`SELECT id FROM activities WHERE id IN (${ids}) AND calories > 0`)
      .all<{ id: number }>();
    for (const r of rows.results) existingIds.add(r.id);
  }

  for (const act of activities) {
    // Fetch detail to get calories for new/uncalorie'd activities
    const detail = existingIds.has(act.id)
      ? null
      : await fetchActivityDetail(act.id, accessToken);

    const merged = detail ?? act;

    await env.DB.prepare(
      `INSERT OR REPLACE INTO activities
         (id, athlete_id, type, distance_km, duration_sec, calories, activity_date,
          name, sport_type, elapsed_time_sec, total_elevation_gain, elev_high, elev_low,
          average_speed, max_speed, average_heartrate, max_heartrate, average_cadence,
          average_watts, max_watts, weighted_average_watts, kilojoules,
          achievement_count, kudos_count, comment_count, workout_type,
          commute, trainer, manual, visibility, gear_id, timezone, utc_offset, polyline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        merged.id,
        athleteId,
        normaliseType(merged.type),
        metersToKm(merged.distance),
        merged.moving_time,
        merged.calories ?? 0,
        isoToUnix(merged.start_date),
        merged.name ?? null,
        merged.sport_type ?? null,
        merged.elapsed_time ?? null,
        merged.total_elevation_gain ?? null,
        merged.elev_high ?? null,
        merged.elev_low ?? null,
        merged.average_speed ?? null,
        merged.max_speed ?? null,
        merged.average_heartrate ?? null,
        merged.max_heartrate ?? null,
        merged.average_cadence ?? null,
        merged.average_watts ?? null,
        merged.max_watts ?? null,
        merged.weighted_average_watts ?? null,
        merged.kilojoules ?? null,
        merged.achievement_count ?? null,
        merged.kudos_count ?? null,
        merged.comment_count ?? null,
        merged.workout_type ?? null,
        merged.commute ? 1 : 0,
        merged.trainer ? 1 : 0,
        merged.manual ? 1 : 0,
        merged.visibility ?? null,
        merged.gear_id ?? null,
        merged.timezone ?? null,
        merged.utc_offset ?? null,
        merged.map?.summary_polyline ?? null,
      )
      .run();
  }

  return { count: activities.length };
}
