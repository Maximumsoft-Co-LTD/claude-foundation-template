'use client';

/**
 * SkeletonCard — SP1-T004
 */
import React from 'react';

export function SkeletonCard() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-4 w-36 animate-pulse rounded-full bg-zinc-200" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-zinc-50 px-3 py-2">
            <div className="h-3 w-14 animate-pulse rounded-full bg-zinc-200" />
            <div className="mt-1.5 h-4 w-16 animate-pulse rounded-full bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
