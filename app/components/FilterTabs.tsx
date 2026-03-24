'use client';

/**
 * FilterTabs — SP1-T005
 *
 * Pill tabs for activity-type filtering.
 * "Weight" is the display label for WeightTraining.
 */
import React from 'react';

interface Tab {
  label: string;
  icon: string;
  value: string | null;
}

const TABS: Tab[] = [
  { label: 'All',    icon: '⚡', value: null },
  { label: 'Run',    icon: '🏃', value: 'Run' },
  { label: 'Ride',   icon: '🚴', value: 'Ride' },
  { label: 'Walk',   icon: '🚶', value: 'Walk' },
  { label: 'Weight', icon: '🏋️', value: 'WeightTraining' },
  { label: 'Other',  icon: '🏅', value: 'Other' },
];

interface FilterTabsProps {
  activeType: string | null;
  onSelect: (type: string | null) => void;
}

export default function FilterTabs({ activeType, onSelect }: FilterTabsProps) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const isActive = tab.value === activeType;
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onSelect(tab.value)}
            className={
              isActive
                ? 'flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-sm whitespace-nowrap bg-orange-500 text-white'
                : 'flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap bg-white border border-zinc-200 text-zinc-600 hover:border-orange-400 hover:text-orange-500 transition-colors'
            }
          >
            <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
