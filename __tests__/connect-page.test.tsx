/**
 * FE TDD Tests — SP1-T002
 * Tests: FE-T001 through FE-T008
 * AC-1: /connect page renders with "Connect with Strava" button
 * AC-8: Error messages shown when ?error= param present
 *
 * ReadonlyURLSearchParams approach:
 *   Next.js types ReadonlyURLSearchParams as a subclass of URLSearchParams that
 *   marks mutating methods deprecated. At runtime it IS a URLSearchParams, so
 *   we cast with "as unknown as ReadonlyURLSearchParams". The jest.mock factory
 *   cannot reference outer-scope variables (hoisting) so the mock returns a plain
 *   URLSearchParams cast inline; per-test overrides use mockReturnValue.
 *
 *   We do NOT call jest.resetModules() here — the mocked useSearchParams is
 *   controlled entirely via mockReturnValue on the globally-registered mock.
 *   Resetting the module registry would break the mock reference.
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';

// jest.mock is hoisted above all imports by Babel/ts-jest.
// Factory must be self-contained — no outer-scope references.
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(
    () => new URLSearchParams() as unknown as ReadonlyURLSearchParams,
  ),
}));

import { useSearchParams } from 'next/navigation';
import ConnectButton from '@/app/connect/ConnectButton';
import ConnectPage from '@/app/connect/page';

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

/** Cast URLSearchParams → ReadonlyURLSearchParams for mockReturnValue */
function ro(init?: string): ReadonlyURLSearchParams {
  return new URLSearchParams(init) as unknown as ReadonlyURLSearchParams;
}

// ---------------------------------------------------------------------------
// ConnectButton
// ---------------------------------------------------------------------------
describe('ConnectButton (app/connect/ConnectButton.tsx)', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(ro());
  });

  it('FE-T001: renders "Connect with Strava" anchor element', () => {
    render(<ConnectButton />);
    expect(screen.getByRole('link', { name: /connect with strava/i })).toBeInTheDocument();
  });

  it('FE-T002: anchor href is /api/auth/connect', () => {
    render(<ConnectButton />);
    const link = screen.getByRole('link', {
      name: /connect with strava/i,
    }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/api/auth/connect');
  });

  it('FE-T003: no error banner when no ?error param', () => {
    render(<ConnectButton />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
  });

  it('FE-T004: ?error=access_denied renders correct message', () => {
    mockUseSearchParams.mockReturnValue(ro('error=access_denied'));
    render(<ConnectButton />);
    expect(screen.getByText(/you declined access/i)).toBeInTheDocument();
  });

  it('FE-T005: ?error=token_exchange_failed renders correct message', () => {
    mockUseSearchParams.mockReturnValue(ro('error=token_exchange_failed'));
    render(<ConnectButton />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('FE-T006: unknown ?error value renders no banner', () => {
    mockUseSearchParams.mockReturnValue(ro('error=some_unknown_value'));
    render(<ConnectButton />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
  });

  it('FE-T031: ?error=configuration_error shows friendly setup message', () => {
    mockUseSearchParams.mockReturnValue(ro('error=configuration_error'));
    render(<ConnectButton />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/app not configured/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ConnectPage
// ---------------------------------------------------------------------------
describe('ConnectPage (app/connect/page.tsx)', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(ro());
  });

  it('FE-T007: renders heading "Connect Your Strava Account"', () => {
    render(<ConnectPage />);
    expect(
      screen.getByRole('heading', { name: /connect your strava account/i }),
    ).toBeInTheDocument();
  });

  it('FE-T008: renders ConnectButton (link to /api/auth/connect present)', () => {
    render(<ConnectPage />);
    expect(screen.getByRole('link', { name: /connect with strava/i })).toBeInTheDocument();
  });
});
