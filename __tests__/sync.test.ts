/**
 * @jest-environment node
 *
 * BE TDD Tests — SP1-T003
 * Tests: BE-T022 through BE-T046
 * AC-1: Cron triggers endpoint / runSync returns { synced: N }
 * AC-2: Expired tokens are refreshed before fetching
 * AC-3: Activities upserted with correct field mapping
 * AC-4: One member failure does not block others
 * AC-5: Endpoint protected — 401 with no/wrong Authorization
 * AC-6: `after` param uses MAX(activity_date) or now-90days default
 *
 * Integration tests use real SQLite (better-sqlite3) to simulate Cloudflare D1.
 * Strava HTTP calls are intercepted at the global fetch level.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Test DB helpers (same pattern as T002)
// ---------------------------------------------------------------------------
const MIGRATION_FILE = path.resolve(__dirname, '../migrations/0001_init.sql');
const DB_FILE = '/tmp/test-t003-sync.db';

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
// Helpers to seed test data
// ---------------------------------------------------------------------------
function seedMember(db: Database.Database, athleteId: number, name = 'Test Runner') {
  db.prepare(
    'INSERT OR REPLACE INTO members (athlete_id, name, avatar_url, created_at) VALUES (?, ?, ?, ?)',
  ).run(athleteId, name, null, 1700000000);
}

function seedToken(
  db: Database.Database,
  athleteId: number,
  {
    accessToken = 'valid_access_token',
    refreshToken = 'valid_refresh_token',
    expiresAt = Math.floor(Date.now() / 1000) + 7200, // 2h from now — not expired
  }: { accessToken?: string; refreshToken?: string; expiresAt?: number } = {},
) {
  db.prepare(
    'INSERT OR REPLACE INTO tokens (athlete_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
  ).run(athleteId, accessToken, refreshToken, expiresAt);
}

function seedActivity(
  db: Database.Database,
  athleteId: number,
  {
    id = 99001,
    type = 'Run',
    distanceKm = 5.0,
    durationSec = 1800,
    calories = 300,
    activityDate = 1742796000,
  }: {
    id?: number;
    type?: string;
    distanceKm?: number;
    durationSec?: number;
    calories?: number;
    activityDate?: number;
  } = {},
) {
  db.prepare(
    'INSERT OR REPLACE INTO activities (id, athlete_id, type, distance_km, duration_sec, calories, activity_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, athleteId, type, distanceKm, durationSec, calories, activityDate);
}

// ---------------------------------------------------------------------------
// Mock Strava activity response builder
// ---------------------------------------------------------------------------
function makeStravaActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 12345678901,
    type: 'Run',
    distance: 5432.1,
    moving_time: 1800,
    elapsed_time: 1950,
    calories: 312,
    start_date: '2026-03-24T06:00:00Z',
    athlete: { id: 9999001 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// makeEnv helper — simulates Cloudflare Worker env object
// ---------------------------------------------------------------------------
function makeEnv(db: D1Database, overrides: Record<string, string> = {}) {
  return {
    DB: db,
    CRON_SECRET: 'test-cron-secret-123',
    STRAVA_CLIENT_ID: 'test_client_id',
    STRAVA_CLIENT_SECRET: 'test_client_secret',
    ...overrides,
  };
}

// ===========================================================================
// UNIT TESTS — mappers.ts
// ===========================================================================
describe('lib/sync/mappers.ts — normaliseType()', () => {
  beforeEach(() => jest.resetModules());

  it('BE-T022: Run → Run', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('Run')).toBe('Run');
  });

  it('BE-T023: Ride → Ride', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('Ride')).toBe('Ride');
  });

  it('BE-T024: Walk → Walk', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('Walk')).toBe('Walk');
  });

  it('BE-T025: WeightTraining → WeightTraining', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('WeightTraining')).toBe('WeightTraining');
  });

  it('BE-T026: Yoga → Other (unknown type)', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('Yoga')).toBe('Other');
  });

  it('BE-T027: AlpineSki → Other', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('AlpineSki')).toBe('Other');
  });

  it('BE-T028: empty string → Other', () => {
    const { normaliseType } = require('@/src/lib/sync/mappers');
    expect(normaliseType('')).toBe('Other');
  });
});

describe('lib/sync/mappers.ts — metersToKm()', () => {
  beforeEach(() => jest.resetModules());

  it('BE-T029: 5000m → 5.0 km', () => {
    const { metersToKm } = require('@/src/lib/sync/mappers');
    expect(metersToKm(5000)).toBe(5.0);
  });

  it('BE-T030: 100m → 0.1 km', () => {
    const { metersToKm } = require('@/src/lib/sync/mappers');
    expect(metersToKm(100)).toBeCloseTo(0.1, 3);
  });

  it('BE-T031: 0m → 0 km', () => {
    const { metersToKm } = require('@/src/lib/sync/mappers');
    expect(metersToKm(0)).toBe(0);
  });
});

describe('lib/sync/mappers.ts — isoToUnix()', () => {
  beforeEach(() => jest.resetModules());

  it('BE-T032: 2026-03-24T06:00:00Z → correct Unix epoch seconds', () => {
    const { isoToUnix } = require('@/src/lib/sync/mappers');
    const expected = Math.floor(new Date('2026-03-24T06:00:00Z').getTime() / 1000);
    expect(isoToUnix('2026-03-24T06:00:00Z')).toBe(expected);
  });
});

// ===========================================================================
// UNIT TESTS — validate-cron-secret.ts
// ===========================================================================
describe('lib/sync/validate-cron-secret.ts', () => {
  beforeEach(() => jest.resetModules());

  it('BE-T033: returns 401 when Authorization header is absent', async () => {
    const { validateCronSecret } = require('@/src/lib/sync/validate-cron-secret');
    const req = new Request('http://localhost/api/sync', { method: 'POST' });
    const env = { CRON_SECRET: 'correct-secret' };
    const result = await validateCronSecret(req, env);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('BE-T034: returns 401 when secret is wrong', async () => {
    const { validateCronSecret } = require('@/src/lib/sync/validate-cron-secret');
    const req = new Request('http://localhost/api/sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const env = { CRON_SECRET: 'correct-secret' };
    const result = await validateCronSecret(req, env);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('BE-T035: returns null (pass) when secret matches', async () => {
    const { validateCronSecret } = require('@/src/lib/sync/validate-cron-secret');
    const req = new Request('http://localhost/api/sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer correct-secret' },
    });
    const env = { CRON_SECRET: 'correct-secret' };
    const result = await validateCronSecret(req, env);
    expect(result).toBeNull();
  });
});

// ===========================================================================
// INTEGRATION TESTS — TokenService
// ===========================================================================
describe('lib/sync/token-service.ts — getValidToken()', () => {
  let db: Database.Database;
  let d1: D1Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    d1 = makeD1Shim(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    jest.restoreAllMocks();
  });

  it('BE-T036: non-expired token — no Strava OAuth call made', async () => {
    seedMember(db, 1001);
    const futureExpiry = Math.floor(Date.now() / 1000) + 7200;
    seedToken(db, 1001, { accessToken: 'valid_acc', expiresAt: futureExpiry });

    global.fetch = jest.fn();
    const { getValidToken } = require('@/src/lib/sync/token-service');
    const env = makeEnv(d1);
    const token = await getValidToken(1001, env);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(token.access_token).toBe('valid_acc');
  });

  it('BE-T037: expired token (expires_at <= now+300) — Strava OAuth called and D1 row updated', async () => {
    seedMember(db, 1002);
    const pastExpiry = Math.floor(Date.now() / 1000) - 1;
    seedToken(db, 1002, { accessToken: 'old_acc', refreshToken: 'old_ref', expiresAt: pastExpiry });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new_acc_token',
        refresh_token: 'new_ref_token',
        expires_at: Math.floor(Date.now() / 1000) + 21600,
      }),
    } as Response);

    const { getValidToken } = require('@/src/lib/sync/token-service');
    const env = makeEnv(d1);
    const token = await getValidToken(1002, env);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://www.strava.com/oauth/token');

    // D1 row must be updated
    const row = db.prepare('SELECT * FROM tokens WHERE athlete_id = 1002').get() as Record<string, unknown>;
    expect(row.access_token).toBe('new_acc_token');
    expect(row.refresh_token).toBe('new_ref_token');
    expect(token.access_token).toBe('new_acc_token');
  });

  it('BE-T038: token within 5-min buffer (expires_at = now+100) — refresh called', async () => {
    seedMember(db, 1003);
    const soonExpiry = Math.floor(Date.now() / 1000) + 100; // < 300s buffer
    seedToken(db, 1003, { expiresAt: soonExpiry });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'refreshed_acc',
        refresh_token: 'refreshed_ref',
        expires_at: Math.floor(Date.now() / 1000) + 21600,
      }),
    } as Response);

    const { getValidToken } = require('@/src/lib/sync/token-service');
    const env = makeEnv(d1);
    await getValidToken(1003, env);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('BE-T039: token refresh fails (Strava returns 400) — throws TokenRefreshError', async () => {
    seedMember(db, 1004);
    seedToken(db, 1004, { expiresAt: Math.floor(Date.now() / 1000) - 1 });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad Request' }),
    } as unknown as Response);

    const { getValidToken } = require('@/src/lib/sync/token-service');
    const env = makeEnv(d1);
    await expect(getValidToken(1004, env)).rejects.toThrow();
  });
});

// ===========================================================================
// INTEGRATION TESTS — ActivityService
// ===========================================================================
describe('lib/sync/activity-service.ts — fetchAndUpsert()', () => {
  let db: Database.Database;
  let d1: D1Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    d1 = makeD1Shim(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    jest.restoreAllMocks();
  });

  it('BE-T040: after param = MAX(activity_date) from D1 when prior activities exist', async () => {
    seedMember(db, 2001);
    const lastDate = 1742796000;
    seedActivity(db, 2001, { id: 80001, activityDate: lastDate });

    let capturedUrl = '';
    global.fetch = jest.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2001, 'test_access_token', env);

    expect(capturedUrl).toContain(`after=${lastDate}`);
  });

  it('BE-T041: after param defaults to now-90days when no prior activities', async () => {
    seedMember(db, 2002);

    const beforeCall = Math.floor(Date.now() / 1000);
    let capturedUrl = '';
    global.fetch = jest.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2002, 'test_access_token', env);

    const afterParam = parseInt(new URL(capturedUrl).searchParams.get('after')!);
    const ninetyDaysAgo = beforeCall - 90 * 24 * 60 * 60;
    // Should be approximately 90 days ago (within 5 seconds tolerance)
    expect(afterParam).toBeGreaterThanOrEqual(ninetyDaysAgo - 5);
    expect(afterParam).toBeLessThanOrEqual(ninetyDaysAgo + 5);
  });

  it('BE-T042: activity upserted with correct field mapping (m→km, type, date)', async () => {
    seedMember(db, 2003);

    const mockActivity = makeStravaActivity({
      id: 99991,
      type: 'Run',
      distance: 5000,
      moving_time: 1800,
      calories: 312,
      start_date: '2026-03-24T06:00:00Z',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockActivity],
    } as Response);

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2003, 'test_access_token', env);

    const row = db.prepare('SELECT * FROM activities WHERE id = 99991').get() as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.athlete_id).toBe(2003);
    expect(row.type).toBe('Run');
    expect(row.distance_km).toBeCloseTo(5.0, 3);
    expect(row.duration_sec).toBe(1800);
    expect(row.calories).toBe(312);
    expect(row.activity_date).toBe(Math.floor(new Date('2026-03-24T06:00:00Z').getTime() / 1000));
  });

  it('BE-T043: re-running sync does not duplicate rows (idempotent upsert)', async () => {
    seedMember(db, 2004);
    const mockActivity = makeStravaActivity({ id: 99992 });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockActivity],
    } as Response);

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2004, 'test_access_token', env);
    await fetchAndUpsert(2004, 'test_access_token', env);

    const count = (db.prepare('SELECT COUNT(*) as c FROM activities WHERE id = 99992').get() as { c: number }).c;
    expect(count).toBe(1);
  });

  it('BE-T044: calories defaults to 0 when Strava returns null', async () => {
    seedMember(db, 2005);
    const mockActivity = makeStravaActivity({ id: 99993, calories: null });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockActivity],
    } as Response);

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2005, 'test_access_token', env);

    const row = db.prepare('SELECT * FROM activities WHERE id = 99993').get() as Record<string, unknown>;
    expect(row.calories).toBe(0);
  });

  it('BE-T045: Strava activities fetch fails (500) — throws ActivityFetchError', async () => {
    seedMember(db, 2006);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    } as unknown as Response);

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await expect(fetchAndUpsert(2006, 'test_access_token', env)).rejects.toThrow();
  });

  it('BE-T046: unknown activity type Yoga stored as Other', async () => {
    seedMember(db, 2007);
    const mockActivity = makeStravaActivity({ id: 99994, type: 'Yoga' });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockActivity],
    } as Response);

    const { fetchAndUpsert } = require('@/src/lib/sync/activity-service');
    const env = makeEnv(d1);
    await fetchAndUpsert(2007, 'test_access_token', env);

    const row = db.prepare('SELECT * FROM activities WHERE id = 99994').get() as Record<string, unknown>;
    expect(row.type).toBe('Other');
  });
});

// ===========================================================================
// INTEGRATION TESTS — SyncService (runSync)
// ===========================================================================
describe('lib/sync/sync-service.ts — runSync()', () => {
  let db: Database.Database;
  let d1: D1Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    d1 = makeD1Shim(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    jest.restoreAllMocks();
  });

  it('BE-T047: empty members table → { synced: 0 }', async () => {
    global.fetch = jest.fn();
    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    const result = await runSync(env);
    expect(result).toEqual({ synced: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('BE-T048: member with valid non-expired token — no Strava OAuth call made', async () => {
    seedMember(db, 3001);
    seedToken(db, 3001, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });

    const fetchCalls: string[] = [];
    global.fetch = jest.fn().mockImplementation((url: string) => {
      fetchCalls.push(url);
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    const result = await runSync(env);

    expect(result.synced).toBe(1);
    // No OAuth token refresh call
    const oauthCalls = fetchCalls.filter((u) => u.includes('oauth/token'));
    expect(oauthCalls).toHaveLength(0);
    // One activities call
    const actCalls = fetchCalls.filter((u) => u.includes('athlete/activities'));
    expect(actCalls).toHaveLength(1);
  });

  it('BE-T049: member with expired token → tokens row updated in D1', async () => {
    seedMember(db, 3002);
    seedToken(db, 3002, {
      accessToken: 'expired_acc',
      refreshToken: 'valid_ref',
      expiresAt: Math.floor(Date.now() / 1000) - 1,
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('oauth/token')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'refreshed_acc',
            refresh_token: 'refreshed_ref',
            expires_at: Math.floor(Date.now() / 1000) + 21600,
          }),
        } as Response);
      }
      // activities fetch
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    await runSync(env);

    const row = db.prepare('SELECT * FROM tokens WHERE athlete_id = 3002').get() as Record<string, unknown>;
    expect(row.access_token).toBe('refreshed_acc');
  });

  it('BE-T050: token refresh fails → member skipped, synced count excludes it', async () => {
    seedMember(db, 3003);
    seedToken(db, 3003, { expiresAt: Math.floor(Date.now() / 1000) - 1 });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    } as unknown as Response);

    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    const result = await runSync(env);
    expect(result.synced).toBe(0);
  });

  it('BE-T051: Strava activities fetch fails → other members still processed', async () => {
    seedMember(db, 4001, 'Member Fail');
    seedMember(db, 4002, 'Member OK');
    seedToken(db, 4001, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });
    seedToken(db, 4002, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('athlete_id=4001') || (url.includes('athlete/activities') && (global.fetch as jest.Mock).mock.calls.filter((c: unknown[]) => (c[0] as string).includes('athlete/activities')).length === 1)) {
        // First activities call (for 4001) fails
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server Error' }),
        } as unknown as Response);
      }
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    const result = await runSync(env);
    // At least 1 member processed (4002 should succeed even if 4001 fails)
    expect(result.synced).toBeGreaterThanOrEqual(1);
  });

  it('BE-T052: 3 members, 1 token refresh fails → { synced: 2 }', async () => {
    seedMember(db, 5001, 'Good Member 1');
    seedMember(db, 5002, 'Bad Token Member');
    seedMember(db, 5003, 'Good Member 2');

    // 5001 and 5003 have valid tokens
    seedToken(db, 5001, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });
    // 5002 has an expired token that will fail to refresh
    seedToken(db, 5002, {
      accessToken: 'expired_acc',
      refreshToken: 'bad_refresh',
      expiresAt: Math.floor(Date.now() / 1000) - 1,
    });
    seedToken(db, 5003, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('oauth/token')) {
        // 5002's token refresh fails
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Bad Request' }),
        } as unknown as Response);
      }
      // activities fetches succeed
      return Promise.resolve({ ok: true, json: async () => [] } as Response);
    });

    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    const result = await runSync(env);
    expect(result.synced).toBe(2);
  });

  it('BE-T053: last_synced_at is updated on members after successful sync', async () => {
    seedMember(db, 5010);
    seedToken(db, 5010, { expiresAt: Math.floor(Date.now() / 1000) + 7200 });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const before = Math.floor(Date.now() / 1000);
    const { runSync } = require('@/src/lib/sync/sync-service');
    const env = makeEnv(d1);
    await runSync(env);

    const row = db.prepare('SELECT last_synced_at FROM members WHERE athlete_id = 5010').get() as Record<
      string,
      unknown
    >;
    expect(row.last_synced_at).toBeGreaterThanOrEqual(before);
  });
});

// ===========================================================================
// INTEGRATION TESTS — POST /api/sync route
// ===========================================================================
describe('POST /api/sync', () => {
  let db: Database.Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    jest.restoreAllMocks();
  });

  function makeRequest(headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/sync', {
      method: 'POST',
      headers,
    });
  }

  it('BE-T054: no Authorization header → 401', async () => {
    const { POST } = require('@/app/api/sync/route');
    const req = makeRequest();
    // Inject env via request.env pattern (same as callback route)
    (req as unknown as Record<string, unknown>).env = {
      DB: makeD1Shim(db),
      CRON_SECRET: 'test-secret',
      STRAVA_CLIENT_ID: 'cid',
      STRAVA_CLIENT_SECRET: 'csec',
    };
    const res: Response = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('BE-T055: wrong Authorization secret → 401', async () => {
    const { POST } = require('@/app/api/sync/route');
    const req = makeRequest({ Authorization: 'Bearer wrong-secret' });
    (req as unknown as Record<string, unknown>).env = {
      DB: makeD1Shim(db),
      CRON_SECRET: 'test-secret',
      STRAVA_CLIENT_ID: 'cid',
      STRAVA_CLIENT_SECRET: 'csec',
    };
    const res: Response = await POST(req);
    expect(res.status).toBe(401);
  });

  it('BE-T056: valid secret + empty members → 200 { synced: 0 }', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);

    const { POST } = require('@/app/api/sync/route');
    const req = makeRequest({ Authorization: 'Bearer test-secret' });
    (req as unknown as Record<string, unknown>).env = {
      DB: makeD1Shim(db),
      CRON_SECRET: 'test-secret',
      STRAVA_CLIENT_ID: 'cid',
      STRAVA_CLIENT_SECRET: 'csec',
    };
    const res: Response = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toEqual({ synced: 0 });
  });
});
