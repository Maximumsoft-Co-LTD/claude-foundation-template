# SP1-T002 — Strava OAuth Member Connect — Issues

## Summary
- **Total:** 1 issue (0 critical / 1 major / 0 minor)

---

## Issue: /connect button silently loops — missing STRAVA_CLIENT_ID + no error message

**Date:** 2026-03-24  |  **Severity:** major

**Steps to reproduce:**
1. Open `/connect` in the browser (without `STRAVA_CLIENT_ID` in `.env.local`)
2. Click "Connect with Strava"
3. Page reloads with `?error=configuration_error` in the URL
4. No error banner appears — looks like nothing happened

**Expected:** A friendly error message explaining why the button didn't work (AC-8), or a redirect to Strava's authorization page (AC-2)

**Actual:** Page silently reloads; user sees only the Connect button again with no feedback

**Root cause:** Two compounding issues:
1. `.env.local` only contains `NEXT_PUBLIC_APP_URL` — `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` are missing. `buildAuthUrl()` returns `null` → `/api/auth/connect` redirects to `/connect?error=configuration_error`.
2. `configuration_error` was not in `ERROR_MESSAGES` in `ConnectButton.tsx` → `message` resolved to `null` → no banner rendered. AC-8 only covered `access_denied` and `token_exchange_failed`.

**Fix:**
- Added `configuration_error` to `ERROR_MESSAGES` in `app/connect/ConnectButton.tsx`:
  ```
  configuration_error: 'App not configured — STRAVA_CLIENT_ID is missing. Contact the organizer.'
  ```
- User action required: add `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` to `.env.local` (register at https://www.strava.com/settings/api)

**Test added:** `__tests__/connect-page.test.tsx` — FE-T031

**Blocks:** none

---
