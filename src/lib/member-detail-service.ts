/**
 * member-detail-service — personal weekly dashboard data
 */

import { getCurrentWeekRange } from './getCurrentWeekRange';

export interface ActivityDetail {
  id: number;
  name: string | null;
  type: string;
  distance_km: number;
  duration_sec: number;
  calories: number;
  total_elevation_gain: number | null;
  average_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  kudos_count: number | null;
  achievement_count: number | null;
  activity_date: number;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  distance_km: number;
  duration_sec: number;
  calories: number;
}

export interface MemberDetailResult {
  member: { athlete_id: number; name: string; avatar_url: string } | null;
  week_start: string;
  week_end: string;
  totals: {
    distance_km: number;
    duration_sec: number;
    calories: number;
    elevation_gain: number;
    activity_count: number;
    avg_heartrate: number | null;
    avg_speed: number | null;
  };
  by_type: TypeBreakdown[];
  activities: ActivityDetail[];
  highlights: {
    longest_activity: ActivityDetail | null;
    highest_elevation: ActivityDetail | null;
    most_calories: ActivityDetail | null;
    most_kudos: ActivityDetail | null;
  };
}

export async function getMemberDetail(
  db: D1Database,
  athleteId: number,
): Promise<MemberDetailResult> {
  const { weekStartEpoch, weekEndEpoch, weekStartISO, weekEndISO } = getCurrentWeekRange();

  // Member info
  const member = await db
    .prepare('SELECT athlete_id, name, avatar_url FROM members WHERE athlete_id = ?')
    .bind(athleteId)
    .first<{ athlete_id: number; name: string; avatar_url: string }>();

  // Aggregated totals for the week
  const totalsRow = await db
    .prepare(
      `SELECT
        ROUND(SUM(distance_km), 2)                                                    AS distance_km,
        SUM(duration_sec)                                                             AS duration_sec,
        COALESCE(SUM(calories), 0)                                                    AS calories,
        ROUND(COALESCE(SUM(total_elevation_gain), 0), 0)                              AS elevation_gain,
        COUNT(id)                                                                     AS activity_count,
        ROUND(AVG(CASE WHEN average_heartrate > 0 THEN average_heartrate END), 1)    AS avg_heartrate,
        ROUND(AVG(CASE WHEN average_speed > 0 THEN average_speed END), 4)            AS avg_speed
      FROM activities
      WHERE athlete_id = ? AND activity_date >= ? AND activity_date <= ?`,
    )
    .bind(athleteId, weekStartEpoch, weekEndEpoch)
    .first<{
      distance_km: number;
      duration_sec: number;
      calories: number;
      elevation_gain: number;
      activity_count: number;
      avg_heartrate: number | null;
      avg_speed: number | null;
    }>();

  // Breakdown by type
  const byTypeResult = await db
    .prepare(
      `SELECT
        type,
        COUNT(id)             AS count,
        ROUND(SUM(distance_km), 2) AS distance_km,
        SUM(duration_sec)     AS duration_sec,
        COALESCE(SUM(calories), 0) AS calories
      FROM activities
      WHERE athlete_id = ? AND activity_date >= ? AND activity_date <= ?
      GROUP BY type
      ORDER BY distance_km DESC`,
    )
    .bind(athleteId, weekStartEpoch, weekEndEpoch)
    .all<TypeBreakdown>();

  // Individual activities
  const activitiesResult = await db
    .prepare(
      `SELECT
        id, name, type, distance_km, duration_sec, calories,
        total_elevation_gain, average_speed, average_heartrate, max_heartrate,
        kudos_count, achievement_count, activity_date
      FROM activities
      WHERE athlete_id = ? AND activity_date >= ? AND activity_date <= ?
      ORDER BY activity_date DESC`,
    )
    .bind(athleteId, weekStartEpoch, weekEndEpoch)
    .all<ActivityDetail>();

  const activities = activitiesResult.results;

  // Highlights
  const findMax = (field: keyof ActivityDetail) =>
    activities.reduce(
      (best, a) =>
        (a[field] as number) != null && (a[field] as number) > ((best?.[field] as number) ?? -Infinity)
          ? a
          : best,
      null as ActivityDetail | null,
    );

  const longest = activities.reduce(
    (best, a) =>
      a.distance_km > (best?.distance_km ?? -1) ? a : best,
    null as ActivityDetail | null,
  );

  return {
    member: member ?? null,
    week_start: weekStartISO,
    week_end: weekEndISO,
    totals: {
      distance_km: totalsRow?.distance_km ?? 0,
      duration_sec: totalsRow?.duration_sec ?? 0,
      calories: totalsRow?.calories ?? 0,
      elevation_gain: totalsRow?.elevation_gain ?? 0,
      activity_count: totalsRow?.activity_count ?? 0,
      avg_heartrate: totalsRow?.avg_heartrate ?? null,
      avg_speed: totalsRow?.avg_speed ?? null,
    },
    by_type: byTypeResult.results,
    activities,
    highlights: {
      longest_activity: longest,
      highest_elevation: findMax('total_elevation_gain'),
      most_calories: findMax('calories'),
      most_kudos: findMax('kudos_count'),
    },
  };
}
