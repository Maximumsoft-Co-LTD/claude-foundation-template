/**
 * FE TDD Tests — SP1-T005 (Activity Type Filter)
 * Tests: FE-T016 through FE-T027
 *
 * Uses jest-environment-jsdom (default from jest.config.ts).
 *
 * IMPORTANT: All component tests use static imports (one React instance).
 * next/navigation is mocked at the module level so useSearchParams and
 * useRouter work in the jsdom environment.
 *
 * ReadonlyURLSearchParams mock: new URLSearchParams(...) as unknown as ReadonlyURLSearchParams
 * (same pattern as T004 leaderboard-fe.test.tsx for hook mocking)
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { ReadonlyURLSearchParams } from 'next/navigation';

// Static imports — one React instance for all component tests
import FilterTabs from '@/app/components/FilterTabs';
import LeaderboardPage from '@/app/components/LeaderboardPage';

// ---------------------------------------------------------------------------
// Mock next/navigation (useSearchParams + useRouter)
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn().mockReturnValue(null),
} as unknown as ReadonlyURLSearchParams;

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Shared mock leaderboard response
// ---------------------------------------------------------------------------
const mockResponse = {
  week_start: '2026-03-23',
  week_end: '2026-03-29',
  type_filter: 'all',
  last_synced_at: null,
  members: [
    {
      athlete_id: 1001,
      name: 'Alice',
      avatar_url: 'https://example.com/alice.jpg',
      total_distance_km: 10.0,
      total_duration_sec: 3600,
      total_calories: 500,
      activity_count: 1,
    },
  ],
};

// ===========================================================================
// UNIT TESTS — FilterTabs component
// ===========================================================================
describe('FilterTabs component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FE-T016: renders all 6 tabs — All, Run, Ride, Walk, Weight, Other', () => {
    render(<FilterTabs activeType={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Run$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Ride$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Walk$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Weight$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Other$/i })).toBeInTheDocument();
  });

  it('FE-T017: active tab has active class — Run tab active when activeType="Run"', () => {
    render(<FilterTabs activeType="Run" onSelect={jest.fn()} />);

    const runBtn = screen.getByRole('button', { name: /^Run$/i });
    const allBtn = screen.getByRole('button', { name: /^All$/i });

    expect(runBtn.className).toMatch(/bg-orange-500|active|selected/);
    expect(allBtn.className).not.toMatch(/bg-orange-500/);
  });

  it('FE-T018: All tab is active when activeType is null', () => {
    render(<FilterTabs activeType={null} onSelect={jest.fn()} />);

    const allBtn = screen.getByRole('button', { name: /^All$/i });
    expect(allBtn.className).toMatch(/bg-orange-500|active|selected/);
  });

  it('FE-T019: clicking Run tab calls onSelect with "Run"', () => {
    const onSelect = jest.fn();
    render(<FilterTabs activeType={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /^Run$/i }));

    expect(onSelect).toHaveBeenCalledWith('Run');
  });

  it('FE-T020: clicking All tab calls onSelect with null', () => {
    const onSelect = jest.fn();
    render(<FilterTabs activeType="Run" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /^All$/i }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('FE-T021: clicking Weight tab calls onSelect with "WeightTraining" (not "Weight")', () => {
    const onSelect = jest.fn();
    render(<FilterTabs activeType={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /^Weight$/i }));

    expect(onSelect).toHaveBeenCalledWith('WeightTraining');
  });

  it('FE-T022: clicking Ride tab calls onSelect with "Ride"', () => {
    const onSelect = jest.fn();
    render(<FilterTabs activeType={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /^Ride$/i }));

    expect(onSelect).toHaveBeenCalledWith('Ride');
  });
});

// ===========================================================================
// UNIT TESTS — LeaderboardPage with filter integration
// ===========================================================================
describe('LeaderboardPage with type filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('FE-T023: LeaderboardPage fetches with ?type=Run when URL has ?type=Run', async () => {
    (mockSearchParams.get as jest.Mock).mockImplementation((key: string) =>
      key === 'type' ? 'Run' : null,
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockResponse, type_filter: 'Run' }),
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=Run'),
      );
    });
  });

  it('FE-T024: LeaderboardPage fetches without ?type when URL has no type param', async () => {
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const url = calls[0][0] as string;
      expect(url).not.toContain('type=');
    });
  });

  it('FE-T025: FilterTabs renders inside LeaderboardPage', async () => {
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    // FilterTabs renders immediately (no need to wait for fetch)
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Run$/i })).toBeInTheDocument();
  });

  it('FE-T026: clicking Run tab pushes ?type=Run to URL', async () => {
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Run$/i }));
    });

    expect(mockPush).toHaveBeenCalledWith('/?type=Run');
  });

  it('FE-T027: clicking All tab pushes bare "/" to URL (removes type param)', async () => {
    (mockSearchParams.get as jest.Mock).mockImplementation((key: string) =>
      key === 'type' ? 'Run' : null,
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^All$/i }));
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('FE-T028: shows inline error banner when API returns 400 INVALID_TYPE', async () => {
    (mockSearchParams.get as jest.Mock).mockImplementation((key: string) =>
      key === 'type' ? 'Cycling' : null,
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid activity type',
        code: 'INVALID_TYPE',
        valid_types: ['Run', 'Ride', 'Walk', 'WeightTraining', 'Other'],
      }),
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Unknown filter/i)).toBeInTheDocument();
    });
  });

  it('FE-T029: shows generic error state when API returns 500', async () => {
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
    } as unknown as Response);

    await act(async () => {
      render(<LeaderboardPage />);
    });

    // ErrorState renders on non-400 errors; it is provided by T004's ErrorState component
    await waitFor(() => {
      // ErrorState component renders a retry/error message
      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });
  });

  it('FE-T030: FilterTabs renders immediately during loading state (skeleton visible)', async () => {
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);

    // fetch never resolves during this test — component stays in loading state
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    act(() => {
      render(<LeaderboardPage />);
    });

    // FilterTabs should be present immediately, before fetch resolves
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Run$/i })).toBeInTheDocument();
  });
});
