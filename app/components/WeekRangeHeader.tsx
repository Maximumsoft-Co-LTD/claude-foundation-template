'use client';

/**
 * WeekRangeHeader — SP1-T004
 *
 * Renders inside the dark hero — white text with a subtle sync badge.
 */

interface WeekRangeHeaderProps {
  weekStart: string | null;
  weekEnd: string | null;
  lastSyncedAt: number | null;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(iso: string): string {
  const [, month, day] = iso.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

function formatLastSynced(epochSeconds: number | null): string {
  if (epochSeconds === null) return 'Not yet synced';
  const diffSeconds = Math.floor(Date.now() / 1000) - epochSeconds;
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function WeekRangeHeader({ weekStart, weekEnd, lastSyncedAt }: WeekRangeHeaderProps) {
  if (!weekStart || !weekEnd) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-4 w-52 animate-pulse rounded-full bg-zinc-700" />
        <div className="h-5 w-28 animate-pulse rounded-full bg-zinc-700" />
      </div>
    );
  }

  const [startYear] = weekStart.split('-').map(Number);
  const weekLabel = `${formatDate(weekStart)} – ${formatDate(weekEnd)}, ${startYear}`;
  const syncText = formatLastSynced(lastSyncedAt);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <p className="text-sm text-zinc-400">{weekLabel}</p>
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
        <span className={lastSyncedAt !== null ? 'text-green-400' : 'text-zinc-500'}>●</span>
        {syncText}
      </span>
    </div>
  );
}
