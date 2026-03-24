/**
 * D1 members table helpers — SP1-T002
 */

import type { MemberRow } from '@/src/types/strava';

export type { MemberRow };

/**
 * Upsert a member row.
 * On conflict (athlete_id): updates name + avatar_url only.
 * created_at is preserved from the original INSERT (Business Rule R-2).
 */
export async function upsertMember(db: D1Database, member: MemberRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO members (athlete_id, name, avatar_url, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (athlete_id) DO UPDATE SET
         name = excluded.name,
         avatar_url = excluded.avatar_url`,
    )
    .bind(member.athlete_id, member.name, member.avatar_url, member.created_at)
    .run();
}
