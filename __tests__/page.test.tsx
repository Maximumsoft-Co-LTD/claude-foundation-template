/**
 * FE TDD Tests — SP1-T001
 * AC-1: Local dev server / app renders without errors
 * AC-3: Cloudflare Pages deploy (index page serves content)
 *
 * These tests are written BEFORE implementation.
 * They will be RED until app/page.tsx is updated to render the expected content.
 */
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// LeaderboardPage (rendered by HomePage) uses useSearchParams + useRouter (added in T005)
jest.mock('next/navigation', () => ({
  useSearchParams: () =>
    ({ get: () => null } as unknown as ReadonlyURLSearchParams),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('HomePage (app/page.tsx)', () => {
  it('AC-1: renders main content container without errors', () => {
    render(<HomePage />);
    // LeaderboardPage renders a <main> element (loading skeleton initially)
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('AC-1: renders without throwing', () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });
});
