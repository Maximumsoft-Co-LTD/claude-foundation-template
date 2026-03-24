/**
 * Shared Strava types — SP1-T002
 * Used by both lib/strava.ts (BE) and any FE code that needs these shapes.
 */

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // avatar URL (full size)
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix epoch seconds
  athlete: StravaAthlete;
}

export interface MemberRow {
  athlete_id: number;
  name: string;
  avatar_url: string;
  created_at: number; // Unix epoch seconds — set on INSERT, preserved on UPDATE
}

export interface TokenRow {
  athlete_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix epoch seconds from Strava response
}
