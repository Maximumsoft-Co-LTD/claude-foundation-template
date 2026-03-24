'use client';

/**
 * LeaderboardTable — SP1-T004
 *
 * Desktop table (hidden on mobile).
 */
import React from 'react';
import { LeaderboardMember } from '@/src/lib/types';
import { MemberRow } from './MemberRow';
import { SkeletonRow } from './SkeletonRow';

interface LeaderboardTableProps {
  members: LeaderboardMember[];
  loading?: boolean;
}

const SKELETON_COUNT = 5;

export function LeaderboardTable({ members, loading = false }: LeaderboardTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
      <table className="w-full text-left">
        <caption className="sr-only">Weekly leaderboard ranked by distance</caption>
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th scope="col" className="w-12 py-3 pl-4 pr-2 text-xs font-bold uppercase tracking-widest text-zinc-400">#</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Member</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Distance</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Time</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Calories</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Elev</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Avg HR</th>
            <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Avg Pace</th>
            <th scope="col" className="px-3 py-3 pr-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Acts</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonRow key={i} />)
            : members.map((member, i) => (
                <MemberRow key={member.athlete_id} member={member} rank={i + 1} />
              ))}
        </tbody>
      </table>
    </div>
  );
}
