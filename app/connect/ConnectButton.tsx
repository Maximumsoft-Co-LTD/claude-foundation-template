'use client';

/**
 * ConnectButton — SP1-T002
 * Client component: reads ?error= param via useSearchParams and renders
 * the "Connect with Strava" anchor plus an optional error banner.
 */
import { useSearchParams } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'You declined access. Click below to try again.',
  token_exchange_failed: 'Something went wrong. Please try connecting again.',
  configuration_error: 'App not configured — STRAVA_CLIENT_ID is missing. Contact the organizer.',
};

export default function ConnectButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = error ? (ERROR_MESSAGES[error] ?? null) : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {message && (
        <div
          role="alert"
          data-testid="error-banner"
          className="rounded-md bg-amber-100 border border-amber-300 px-4 py-3 text-amber-800 text-sm"
        >
          {message}
        </div>
      )}

      <a
        href="/api/auth/connect"
        className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white w-full"
        style={{ backgroundColor: '#FC4C02' }}
      >
        Connect with Strava
      </a>
    </div>
  );
}
