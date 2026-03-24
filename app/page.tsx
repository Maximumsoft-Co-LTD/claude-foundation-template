/**
 * Public leaderboard index route — SP1-T004
 *
 * Server Component shell. Renders the client-side LeaderboardPage which
 * manages the fetch state machine. No auth required — public page.
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import LeaderboardPage from './components/LeaderboardPage';

export const metadata: Metadata = {
  title: 'Weekly Leaderboard — Strava Club',
  description: 'Weekly running and activity rankings for the Strava club.',
};

export default function Page() {
  return (
    <Suspense>
      <LeaderboardPage />
    </Suspense>
  );
}
