/**
 * FE TDD Tests — SP1-T004
 * Tests: FE-T001 through FE-T015
 *
 * Uses jest-environment-jsdom (default from jest.config.ts).
 *
 * IMPORTANT: Component tests (FE-T009 through FE-T015) use static imports at
 * the top of the file so there is exactly ONE copy of React in the test
 * environment. Calling jest.resetModules() before dynamically require()-ing a
 * component that uses React hooks causes "Invalid hook call" because
 * @testing-library/react's render() holds a reference to the original React
 * instance while the component gets a fresh one — two copies of React.
 *
 * Utility unit tests (FE-T001–FE-T008) use dynamic require() after
 * jest.resetModules() because they are pure functions with no React deps.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import type { ReadonlyURLSearchParams } from 'next/navigation';

// Mock next/navigation — LeaderboardPage (T005) now uses useSearchParams + useRouter.
// These hooks are unavailable in the jsdom environment without a mock.
jest.mock('next/navigation', () => ({
  useSearchParams: () =>
    ({ get: () => null } as unknown as ReadonlyURLSearchParams),
  useRouter: () => ({ push: jest.fn() }),
}));

// Static imports — one React instance shared across all component tests
import { MemberRow } from '@/app/components/MemberRow';
import { WeekRangeHeader } from '@/app/components/WeekRangeHeader';
import LeaderboardPage from '@/app/components/LeaderboardPage';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const mockMember = {
  athlete_id: 1001,
  name: 'Alice',
  avatar_url: 'https://example.com/alice.jpg',
  total_distance_km: 42.5,
  total_duration_sec: 18000,
  total_calories: 1500,
  activity_count: 7,
  total_elevation_gain: 320,
  avg_heartrate: 145.2,
  avg_speed: 3.5,
};

const mockResponse = {
  week_start: '2026-03-23',
  week_end: '2026-03-29',
  type_filter: 'all',
  last_synced_at: 1742860800,
  members: [mockMember],
};

// ===========================================================================
// UNIT TESTS — formatDuration (pure function, safe to use resetModules)
// ===========================================================================
describe('src/lib/formatDuration.ts — formatDuration()', () => {
  beforeEach(() => jest.resetModules());

  it('FE-T001: formatDuration(0) returns "0:00"', () => {
    const { formatDuration } = require('@/src/lib/formatDuration');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('FE-T002: formatDuration(540) returns "0:09" (sub-hour, single digit)', () => {
    const { formatDuration } = require('@/src/lib/formatDuration');
    expect(formatDuration(540)).toBe('0:09');
  });

  it('FE-T003: formatDuration(3720) returns "1:02" (over 1 hour, leading zero on minutes)', () => {
    const { formatDuration } = require('@/src/lib/formatDuration');
    expect(formatDuration(3720)).toBe('1:02');
  });

  it('FE-T004: formatDuration(18000) returns "5:00" (round hour)', () => {
    const { formatDuration } = require('@/src/lib/formatDuration');
    expect(formatDuration(18000)).toBe('5:00');
  });
});

// ===========================================================================
// UNIT TESTS — formatDistance (pure function, safe to use resetModules)
// ===========================================================================
describe('src/lib/formatDistance.ts — formatDistance()', () => {
  beforeEach(() => jest.resetModules());

  it('FE-T005: formatDistance(42.5) returns "42.5 km"', () => {
    const { formatDistance } = require('@/src/lib/formatDistance');
    expect(formatDistance(42.5)).toBe('42.5 km');
  });

  it('FE-T006: formatDistance(0) returns "0.0 km"', () => {
    const { formatDistance } = require('@/src/lib/formatDistance');
    expect(formatDistance(0)).toBe('0.0 km');
  });
});

// ===========================================================================
// UNIT TESTS — formatCalories (pure function, safe to use resetModules)
// ===========================================================================
describe('src/lib/formatCalories.ts — formatCalories()', () => {
  beforeEach(() => jest.resetModules());

  it('FE-T007: formatCalories(1500) returns "1,500 kcal"', () => {
    const { formatCalories } = require('@/src/lib/formatCalories');
    expect(formatCalories(1500)).toBe('1,500 kcal');
  });

  it('FE-T008: formatCalories(800) returns "800 kcal" (no comma)', () => {
    const { formatCalories } = require('@/src/lib/formatCalories');
    expect(formatCalories(800)).toBe('800 kcal');
  });
});

// ===========================================================================
// UNIT TESTS — MemberRow component
// Uses static import — no resetModules, one React instance.
// ===========================================================================
describe('MemberRow component', () => {
  it('FE-T009: renders rank indicator (medal for top-3, number for others)', () => {
    render(<MemberRow member={mockMember} rank={1} />);
    // Rank 1 shows medal emoji with aria-label
    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
  });

  it('FE-T010: renders avatar img with correct src and alt', () => {
    render(<MemberRow member={mockMember} rank={2} />);
    const img = screen.getByAltText("Alice's avatar");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('FE-T011: renders duration formatted as h:mm (18000s → "5:00")', () => {
    render(<MemberRow member={mockMember} rank={1} />);
    expect(screen.getByText('5:00')).toBeInTheDocument();
  });
});

// ===========================================================================
// UNIT TESTS — WeekRangeHeader component
// Uses static import — no resetModules, one React instance.
// ===========================================================================
describe('WeekRangeHeader component', () => {
  it('FE-T012: shows week start and end dates', () => {
    render(
      <WeekRangeHeader
        weekStart="2026-03-23"
        weekEnd="2026-03-29"
        lastSyncedAt={1742860800}
      />
    );
    expect(screen.getByText(/Mar 23/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 29/)).toBeInTheDocument();
  });

  it('FE-T013: shows "Not yet synced" when last_synced_at is null', () => {
    render(
      <WeekRangeHeader
        weekStart="2026-03-23"
        weekEnd="2026-03-29"
        lastSyncedAt={null}
      />
    );
    expect(screen.getByText(/Not yet synced/i)).toBeInTheDocument();
  });
});

// ===========================================================================
// UNIT TESTS — LeaderboardPage component
// Uses static import — no resetModules, hooks work correctly.
// global.fetch is mocked per-test and restored in afterEach.
// ===========================================================================
describe('LeaderboardPage component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('FE-T014: renders EmptyState when members array is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockResponse, members: [] }),
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/No activities this week/i)).toBeInTheDocument();
    });
  });

  it('FE-T015: renders table with member rows when data is present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await waitFor(() => {
      // Name appears in both desktop table and mobile cards — use getAllByText
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    });
  });
});
