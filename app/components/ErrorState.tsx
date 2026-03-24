'use client';

/**
 * ErrorState — SP1-T004
 */
import React from 'react';

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-20 text-center shadow-sm">
      <span className="text-5xl" aria-hidden="true">😵</span>
      <h2 className="mt-4 text-lg font-bold text-red-700">Could not load leaderboard</h2>
      <p className="mt-1 text-sm text-red-500">Something went wrong. Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
