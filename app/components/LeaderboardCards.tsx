'use client';

/**
 * LeaderboardCards — SP1-T004
 *
 * Mobile card list (shown on mobile, hidden on md+).
 * Renders one MemberCard per member with rank.
 */
import React from 'react';
import { LeaderboardMember } from '@/src/lib/types';
import { MemberCard } from './MemberCard';
import { SkeletonCard } from './SkeletonCard';

interface LeaderboardCardsProps {
  members: LeaderboardMember[];
  loading?: boolean;
}

const SKELETON_COUNT = 5;

export function LeaderboardCards({ members, loading = false }: LeaderboardCardsProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)
        : members.map((member, i) => (
            <MemberCard key={member.athlete_id} member={member} rank={i + 1} />
          ))}
    </div>
  );
}
