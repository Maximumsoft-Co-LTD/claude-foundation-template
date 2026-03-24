/**
 * GET /api/members/[athleteId] — personal weekly dashboard data
 */
export const runtime = 'edge';

import { getMemberDetail } from '@/src/lib/member-detail-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ athleteId: string }> },
): Promise<Response> {
  const env = (
    (request as unknown as { env?: Record<string, unknown> }).env ??
    (process as unknown as { env: Record<string, unknown> }).env
  ) as { DB: D1Database };

  const { athleteId: athleteIdStr } = await params;
  const athleteId = parseInt(athleteIdStr, 10);
  if (isNaN(athleteId)) {
    return new Response(JSON.stringify({ error: 'Invalid athlete ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await getMemberDetail(env.DB, athleteId);

    if (!data.member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[member-detail] error', { message: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
