-- Migration: 0002_expand_activities
-- Expands activities table to store all fields returned by Strava /athlete/activities

ALTER TABLE activities ADD COLUMN name TEXT;
ALTER TABLE activities ADD COLUMN sport_type TEXT;
ALTER TABLE activities ADD COLUMN elapsed_time_sec INTEGER;
ALTER TABLE activities ADD COLUMN total_elevation_gain REAL;
ALTER TABLE activities ADD COLUMN elev_high REAL;
ALTER TABLE activities ADD COLUMN elev_low REAL;
ALTER TABLE activities ADD COLUMN average_speed REAL;
ALTER TABLE activities ADD COLUMN max_speed REAL;
ALTER TABLE activities ADD COLUMN average_heartrate REAL;
ALTER TABLE activities ADD COLUMN max_heartrate REAL;
ALTER TABLE activities ADD COLUMN average_cadence REAL;
ALTER TABLE activities ADD COLUMN average_watts REAL;
ALTER TABLE activities ADD COLUMN max_watts REAL;
ALTER TABLE activities ADD COLUMN weighted_average_watts REAL;
ALTER TABLE activities ADD COLUMN kilojoules REAL;
ALTER TABLE activities ADD COLUMN achievement_count INTEGER;
ALTER TABLE activities ADD COLUMN kudos_count INTEGER;
ALTER TABLE activities ADD COLUMN comment_count INTEGER;
ALTER TABLE activities ADD COLUMN workout_type INTEGER;
ALTER TABLE activities ADD COLUMN commute INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN trainer INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN manual INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN visibility TEXT;
ALTER TABLE activities ADD COLUMN gear_id TEXT;
ALTER TABLE activities ADD COLUMN timezone TEXT;
ALTER TABLE activities ADD COLUMN utc_offset INTEGER;
ALTER TABLE activities ADD COLUMN polyline TEXT;
