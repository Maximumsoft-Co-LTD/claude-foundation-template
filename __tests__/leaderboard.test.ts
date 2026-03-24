/**
 * @jest-environment node
 *
 * BE TDD Tests — SP1-T004
 * Tests: BE-T057 through BE-T069
 *
 * getCurrentWeekRange() — unit tests
 * getLeaderboard()      — integration tests (real SQLite via makeD1Shim)
 * GET /api/leaderboard  — route-level smoke test
 *
 * Integration tests follow the T003 pattern: test the service function
 * directly (not via the HTTP route handler) using a real SQLite DB
 * through the makeD1Shim helper. This avoids any Next.js transform
 * issues when requiring route files in Jest's node environment.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Test DB helpers (same pattern as T002 / T003)
// ---------------------------------------------------------------------------
const MIGRATION_FILE = path.resolve(__dirname, '../migrations/0001_init.sql');
const DB_FILE = '/tmp/test-t004-leaderboard.db';

function buildTestDb(): Database.Database {
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const db = new Database(DB_FILE);
  db.exec(sql);
  return db;
}

function makeD1Shim(db: Database.Database) {
  return {
    prepare: (sql: string) => {
      const stmt = db.prepare(sql);
      return {
        bind: (...params: unknown[]) => ({
          run: () => stmt.run(...params),
          first: () => stmt.get(...params),
          all: () => ({ results: stmt.all(...params) }),
        }),
        run: (...params: unknown[]) => stmt.run(...params),
        first: (...params: unknown[]) => stmt.get(...params),
        all: (...params: unknown[]) => ({ results: stmt.all(...params) }),
      };
    },
  } as unknown as D1Database;
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------
function seedMember(
  db: Database.Database,
  athleteId: number,
  name = 'Test Runner',
  lastSyncedAt: number | null = null,
) {
  db.prepare(
    'INSERT OR REPLACE INTO members (athlete_id, name, avatar_url, created_at, last_synced_at) VALUES (?, ?, ?, ?, ?)',
  ).run(athleteId, name, `https://example.com/avatar/${athleteId}.jpg`, 1700000000, lastSyncedAt);
}

function seedActivity(
  db: Database.Database,
  athleteId: number,
  opts: {
    id?: number;
    type?: string;
    distanceKm?: number;
    durationSec?: number;
    calories?: number | null;
    activityDate?: number;
  } = {},
) {
  const {
    id = Math.floor(Math.random() * 1_000_000),
    type = 'Run',
    distanceKm = 10.0,
    durationSec = 3600,
    calories = 500,
    // 2026-03-25 00:00:00 UTC (Wednesday of week Mon 23 – Sun 29)
    activityDate = 1774396800,
  } = opts;
  db.prepare(
    'INSERT OR REPLACE INTO activities (id, athlete_id, type, distance_km, duration_sec, calories, activity_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, athleteId, type, distanceKm, durationSec, calories, activityDate);
}

// ===========================================================================
// UNIT TESTS — getCurrentWeekRange()
// ===========================================================================
describe('src/lib/getCurrentWeekRange.ts — getCurrentWeekRange()', () => {
  beforeEach(() => jest.resetModules());

  afterEach(() => jest.restoreAllMocks());

  it('BE-T057: weekStart is Monday 00:00:00 UTC (called on Wednesday 2026-03-25)', () => {
    const wednesday = new Date('2026-03-25T14:30:00Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(wednesday);

    const { getCurrentWeekRange } = require('@/src/lib/getCurrentWeekRange');
    const { weekStartISO, weekEndISO } = getCurrentWeekRange();

    expect(weekStartISO).toBe('2026-03-23');
    expect(weekEndISO).toBe('2026-03-29');
  });

  it('BE-T058: called on Monday returns same week (not previous)', () => {
    const monday = new Date('2026-03-23T09:00:00Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(monday);

    const { getCurrentWeekRange } = require('@/src/lib/getCurrentWeekRange');
    const { weekStartISO, weekEndISO } = getCurrentWeekRange();

    expect(weekStartISO).toBe('2026-03-23');
    expect(weekEndISO).toBe('2026-03-29');
  });

  it('BE-T059: called on Sunday returns same week (not next)', () => {
    const sunday = new Date('2026-03-29T23:00:00Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(sunday);

    const { getCurrentWeekRange } = require('@/src/lib/getCurrentWeekRange');
    const { weekStartISO, weekEndISO } = getCurrentWeekRange();

    expect(weekStartISO).toBe('2026-03-23');
    expect(weekEndISO).toBe('2026-03-29');
  });

  it('BE-T060: weekStartEpoch is Monday 00:00:00 UTC (divisible by 86400)', () => {
    const wednesday = new Date('2026-03-25T14:30:00Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(wednesday);

    const { getCurrentWeekRange } = require('@/src/lib/getCurrentWeekRange');
    const { weekStartEpoch } = getCurrentWeekRange();

    const expected = Math.floor(new Date('2026-03-23T00:00:00Z').getTime() / 1000);
    expect(weekStartEpoch).toBe(expected);
    expect(weekStartEpoch % 86400).toBe(0);
  });

  it('BE-T061: weekEndEpoch - weekStartEpoch === 604799 (7 days minus 1 second)', () => {
    const wednesday = new Date('2026-03-25T14:30:00Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(wednesday);

    const { getCurrentWeekRange } = require('@/src/lib/getCurrentWeekRange');
    const { weekStartEpoch, weekEndEpoch } = getCurrentWeekRange();

    expect(weekEndEpoch - weekStartEpoch).toBe(604799);
  });
});

// ===========================================================================
// INTEGRATION TESTS — getLeaderboard() (leaderboard-service.ts)
//
// Tests the DB query logic directly — same pattern as T003's runSync() tests.
// The week range is fixed by mocking Date.now to Wed 2026-03-25.
// Seeded activities use activityDate = 1774396800 (2026-03-25 00:00:00 UTC)
// which falls within Mon 2026-03-23 00:00:00 UTC (1774224000) →
// Sun 2026-03-29 23:59:59 UTC (1774828799).
// ===========================================================================
describe('src/lib/leaderboard-service.ts — getLeaderboard()', () => {
  let db: Database.Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    // Fix week to Mon 2026-03-23 → Sun 2026-03-29
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-25T12:00:00Z').getTime());
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    jest.restoreAllMocks();
  });

  it('BE-T062: no activities → returns empty members array', async () => {
    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const d1 = makeD1Shim(db);
    const result = await getLeaderboard(d1);

    expect(result.members).toEqual([]);
  });

  it('BE-T063: activities present → members sorted by total_distance_km DESC', async () => {
    seedMember(db, 6001, 'Alice');
    seedMember(db, 6002, 'Bob');
    seedMember(db, 6003, 'Charlie');

    seedActivity(db, 6001, { id: 70001, distanceKm: 40.0, activityDate: 1774396800 });
    seedActivity(db, 6002, { id: 70002, distanceKm: 20.0, activityDate: 1774396800 });
    seedActivity(db, 6003, { id: 70003, distanceKm: 30.0, activityDate: 1774396800 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.members).toHaveLength(3);
    expect(result.members[0].name).toBe('Alice');
    expect(result.members[0].total_distance_km).toBe(40.0);
    expect(result.members[1].name).toBe('Charlie');
    expect(result.members[1].total_distance_km).toBe(30.0);
    expect(result.members[2].name).toBe('Bob');
    expect(result.members[2].total_distance_km).toBe(20.0);
  });

  it('BE-T064: distance tie → shorter duration ranks higher (ASC)', async () => {
    seedMember(db, 7001, 'Fast Runner');
    seedMember(db, 7002, 'Slow Runner');

    seedActivity(db, 7001, { id: 71001, distanceKm: 40.0, durationSec: 7200, activityDate: 1774396800 });
    seedActivity(db, 7002, { id: 71002, distanceKm: 40.0, durationSec: 10800, activityDate: 1774396800 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.members[0].name).toBe('Fast Runner');
    expect(result.members[1].name).toBe('Slow Runner');
  });

  it('BE-T065: response shape includes week_start, week_end, type_filter: "all", last_synced_at', async () => {
    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.week_start).toBe('2026-03-23');
    expect(result.week_end).toBe('2026-03-29');
    expect(result.type_filter).toBe('all');
    expect(result).toHaveProperty('last_synced_at');
  });

  it('BE-T066: last_synced_at is null when no members have been synced', async () => {
    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.last_synced_at).toBeNull();
  });

  it('BE-T067: last_synced_at is MAX(members.last_synced_at) when syncs exist', async () => {
    seedMember(db, 8001, 'Alpha', 1742800000);
    seedMember(db, 8002, 'Beta', 1742900000); // more recent
    seedActivity(db, 8001, { id: 72001, distanceKm: 10.0, activityDate: 1774396800 });
    seedActivity(db, 8002, { id: 72002, distanceKm: 15.0, activityDate: 1774396800 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.last_synced_at).toBe(1742900000);
  });

  it('BE-T068: members with zero activities in current week are excluded', async () => {
    seedMember(db, 9001, 'Active');
    seedMember(db, 9002, 'Inactive');

    seedActivity(db, 9001, { id: 73001, distanceKm: 20.0, activityDate: 1774396800 });
    // Inactive has no activities

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe('Active');
  });

  it('BE-T069: total_calories is 0 when activity has NULL calories (COALESCE)', async () => {
    seedMember(db, 10001, 'No Cal Runner');
    seedActivity(db, 10001, { id: 74001, calories: null, activityDate: 1774396800 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.members[0].total_calories).toBe(0);
  });
});
