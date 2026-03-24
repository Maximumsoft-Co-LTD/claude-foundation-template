/**
 * D1 tokens table helpers — SP1-T002
 */

import type { TokenRow } from '@/src/types/strava';

export type { TokenRow };

/**
 * Upsert a token row.
 * On conflict (athlete_id): updates all token fields (access_token, refresh_token, expires_at).
 */
export async function upsertToken(db: D1Database, token: TokenRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tokens (athlete_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (athlete_id) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at`,
    )
    .bind(token.athlete_id, token.access_token, token.refresh_token, token.expires_at)
    .run();
}
