/**
 * Strava API helpers — SP1-T002
 */

import type { StravaTokenResponse } from '@/src/types/strava';

export type { StravaTokenResponse };

/**
 * Build the Strava OAuth authorization URL.
 * Returns null if required env vars are missing.
 */
export function buildAuthUrl(): string | null {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) return null;

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${appUrl}/api/auth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'activity:read_all');
  return url.toString();
}

/**
 * Exchange an OAuth authorization code for tokens via Strava's token endpoint.
 * Throws on non-2xx response or network error.
 */
export async function exchangeCodeForTokens(code: string): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  const body = new URLSearchParams({
    client_id: clientId ?? '',
    client_secret: clientSecret ?? '',
    code,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status}`);
  }

  return res.json() as Promise<StravaTokenResponse>;
}
