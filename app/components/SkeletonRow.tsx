'use client';

/**
 * SkeletonRow — SP1-T004
 */
import React from 'react';

export function SkeletonRow() {
  return (
    <tr aria-hidden="true" className="border-b border-zinc-100 bg-white">
      <td className="py-3.5 pl-4 pr-2 w-12">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200" />
        </div>
      </td>
      <td className="px-3 py-3.5"><div className="h-4 w-16 animate-pulse rounded-full bg-zinc-200" /></td>
      <td className="px-3 py-3.5"><div className="h-4 w-12 animate-pulse rounded-full bg-zinc-200" /></td>
      <td className="px-3 py-3.5"><div className="h-4 w-16 animate-pulse rounded-full bg-zinc-200" /></td>
      <td className="px-3 py-3.5 pr-4"><div className="h-4 w-6 animate-pulse rounded-full bg-zinc-200" /></td>
    </tr>
  );
}
