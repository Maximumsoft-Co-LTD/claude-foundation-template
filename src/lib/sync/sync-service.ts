/**
 * SyncService — orchestrates per-member activity sync.
 * Each member is processed in an isolated try/catch so one failure
 * does not block the remaining members.
 * SP1-T003
 */

import { getValidToken, TokenRefreshError } from './token-service';
import { fetchAndUpsert, ActivityFetchError } from './activity-service';

interface SyncEnv {
  DB: D1Database;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
}

export interface SyncResult {
  synced: number;
}

/**
 * Run a full sync for all members in the D1 `members` table.
 * Returns { synced: N } where N is the count of successfully processed members.
 */
export async function runSync(env: SyncEnv): Promise<SyncResult> {
  const start = Date.now();

  const result = await env.DB.prepare('SELECT athlete_id FROM members')
    .all<{ athlete_id: number }>();

  const members = result.results;
  const memberCount = members.length;

  console.info(`[sync] started: ${memberCount} members`);

  let synced = 0;
  let skipped = 0;

  for (const member of members) {
    const athleteId = member.athlete_id;

    try {
      const token = await getValidToken(athleteId, env);
      await fetchAndUpsert(athleteId, token.access_token, env);

      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare('UPDATE members SET last_synced_at = ? WHERE athlete_id = ?')
        .bind(now, athleteId)
        .run();

      synced++;
    } catch (err) {
      skipped++;
      const reason =
        err instanceof TokenRefreshError || err instanceof ActivityFetchError
          ? err.message
          : String(err);
      console.warn(`[sync] failed for athlete ${athleteId}: ${reason}`);
    }
  }

  const duration = Date.now() - start;
  console.info(
    `[sync] completed: ${synced} synced, ${skipped} skipped in ${duration}ms`,
  );

  return { synced };
}
