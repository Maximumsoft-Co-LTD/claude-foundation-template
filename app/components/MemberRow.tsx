'use client';

/**
 * MemberRow — SP1-T004
 *
 * Desktop table row with medal ranks for top 3.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardMember } from '@/src/lib/types';
import { formatDuration } from '@/src/lib/formatDuration';
import { formatDistance } from '@/src/lib/formatDistance';
import { formatCalories } from '@/src/lib/formatCalories';
import { formatPace } from '@/src/lib/formatPace';

interface MemberRowProps {
  member: LeaderboardMember;
  rank: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span aria-label="Rank 1" className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-base font-black text-yellow-900 shadow-sm">
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span aria-label="Rank 2" className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300 text-base font-black text-zinc-700 shadow-sm">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span aria-label="Rank 3" className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-300 text-base font-black text-orange-900 shadow-sm">
        🥉
      </span>
    );
  }
  return (
    <span aria-label={`Rank ${rank}`} className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-zinc-400">
      {rank}
    </span>
  );
}

function rowBg(rank: number) {
  if (rank === 1) return 'bg-yellow-50 hover:bg-yellow-100';
  if (rank === 2) return 'bg-zinc-50 hover:bg-zinc-100';
  if (rank === 3) return 'bg-orange-50 hover:bg-orange-100';
  return 'bg-white hover:bg-zinc-50';
}

export function MemberRow({ member, rank }: MemberRowProps) {
  const router = useRouter();
  return (
    <tr
      className={`border-b border-zinc-100 transition-colors cursor-pointer ${rowBg(rank)}`}
      onClick={() => router.push(`/members/${member.athlete_id}`)}
    >
      <td className="py-3.5 pl-4 pr-2 w-12">
        <RankBadge rank={rank} />
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.avatar_url}
            alt={`${member.name}'s avatar`}
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d4d4d8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M20 21a8 8 0 1 0-16 0'/%3E%3C/svg%3E";
            }}
          />
          <span className="max-w-[200px] truncate text-sm font-semibold text-zinc-900">
            {member.name}
          </span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-sm font-semibold text-zinc-800 tabular-nums">
        {formatDistance(member.total_distance_km)}
      </td>
      <td className="px-3 py-3.5 text-sm text-zinc-600 tabular-nums">
        {formatDuration(member.total_duration_sec)}
      </td>
      <td className="px-3 py-3.5 text-sm text-zinc-600 tabular-nums">
        {formatCalories(member.total_calories)}
      </td>
      <td className="px-3 py-3.5 text-sm text-zinc-600 tabular-nums">
        {member.total_elevation_gain != null ? `${member.total_elevation_gain}m` : '—'}
      </td>
      <td className="px-3 py-3.5 text-sm text-zinc-600 tabular-nums">
        {member.avg_heartrate != null ? `${member.avg_heartrate} bpm` : '—'}
      </td>
      <td className="px-3 py-3.5 text-sm text-zinc-600 tabular-nums">
        {member.avg_speed != null ? formatPace(member.avg_speed) : '—'}
      </td>
      <td className="px-3 py-3.5 pr-4 text-sm text-zinc-500 tabular-nums">
        {member.activity_count}×
      </td>
    </tr>
  );
}
