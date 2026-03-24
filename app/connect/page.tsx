/**
 * /connect — SP1-T002
 * Public page: lets club members initiate the Strava OAuth flow.
 * Server Component (Next.js default) + Edge Runtime.
 */
export const runtime = 'edge';

import { Suspense } from 'react';
import ConnectButton from './ConnectButton';

export default function ConnectPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-center">
            Connect Your Strava Account
          </h1>
          <p className="text-sm text-zinc-500 text-center">
            Join the leaderboard — authorize read-only access to your Strava activities.
          </p>
        </div>

        <Suspense fallback={null}>
          <ConnectButton />
        </Suspense>
      </div>
    </main>
  );
}
