/**
 * GET /api/auth/callback
 * Receives the Strava OAuth code, exchanges it for tokens, upserts member +
 * token rows into D1, and redirects to /.
 * SP1-T002
 */
export const runtime = 'edge';

import { exchangeCodeForTokens } from '@/src/lib/strava';
import { upsertMember } from '@/src/lib/db/members';
import { upsertToken } from '@/src/lib/db/tokens';

/**
 * Build a 302 redirect Response with a Location header.
 * Uses a plain Response rather than Response.redirect() so that relative
 * paths work in both Edge Runtime and Node (Jest) environments.
 */
function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  // Strava redirected with an error (e.g. access_denied)
  if (errorParam) {
    return redirect('/connect?error=access_denied');
  }

  // Missing code — cannot proceed
  if (!code) {
    return redirect('/connect?error=token_exchange_failed');
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);

    const { athlete, access_token, refresh_token, expires_at } = tokenData;
    const athleteId = Number(athlete.id);
    const name = `${athlete.firstname} ${athlete.lastname}`.trim();
    const avatarUrl = athlete.profile;
    const createdAt = Math.floor(Date.now() / 1000);

    // Retrieve D1 binding from Cloudflare Pages request env.
    // Falls back to process.env for local dev compatibility.
    // Will throw if DB is absent — caught below and redirected to error page.
    const env = (request as unknown as { env?: Record<string, unknown> }).env
      ?? (process as unknown as { env: Record<string, unknown> }).env;
    const db = (env as Record<string, unknown>).DB as D1Database;

    await upsertMember(db, { athlete_id: athleteId, name, avatar_url: avatarUrl, created_at: createdAt });
    await upsertToken(db, { athlete_id: athleteId, access_token, refresh_token, expires_at });

    console.log(`[callback] member_connect_success athlete_id=${athleteId}`);

    return redirect(`/?connected=${encodeURIComponent(athlete.firstname)}`);
  } catch (err) {
    console.error('[callback] error:', err);
    return redirect('/connect?error=token_exchange_failed');
  }
}
