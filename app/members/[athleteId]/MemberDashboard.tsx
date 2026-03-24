'use client';

import React from 'react';
import Link from 'next/link';
import { formatDuration } from '@/src/lib/formatDuration';
import { formatDistance } from '@/src/lib/formatDistance';
import { formatCalories } from '@/src/lib/formatCalories';
import { formatPace } from '@/src/lib/formatPace';

// ── Types ────────────────────────────────────────────────────────────────────

interface ActivityDetail {
  id: number;
  name: string | null;
  type: string;
  distance_km: number;
  duration_sec: number;
  calories: number;
  total_elevation_gain: number | null;
  average_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  kudos_count: number | null;
  achievement_count: number | null;
  activity_date: number;
}

interface TypeBreakdown {
  type: string;
  count: number;
  distance_km: number;
  duration_sec: number;
  calories: number;
}

interface MemberDetailData {
  member: { athlete_id: number; name: string; avatar_url: string };
  week_start: string;
  week_end: string;
  totals: {
    distance_km: number;
    duration_sec: number;
    calories: number;
    elevation_gain: number;
    activity_count: number;
    avg_heartrate: number | null;
    avg_speed: number | null;
  };
  by_type: TypeBreakdown[];
  activities: ActivityDetail[];
  highlights: {
    longest_activity: ActivityDetail | null;
    highest_elevation: ActivityDetail | null;
    most_calories: ActivityDetail | null;
    most_kudos: ActivityDetail | null;
  };
}

// ── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string; bar: string }> = {
  Run:            { emoji: '🏃', color: 'text-orange-600',  bg: 'bg-orange-50',  bar: 'bg-orange-500' },
  Ride:           { emoji: '🚴', color: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-500' },
  Walk:           { emoji: '🚶', color: 'text-green-600',   bg: 'bg-green-50',   bar: 'bg-green-500' },
  WeightTraining: { emoji: '🏋️', color: 'text-purple-600', bg: 'bg-purple-50',  bar: 'bg-purple-500' },
  Other:          { emoji: '⚡', color: 'text-zinc-600',    bg: 'bg-zinc-100',   bar: 'bg-zinc-400' },
};

function typeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG['Other'];
}

function formatDate(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-zinc-100">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function TypeBar({ breakdown, totalDistance }: { breakdown: TypeBreakdown[]; totalDistance: number }) {
  if (breakdown.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-zinc-100">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-400">Activity Breakdown</h2>
      <div className="space-y-3">
        {breakdown.map((t) => {
          const cfg = typeConfig(t.type);
          const pct = totalDistance > 0 ? Math.round((t.distance_km / totalDistance) * 100) : 0;
          return (
            <div key={t.type}>
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                  <span>{cfg.emoji}</span> {t.type}
                  <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                    {t.count}×
                  </span>
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {formatDistance(t.distance_km)} · {formatDuration(t.duration_sec)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className={`h-2 rounded-full ${cfg.bar} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ActivityDetail }) {
  const cfg = typeConfig(activity.type);
  return (
    <div className={`rounded-2xl border border-zinc-100 p-4 shadow-sm ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.emoji}</span>
          <div>
            <p className="font-bold text-zinc-900 leading-tight">
              {activity.name ?? activity.type}
            </p>
            <p className="text-xs text-zinc-400">{formatDate(activity.activity_date)}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {(activity.kudos_count ?? 0) > 0 && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-zinc-600">
              👍 {activity.kudos_count}
            </span>
          )}
          {(activity.achievement_count ?? 0) > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
              🏅 {activity.achievement_count}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {activity.distance_km > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Dist</p>
            <p className="text-sm font-bold text-zinc-800 tabular-nums">{formatDistance(activity.distance_km)}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Time</p>
          <p className="text-sm font-bold text-zinc-800 tabular-nums">{formatDuration(activity.duration_sec)}</p>
        </div>
        {activity.calories > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Cal</p>
            <p className="text-sm font-bold text-zinc-800 tabular-nums">{formatCalories(activity.calories)}</p>
          </div>
        )}
        {activity.total_elevation_gain != null && activity.total_elevation_gain > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Elev</p>
            <p className="text-sm font-bold text-zinc-800 tabular-nums">{activity.total_elevation_gain}m</p>
          </div>
        )}
        {activity.average_heartrate != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Avg HR</p>
            <p className="text-sm font-bold text-zinc-800 tabular-nums">{activity.average_heartrate} bpm</p>
          </div>
        )}
        {activity.average_speed != null && activity.average_speed > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Pace</p>
            <p className="text-sm font-bold text-zinc-800 tabular-nums">{formatPace(activity.average_speed)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightCard({
  emoji, label, activity, value,
}: {
  emoji: string;
  label: string;
  activity: ActivityDetail;
  value: string;
}) {
  const cfg = typeConfig(activity.type);
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      </div>
      <p className="text-xl font-black text-zinc-900 tabular-nums">{value}</p>
      <p className={`mt-1 text-xs font-semibold ${cfg.color}`}>
        {cfg.emoji} {activity.name ?? activity.type} · {formatDate(activity.activity_date)}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberDashboard({ data, rank }: { data: MemberDetailData; rank?: number }) {
  const { member, totals, by_type, activities, highlights, week_start, week_end } = data;

  const weekLabel = `${new Date(week_start + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(week_end + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

  return (
    <main className="min-h-screen bg-zinc-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Leaderboard
          </Link>

          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.avatar_url}
              alt={`${member.name}'s avatar`}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d4d4d8'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M20 21a8 8 0 1 0-16 0'/%3E%3C/svg%3E";
              }}
            />
            <div>
              <h1 className="text-3xl font-black text-white">{member.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">{weekLabel}</span>
                {rank != null && rank <= 3 && (
                  <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                )}
                {rank != null && rank > 3 && (
                  <span className="rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs font-bold text-zinc-300">
                    #{rank}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {/* Big stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Distance" value={formatDistance(totals.distance_km)} />
          <StatCard label="Time" value={formatDuration(totals.duration_sec)} />
          <StatCard label="Calories" value={formatCalories(totals.calories)} />
          <StatCard label="Elevation" value={`${totals.elevation_gain}m`} />
          {totals.avg_heartrate != null && (
            <StatCard label="Avg HR" value={`${totals.avg_heartrate}`} sub="bpm" />
          )}
          {totals.avg_speed != null && (
            <StatCard label="Avg Pace" value={formatPace(totals.avg_speed)} />
          )}
        </div>

        {/* Type breakdown */}
        <TypeBar breakdown={by_type} totalDistance={totals.distance_km} />

        {/* Highlights */}
        {(highlights.longest_activity || highlights.highest_elevation || highlights.most_calories || highlights.most_kudos) && (
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">This Week&apos;s Bests</h2>
            <div className="grid grid-cols-2 gap-3">
              {highlights.longest_activity && (
                <HighlightCard
                  emoji="📏"
                  label="Longest"
                  activity={highlights.longest_activity}
                  value={formatDistance(highlights.longest_activity.distance_km)}
                />
              )}
              {highlights.highest_elevation && (highlights.highest_elevation.total_elevation_gain ?? 0) > 0 && (
                <HighlightCard
                  emoji="⛰️"
                  label="Most Climbing"
                  activity={highlights.highest_elevation}
                  value={`${highlights.highest_elevation.total_elevation_gain}m`}
                />
              )}
              {highlights.most_calories && highlights.most_calories.calories > 0 && (
                <HighlightCard
                  emoji="🔥"
                  label="Most Calories"
                  activity={highlights.most_calories}
                  value={formatCalories(highlights.most_calories.calories)}
                />
              )}
              {highlights.most_kudos && (highlights.most_kudos.kudos_count ?? 0) > 0 && (
                <HighlightCard
                  emoji="👏"
                  label="Most Kudos"
                  activity={highlights.most_kudos}
                  value={`${highlights.most_kudos.kudos_count} kudos`}
                />
              )}
            </div>
          </div>
        )}

        {/* Activity list */}
        {activities.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              Activities · {totals.activity_count}
            </h2>
            <div className="space-y-3">
              {activities.map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">😴</p>
            <p className="mt-3 font-semibold text-zinc-500">No activities this week yet</p>
          </div>
        )}
      </div>
    </main>
  );
}
