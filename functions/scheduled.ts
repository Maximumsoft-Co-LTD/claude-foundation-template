/**
 * Cloudflare Pages Scheduled Event Handler — SP1-T003
 *
 * Fired by Cloudflare Cron Trigger (configured in wrangler.toml).
 * Calls runSync(env) directly — no HTTP overhead, no auth check needed
 * (the cron scheduler is internal to Cloudflare infrastructure).
 *
 * wrangler.toml config:
 *   [triggers]
 *   crons = ["0 * * * *"]
 */
import { runSync } from '../src/lib/sync';
import type { SyncResult } from '../src/lib/sync';

type SyncEnv = Parameters<typeof runSync>[0];

export const onScheduled = async (
  _event: unknown,
  env: SyncEnv,
): Promise<SyncResult> => {
  return runSync(env);
};
