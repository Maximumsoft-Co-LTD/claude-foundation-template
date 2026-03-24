/**
 * TokenService — reads tokens from D1, refreshes via Strava OAuth when expired.
 * SP1-T003
 */

interface TokenEnv {
  DB: D1Database;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
}

export interface ValidToken {
  access_token: string;
}

export class TokenRefreshError extends Error {
  constructor(
    public readonly athlete_id: number,
    public readonly http_status: number,
    message: string,
  ) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * Returns a valid access token for the given athlete.
 * If the stored token is within 5 minutes of expiry (or already expired),
 * calls Strava OAuth refresh endpoint and updates D1.
 * Throws TokenRefreshError if refresh fails.
 */
export async function getValidToken(athleteId: number, env: TokenEnv): Promise<ValidToken> {
  const row = await env.DB.prepare(
    'SELECT access_token, refresh_token, expires_at FROM tokens WHERE athlete_id = ?',
  )
    .bind(athleteId)
    .first<{ access_token: string; refresh_token: string; expires_at: number }>();

  if (!row) {
    throw new TokenRefreshError(athleteId, 0, `No token found for athlete ${athleteId}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = row.expires_at <= now + 300; // 5-minute buffer

  if (!needsRefresh) {
    return { access_token: row.access_token };
  }

  // Refresh via Strava OAuth
  const body = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
  });

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new TokenRefreshError(
      athleteId,
      response.status,
      `Strava token refresh failed with status ${response.status}`,
    );
  }

  const refreshed = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  await env.DB.prepare(
    'UPDATE tokens SET access_token = ?, refresh_token = ?, expires_at = ? WHERE athlete_id = ?',
  )
    .bind(refreshed.access_token, refreshed.refresh_token, refreshed.expires_at, athleteId)
    .run();

  console.info(`[sync] token refreshed for athlete ${athleteId}`);

  return { access_token: refreshed.access_token };
}
