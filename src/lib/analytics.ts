/**
 * analytics — SP1-T004
 *
 * Lightweight event tracking stub.
 * Fires console.log in development; production destination TBD.
 */
export function trackEvent(name: string, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[analytics]', name, payload);
    return;
  }
  // TODO: wire to production analytics endpoint in future sprint
}
