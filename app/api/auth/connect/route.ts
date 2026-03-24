/**
 * GET /api/auth/connect
 * Builds the Strava OAuth authorization URL and returns a 302 redirect.
 * SP1-T002
 */
export const runtime = 'edge';

import { buildAuthUrl } from '@/src/lib/strava';

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

export function GET(): Response {
  const url = buildAuthUrl();

  if (!url) {
    return redirect('/connect?error=configuration_error');
  }

  return redirect(url);
}
