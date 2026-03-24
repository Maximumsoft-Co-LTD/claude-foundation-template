'use client';

/**
 * LeaderboardPage — SP1-T004 / SP1-T005
 *
 * Top-level client component. Manages fetch state machine:
 *   loading → loaded | empty | error | invalid_type
 */
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LeaderboardResponse } from '@/src/lib/types';
import { WeekRangeHeader } from './WeekRangeHeader';
import { LeaderboardTable } from './LeaderboardTable';
import { LeaderboardCards } from './LeaderboardCards';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import FilterTabs from './FilterTabs';
import { trackEvent } from '@/src/lib/analytics';

type Status = 'loading' | 'loaded' | 'empty' | 'error' | 'invalid_type';
type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface State {
  status: Status;
  data: LeaderboardResponse | null;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeType = searchParams.get('type');
  const connectedName = searchParams.get('connected');

  // Clear ?connected= from the URL after first render without triggering a reload
  useEffect(() => {
    if (connectedName) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('connected');
      const newUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', newUrl);
    }
  }, [connectedName, searchParams]);

  const [state, setState] = useState<State>({ status: 'loading', data: null });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        setSyncStatus('done');
        fetchLeaderboard(activeType);
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const fetchLeaderboard = useCallback(async (type: string | null) => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const url = type ? `/api/leaderboard?type=${encodeURIComponent(type)}` : '/api/leaderboard';
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 400 && (body as { code?: string }).code === 'INVALID_TYPE') {
          trackEvent('leaderboard_error', { error_type: 'invalid_type' });
          setState({ status: 'invalid_type', data: null });
          return;
        }
        trackEvent('leaderboard_error', { error_type: 'server' });
        setState({ status: 'error', data: null });
        return;
      }

      const data: LeaderboardResponse = await res.json();
      if (data.members.length === 0) {
        setState({ status: 'empty', data });
      } else {
        setState({ status: 'loaded', data });
        trackEvent('leaderboard_viewed', {
          week_start: data.week_start,
          member_count: data.members.length,
          type_filter: data.type_filter,
        });
      }
    } catch {
      trackEvent('leaderboard_error', { error_type: 'network' });
      setState({ status: 'error', data: null });
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeType);
  }, [activeType, fetchLeaderboard]);

  const handleTabSelect = (type: string | null) => {
    if (type === null) {
      router.push('/');
    } else {
      router.push(`/?type=${encodeURIComponent(type)}`);
    }
  };

  const { status, data } = state;
  const isLoading = status === 'loading';

  return (
    <main className="min-h-screen bg-zinc-100">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="mx-auto max-w-4xl px-4 pb-6 pt-8">
          {/* Brand label */}
          <span className="mb-2 inline-block text-xs font-black uppercase tracking-[0.2em] text-orange-500">
            Strava Club
          </span>

          {/* Title + buttons */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Weekly Leaderboard
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                  syncStatus === 'done'
                    ? 'bg-green-500 text-white'
                    : syncStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50'
                }`}
              >
                {syncStatus === 'syncing' ? '⏳ Syncing…' : syncStatus === 'done' ? '✓ Synced' : syncStatus === 'error' ? '✗ Failed' : '↻ Sync'}
              </button>
              <Link
                href="/connect"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
              >
                Connect Strava
              </Link>
            </div>
          </div>

          {/* Week + sync info */}
          <WeekRangeHeader
            weekStart={data?.week_start ?? null}
            weekEnd={data?.week_end ?? null}
            lastSyncedAt={data?.last_synced_at ?? null}
          />
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Connected success banner */}
        {connectedName && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <span className="text-base">✓</span>
            <span>
              <strong>{connectedName}</strong> connected with Strava successfully!
            </span>
          </div>
        )}

        {/* Filter tabs */}
        <FilterTabs activeType={activeType} onSelect={handleTabSelect} />

        {/* Invalid type banner */}
        {status === 'invalid_type' && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
          >
            <span className="text-base">⚠️</span>
            Unknown filter — showing all activities instead.
          </div>
        )}

        {status === 'error' && <ErrorState onRetry={() => fetchLeaderboard(activeType)} />}
        {status === 'empty' && <EmptyState />}
        {(isLoading || status === 'loaded') && (
          <>
            <LeaderboardTable members={data?.members ?? []} loading={isLoading} />
            <LeaderboardCards members={data?.members ?? []} loading={isLoading} />
          </>
        )}
      </div>
    </main>
  );
}
