/**
 * Validate the Authorization: Bearer {CRON_SECRET} header on the sync route.
 * Uses a byte-by-byte comparison to avoid timing attacks.
 * Returns a 401 Response if validation fails, or null if the request passes.
 * SP1-T003
 */

interface SyncEnv {
  CRON_SECRET: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  // Compare using Buffer.from to get byte arrays; fall back to a manual loop
  // when Buffer is not available (Edge Runtime).
  if (typeof Buffer !== 'undefined') {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length) {
      // Still iterate over the shorter length to avoid early-exit timing leak
      let diff = 0;
      for (let i = 0; i < aBuf.length; i++) {
        diff |= aBuf[i] ^ (bBuf[i % bBuf.length] ?? 0);
      }
      return false; // length mismatch is always a failure
    }
    let diff = 0;
    for (let i = 0; i < aBuf.length; i++) {
      diff |= aBuf[i] ^ bBuf[i];
    }
    return diff === 0;
  }

  // Fallback for Edge Runtime without Buffer.
  // Always iterate over the longer string to avoid leaking secret length via timing.
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1; // length mismatch sets diff immediately
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length));
  }
  return diff === 0;
}

export async function validateCronSecret(
  request: Request,
  env: SyncEnv,
): Promise<Response | null> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const prefix = 'Bearer ';

  if (!authHeader.startsWith(prefix)) {
    return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const providedSecret = authHeader.slice(prefix.length);
  if (!timingSafeEqual(providedSecret, env.CRON_SECRET)) {
    return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null; // pass
}
