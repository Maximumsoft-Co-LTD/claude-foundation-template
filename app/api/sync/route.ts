/**
 * POST /api/sync
 * Manual trigger for the hourly activity sync.
 * Protected by Authorization: Bearer {CRON_SECRET} header.
 * SP1-T003
 */
export const runtime = 'edge';

import { validateCronSecret } from '@/src/lib/sync/validate-cron-secret';
import { runSync } from '@/src/lib/sync';

export async function GET(request: Request): Promise<Response> {
  const env = (
    (request as unknown as { env?: Record<string, unknown> }).env ??
    (process as unknown as { env: Record<string, unknown> }).env
  ) as { DB: D1Database; STRAVA_CLIENT_ID: string; STRAVA_CLIENT_SECRET: string };

  try {
    const result = await runSync(env);
    return new Response(JSON.stringify({ synced: result.synced }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync] unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  // Retrieve Cloudflare Worker env (same pattern as callback route)
  const env = (
    (request as unknown as { env?: Record<string, unknown> }).env ??
    (process as unknown as { env: Record<string, unknown> }).env
  ) as {
    DB: D1Database;
    CRON_SECRET: string;
    STRAVA_CLIENT_ID: string;
    STRAVA_CLIENT_SECRET: string;
  };

  // Auth check
  const authError = await validateCronSecret(request, env);
  if (authError) return authError;

  try {
    const result = await runSync(env);
    return new Response(JSON.stringify({ synced: result.synced }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync] unexpected top-level error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
