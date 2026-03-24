/**
 * Shared types — SP1-T004
 */

export interface LeaderboardMember {
  athlete_id: number;
  name: string;
  avatar_url: string;
  total_distance_km: number;
  total_duration_sec: number;
  total_calories: number;
  activity_count: number;
  total_elevation_gain: number | null;
  avg_heartrate: number | null;
  avg_speed: number | null; // m/s
}

export interface LeaderboardResponse {
  week_start: string;       // "YYYY-MM-DD"
  week_end: string;         // "YYYY-MM-DD"
  type_filter: string;      // "all" (T005 adds other values)
  last_synced_at: number | null; // Unix epoch seconds; null if never synced
  members: LeaderboardMember[];
}
