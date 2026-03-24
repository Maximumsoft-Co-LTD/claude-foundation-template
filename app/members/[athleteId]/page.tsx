'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MemberDashboard from './MemberDashboard';

export default function MemberPage() {
  const params = useParams();
  const athleteId = params.athleteId as string;

  const [data, setData] = useState<null | { error?: string;[key: string]: unknown }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/members/${athleteId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData({ error: 'Failed to load' }); setLoading(false); });
  }, [athleteId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-orange-500" />
      </main>
    );
  }

  if (!data || data.error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-100">
        <p className="text-4xl">😕</p>
        <p className="font-semibold text-zinc-500">Member not found</p>
        <Link href="/" className="text-sm font-bold text-orange-500 hover:underline">← Back to Leaderboard</Link>
      </main>
    );
  }

  return <MemberDashboard data={data as unknown as Parameters<typeof MemberDashboard>[0]['data']} />;
}
