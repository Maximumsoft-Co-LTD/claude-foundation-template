-- Migration: 0001_init
-- Creates foundational schema for Strava Community Leaderboard

CREATE TABLE IF NOT EXISTS members (
  athlete_id      INTEGER PRIMARY KEY,
  name            TEXT    NOT NULL,
  avatar_url      TEXT,
  created_at      INTEGER NOT NULL,
  last_synced_at  INTEGER             -- NULL until first sync; updated by T003 each hour
);

CREATE TABLE IF NOT EXISTS tokens (
  athlete_id    INTEGER PRIMARY KEY REFERENCES members(athlete_id) ON DELETE CASCADE,
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id            INTEGER PRIMARY KEY,
  athlete_id    INTEGER NOT NULL REFERENCES members(athlete_id) ON DELETE CASCADE,
  type          TEXT    NOT NULL,
  distance_km   REAL    NOT NULL DEFAULT 0,
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  calories      INTEGER NOT NULL DEFAULT 0,
  activity_date INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_athlete_date
  ON activities(athlete_id, activity_date);
