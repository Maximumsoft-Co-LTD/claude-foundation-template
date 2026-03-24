'use client';

/**
 * EmptyState — SP1-T004
 *
 * Shown when there are no activities this week.
 */
import React from 'react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center shadow-sm">
      <span className="text-6xl" aria-hidden="true">🏁</span>
      <h2 className="mt-4 text-lg font-bold text-zinc-700">No activities this week</h2>
      <p className="mt-1 max-w-xs text-sm text-zinc-400">
        Get moving! Activities will appear here once someone records a workout.
      </p>
    </div>
  );
}
