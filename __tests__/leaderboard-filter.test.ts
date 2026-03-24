/**
 * @jest-environment node
 *
 * BE TDD Tests — SP1-T005 (Activity Type Filter)
 * Tests: BE-T070 through BE-T083
 *
 * Integration tests use real SQLite via makeD1Shim (same pattern as T004).
 * Week is fixed to 2026-03-23 → 2026-03-29 via Date.now mock.
 * Activity dates use epoch 1774396800 (2026-03-25 00:00:00 UTC).
 *
 * Unit tests for the route handler use the route file via direct import
 * (same pattern as other route tests in this repo).
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Test DB helpers (same as leaderboard.test.ts)
// ---------------------------------------------------------------------------
const MIGRATION_FILE = path.resolve(__dirname, '../migrations/0001_init.sql');
const DB_FILE = '/tmp/test-t005-filter.db';

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
let activityIdCounter = 80000;

function seedMember(db: Database.Database, athleteId: number, name = 'Test Athlete') {
  db.prepare(
    'INSERT OR REPLACE INTO members (athlete_id, name, avatar_url, created_at, last_synced_at) VALUES (?, ?, ?, ?, ?)',
  ).run(athleteId, name, `https://example.com/${athleteId}.jpg`, 1700000000, null);
}

function seedActivity(
  db: Database.Database,
  athleteId: number,
  opts: {
    id?: number;
    type?: string;
    distanceKm?: number;
    durationSec?: number;
    calories?: number;
    activityDate?: number;
  } = {},
) {
  const {
    id = activityIdCounter++,
    type = 'Run',
    distanceKm = 10.0,
    durationSec = 3600,
    calories = 500,
    // 2026-03-25 00:00:00 UTC — falls in week 2026-03-23 → 2026-03-29
    activityDate = 1774396800,
  } = opts;
  db.prepare(
    'INSERT OR REPLACE INTO activities (id, athlete_id, type, distance_km, duration_sec, calories, activity_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, athleteId, type, distanceKm, durationSec, calories, activityDate);
}

// ===========================================================================
// INTEGRATION TESTS — getLeaderboard(db, type) with type filter
// ===========================================================================
describe('src/lib/leaderboard-service.ts — getLeaderboard() with type filter', () => {
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

  it('BE-T070: getLeaderboard(db, "Run") returns only Run activities — Ride excluded', async () => {
    seedMember(db, 5001, 'Alice');
    // Alice has Run + Ride this week
    seedActivity(db, 5001, { id: 80001, type: 'Run', distanceKm: 5.0 });
    seedActivity(db, 5001, { id: 80002, type: 'Ride', distanceKm: 20.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'Run');

    expect(result.members).toHaveLength(1);
    expect(result.members[0].total_distance_km).toBe(5.0);
    expect(result.type_filter).toBe('Run');
  });

  it('BE-T071: getLeaderboard(db, "WeightTraining") returns WeightTraining activities', async () => {
    seedMember(db, 5002, 'Bob');
    seedActivity(db, 5002, { id: 80003, type: 'WeightTraining', distanceKm: 0.0, durationSec: 3600, calories: 400 });
    seedActivity(db, 5002, { id: 80004, type: 'Run', distanceKm: 10.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'WeightTraining');

    expect(result.members).toHaveLength(1);
    expect(result.members[0].total_duration_sec).toBe(3600);
    expect(result.type_filter).toBe('WeightTraining');
  });

  it('BE-T072: getLeaderboard(db, "all") returns all activity types (same as no type)', async () => {
    seedMember(db, 5003, 'Carol');
    seedActivity(db, 5003, { id: 80005, type: 'Run', distanceKm: 5.0 });
    seedActivity(db, 5003, { id: 80006, type: 'Ride', distanceKm: 10.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'all');

    expect(result.members).toHaveLength(1);
    expect(result.members[0].total_distance_km).toBe(15.0);
    expect(result.type_filter).toBe('all');
  });

  it('BE-T073: getLeaderboard(db) with no type returns all activities (backward compat)', async () => {
    seedMember(db, 5004, 'Dan');
    seedActivity(db, 5004, { id: 80007, type: 'Run', distanceKm: 5.0 });
    seedActivity(db, 5004, { id: 80008, type: 'Walk', distanceKm: 3.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db));

    expect(result.members).toHaveLength(1);
    expect(result.members[0].total_distance_km).toBe(8.0);
    expect(result.type_filter).toBe('all');
  });

  it('BE-T074: getLeaderboard(db, "InvalidType") throws with code INVALID_TYPE', async () => {
    const { getLeaderboard } = require('@/src/lib/leaderboard-service');

    await expect(getLeaderboard(makeD1Shim(db), 'InvalidType')).rejects.toMatchObject({
      code: 'INVALID_TYPE',
    });
  });

  it('BE-T075: member with no matching type is excluded from filtered results', async () => {
    seedMember(db, 5005, 'Eve');
    seedMember(db, 5006, 'Frank');
    seedActivity(db, 5005, { id: 80009, type: 'Run', distanceKm: 10.0 });
    seedActivity(db, 5006, { id: 80010, type: 'Ride', distanceKm: 20.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'Run');

    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe('Eve');
  });

  it('BE-T076: getLeaderboard with ?type=Ride returns correct Ride totals', async () => {
    seedMember(db, 5007, 'Grace');
    seedActivity(db, 5007, { id: 80011, type: 'Ride', distanceKm: 25.0, durationSec: 4500, calories: 600 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'Ride');

    expect(result.members[0].total_distance_km).toBe(25.0);
    expect(result.members[0].total_duration_sec).toBe(4500);
    expect(result.members[0].total_calories).toBe(600);
  });

  it('BE-T077: getLeaderboard with ?type=Walk returns correct Walk totals', async () => {
    seedMember(db, 5008, 'Heidi');
    seedActivity(db, 5008, { id: 80012, type: 'Walk', distanceKm: 3.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'Walk');

    expect(result.members).toHaveLength(1);
    expect(result.members[0].total_distance_km).toBe(3.0);
    expect(result.type_filter).toBe('Walk');
  });

  it('BE-T078: getLeaderboard with ?type=Other returns correct Other totals', async () => {
    seedMember(db, 5009, 'Ivan');
    seedActivity(db, 5009, { id: 80013, type: 'Other', distanceKm: 8.0 });

    const { getLeaderboard } = require('@/src/lib/leaderboard-service');
    const result = await getLeaderboard(makeD1Shim(db), 'Other');

    expect(result.members).toHaveLength(1);
    expect(result.type_filter).toBe('Other');
  });
});

// ===========================================================================
// UNIT TESTS — GET /api/leaderboard route handler (type validation)
// ===========================================================================
describe('GET /api/leaderboard route — type param validation', () => {
  it('BE-T079: returns 400 INVALID_TYPE for ?type=Cycling', async () => {
    const { GET } = require('@/app/api/leaderboard/route');

    const mockDb = {
      prepare: jest.fn(),
    };

    const request = {
      env: { DB: mockDb },
      url: 'http://localhost/api/leaderboard?type=Cycling',
    } as unknown as Request;

    const response: Response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_TYPE');
    expect(body.error).toMatch(/Invalid activity type/i);
  });

  it('BE-T080: returns 400 INVALID_TYPE for ?type=run (lowercase — case-sensitive)', async () => {
    jest.resetModules();
    const { GET } = require('@/app/api/leaderboard/route');

    const mockDb = { prepare: jest.fn() };
    const request = {
      env: { DB: mockDb },
      url: 'http://localhost/api/leaderboard?type=run',
    } as unknown as Request;

    const response: Response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_TYPE');
  });

  it('BE-T081: returns 400 INVALID_TYPE for ?type= (empty string)', async () => {
    jest.resetModules();
    const { GET } = require('@/app/api/leaderboard/route');

    const mockDb = { prepare: jest.fn() };
    const request = {
      env: { DB: mockDb },
      url: 'http://localhost/api/leaderboard?type=',
    } as unknown as Request;

    const response: Response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_TYPE');
  });

  it('BE-T082: returns 200 with type_filter "all" for ?type=all', async () => {
    jest.resetModules();

    const mockGetLeaderboard = jest.fn().mockResolvedValue({
      week_start: '2026-03-23',
      week_end: '2026-03-29',
      type_filter: 'all',
      last_synced_at: null,
      members: [],
    });
    // Include real VALID_TYPES and InvalidTypeError so the route can still use them
    const realService = jest.requireActual('@/src/lib/leaderboard-service') as {
      VALID_TYPES: readonly string[];
      InvalidTypeError: unknown;
    };
    jest.doMock('@/src/lib/leaderboard-service', () => ({
      ...realService,
      getLeaderboard: mockGetLeaderboard,
    }));

    const { GET } = require('@/app/api/leaderboard/route');

    const mockDb = { prepare: jest.fn() };
    const request = {
      env: { DB: mockDb },
      url: 'http://localhost/api/leaderboard?type=all',
    } as unknown as Request;

    const response: Response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.type_filter).toBe('all');
    // getLeaderboard should be called with null (not "all") for the type
    expect(mockGetLeaderboard).toHaveBeenCalledWith(mockDb, null);
  });

  it('BE-T083: returns 500 INTERNAL_ERROR when D1 throws', async () => {
    jest.resetModules();

    const realService = jest.requireActual('@/src/lib/leaderboard-service') as {
      VALID_TYPES: readonly string[];
      InvalidTypeError: unknown;
    };
    jest.doMock('@/src/lib/leaderboard-service', () => ({
      ...realService,
      getLeaderboard: jest.fn().mockRejectedValue(new Error('D1 connection failed')),
    }));

    const { GET } = require('@/app/api/leaderboard/route');

    const mockDb = { prepare: jest.fn() };
    const request = {
      env: { DB: mockDb },
      url: 'http://localhost/api/leaderboard',
    } as unknown as Request;

    const response: Response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
