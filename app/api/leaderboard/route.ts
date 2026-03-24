/**
 * GET /api/leaderboard — SP1-T004 / SP1-T005
 *
 * Public endpoint. Returns the weekly leaderboard aggregated from D1.
 * Week range: Monday 00:00:00 UTC → Sunday 23:59:59 UTC.
 * Sorted: total_distance_km DESC, total_duration_sec ASC.
 *
 * T005 extension: optional ?type= query param filters by activity type.
 * Valid values: Run, Ride, Walk, WeightTraining, Other, all (default).
 */
export const runtime = 'edge';

import { getLeaderboard, VALID_TYPES, InvalidTypeError } from '@/src/lib/leaderboard-service';

export async function GET(request: Request): Promise<Response> {
  const env = (
    (request as unknown as { env?: Record<string, unknown> }).env ??
    (process as unknown as { env: Record<string, unknown> }).env
  ) as { DB: D1Database };

  // Parse ?type= query param
  const url = new URL((request as unknown as { url: string }).url);
  const rawType = url.searchParams.get('type');

  // Normalize: absent / 'all' (case-insensitive) / empty string sentinel handled below.
  // 'all' and absent → null (no filter). Empty string and unknown values → 400.
  let normalizedType: string | null;
  if (rawType === null || rawType.toLowerCase() === 'all') {
    normalizedType = null;
  } else if (rawType === '' || !(VALID_TYPES as readonly string[]).includes(rawType)) {
    // Empty string and any value not in VALID_TYPES are invalid
    return new Response(
      JSON.stringify({
        error: `Invalid activity type. Valid types: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
        valid_types: [...VALID_TYPES],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  } else {
    normalizedType = rawType;
  }

  try {
    const data = await getLeaderboard(env.DB, normalizedType);

    console.info('[leaderboard] GET complete', {
      week_start: data.week_start,
      week_end: data.week_end,
      member_count: data.members.length,
      type_filter: data.type_filter,
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof InvalidTypeError) {
      return new Response(
        JSON.stringify({
          error: `Invalid activity type. Valid types: ${VALID_TYPES.join(', ')}`,
          code: 'INVALID_TYPE',
          valid_types: [...VALID_TYPES],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const error = err as Error;
    console.error('[leaderboard] error', {
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
