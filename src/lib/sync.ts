/**
 * Public entry point for sync logic — re-exports runSync so that
 * functions/scheduled.ts and app/api/sync/route.ts both import from one place.
 * SP1-T003
 */
export { runSync } from './sync/sync-service';
export type { SyncResult } from './sync/sync-service';
