'use client';

/**
 * MemberCard — SP1-T004
 *
 * Mobile card with medal rank badge + 4-stat grid.
 */
import React from 'react';
import Link from 'next/link';
import { LeaderboardMember } from '@/src/lib/types';
import { formatDuration } from '@/src/lib/formatDuration';
import { formatDistance } from '@/src/lib/formatDistance';
import { formatCalories } from '@/src/lib/formatCalories';

interface MemberCardProps {
  member: LeaderboardMember;
  rank: number;
}

function medalEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

function cardBorder(rank: number) {
  if (rank === 1) return 'border-yellow-300 bg-yellow-50';
  if (rank === 2) return 'border-zinc-300 bg-zinc-50';
  if (rank === 3) return 'border-orange-300 bg-orange-50';
  return 'border-zinc-200 bg-white';
}

export function MemberCard({ member, rank }: MemberCardProps) {
  const medal = medalEmoji(rank);

  return (
    <Link href={`/members/${member.athlete_id}`} className={`block rounded-2xl border p-4 shadow-sm ${cardBorder(rank)} hover:shadow-md transition-shadow`}>
      {/* Header: rank + avatar + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-lg">
          {medal ?? (
            <span
              aria-label={`Rank ${rank}`}
              className="text-sm font-bold text-zinc-400"
            >
              {rank}
            </span>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.avatar_url}
          alt={`${member.name}'s avatar`}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d4d4d8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M20 21a8 8 0 1 0-16 0'/%3E%3C/svg%3E";
          }}
        />
        <span className="truncate text-base font-bold text-zinc-900">{member.name}</span>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Distance</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-800 tabular-nums">
            {formatDistance(member.total_distance_km)}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Time</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-800 tabular-nums">
            {formatDuration(member.total_duration_sec)}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Calories</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-800 tabular-nums">
            {formatCalories(member.total_calories)}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Activities</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-800 tabular-nums">
            {member.activity_count}×
          </p>
        </div>
      </div>
    </Link>
  );
}
