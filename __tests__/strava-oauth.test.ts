/**
 * @jest-environment node
 *
 * BE TDD Tests — SP1-T002
 * Tests: BE-T001 through BE-T021
 * AC-2: GET /api/auth/connect redirects to Strava OAuth URL
 * AC-3: Strava URL includes scope=activity:read_all
 * AC-4: Successful callback redirects to /
 * AC-5: members row upserted after callback
 * AC-6: tokens row upserted after callback
 * AC-7: Second callback with same athlete_id upserts, not duplicates
 * AC-8: Error params / missing code redirect to /connect?error=...
 *
 * Integration tests use real SQLite (better-sqlite3) to simulate D1.
 * The route handlers are imported and called directly with a mock Request.
 * Strava HTTP calls are intercepted at the global fetch level (unit layer).
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// D1Database is declared globally in cloudflare.d.ts (project-level ambient shim).

// ---------------------------------------------------------------------------
// Test DB setup (simulates Cloudflare D1 with better-sqlite3)
// ---------------------------------------------------------------------------
const MIGRATION_FILE = path.resolve(__dirname, '../migrations/0001_init.sql');
const DB_FILE = '/tmp/test-t002-oauth.db';

function buildTestDb(): Database.Database {
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const db = new Database(DB_FILE);
  db.exec(sql);
  return db;
}

// D1Database-compatible shim wrapping better-sqlite3
// Implements the subset used by upsertMember / upsertToken
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
// Strava token exchange mock response
// ---------------------------------------------------------------------------
const MOCK_ATHLETE = {
  id: 99887766,
  firstname: 'Jane',
  lastname: 'Runner',
  profile: 'https://example.com/avatar.jpg',
};

const MOCK_TOKEN_RESPONSE = {
  access_token: 'acc_test_token',
  refresh_token: 'ref_test_token',
  expires_at: 1900000000,
  athlete: MOCK_ATHLETE,
};

function mockStravaFetchSuccess() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_TOKEN_RESPONSE,
  } as Response);
}

function mockStravaFetchFailure(status = 400) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ message: 'Bad Request' }),
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// lib/strava.ts — unit tests
// ---------------------------------------------------------------------------
describe('lib/strava.ts — exchangeCodeForTokens()', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      STRAVA_CLIENT_ID: 'test_client_id',
      STRAVA_CLIENT_SECRET: 'test_client_secret',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it('BE-T001: sends correct POST body to Strava token endpoint', async () => {
    mockStravaFetchSuccess();
    const { exchangeCodeForTokens } = require('@/src/lib/strava');
    await exchangeCodeForTokens('test_code_123');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://www.strava.com/oauth/token');
    expect(options.method).toBe('POST');
    const body = options.body as string;
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code=test_code_123');
    expect(body).toContain('client_id=test_client_id');
    expect(body).toContain('client_secret=test_client_secret');
  });

  it('BE-T002: returns parsed token response with required fields', async () => {
    mockStravaFetchSuccess();
    const { exchangeCodeForTokens } = require('@/src/lib/strava');
    const result = await exchangeCodeForTokens('test_code_123');

    expect(result).toMatchObject({
      access_token: 'acc_test_token',
      refresh_token: 'ref_test_token',
      expires_at: 1900000000,
      athlete: expect.objectContaining({ id: 99887766 }),
    });
  });

  it('BE-T003: throws on non-2xx response from Strava', async () => {
    mockStravaFetchFailure(400);
    const { exchangeCodeForTokens } = require('@/src/lib/strava');
    await expect(exchangeCodeForTokens('bad_code')).rejects.toThrow();
  });

  it('BE-T004: throws on network error (fetch rejects)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
    const { exchangeCodeForTokens } = require('@/src/lib/strava');
    await expect(exchangeCodeForTokens('any_code')).rejects.toThrow('Network failure');
  });
});

// ---------------------------------------------------------------------------
// lib/db/members.ts — upsertMember()
// ---------------------------------------------------------------------------
describe('lib/db/members.ts — upsertMember()', () => {
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
  });

  it('BE-T005: inserts a member row with correct fields', async () => {
    const { upsertMember } = require('@/src/lib/db/members');
    const now = Math.floor(Date.now() / 1000);
    await upsertMember(d1, {
      athlete_id: 111,
      name: 'Alice Test',
      avatar_url: 'https://example.com/alice.jpg',
      created_at: now,
    });

    const row = db.prepare('SELECT * FROM members WHERE athlete_id = 111').get() as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.name).toBe('Alice Test');
    expect(row.avatar_url).toBe('https://example.com/alice.jpg');
    expect(row.created_at).toBe(now);
  });

  it('BE-T006: updates name + avatar_url on re-insert but preserves created_at', async () => {
    const { upsertMember } = require('@/src/lib/db/members');
    const originalTime = 1700000000;

    await upsertMember(d1, {
      athlete_id: 222,
      name: 'Bob Old',
      avatar_url: 'https://example.com/old.jpg',
      created_at: originalTime,
    });

    await upsertMember(d1, {
      athlete_id: 222,
      name: 'Bob New',
      avatar_url: 'https://example.com/new.jpg',
      created_at: originalTime + 9999,
    });

    const row = db.prepare('SELECT * FROM members WHERE athlete_id = 222').get() as Record<string, unknown>;
    expect(row.name).toBe('Bob New');
    expect(row.avatar_url).toBe('https://example.com/new.jpg');
    // created_at must NOT be updated
    expect(row.created_at).toBe(originalTime);
  });

  it('BE-T007: does not create duplicate rows on second upsert', async () => {
    const { upsertMember } = require('@/src/lib/db/members');
    const now = Math.floor(Date.now() / 1000);
    await upsertMember(d1, { athlete_id: 333, name: 'Carol', avatar_url: '', created_at: now });
    await upsertMember(d1, { athlete_id: 333, name: 'Carol Updated', avatar_url: '', created_at: now });

    const count = (db.prepare('SELECT COUNT(*) as c FROM members WHERE athlete_id = 333').get() as { c: number }).c;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// lib/db/tokens.ts — upsertToken()
// ---------------------------------------------------------------------------
describe('lib/db/tokens.ts — upsertToken()', () => {
  let db: Database.Database;
  let d1: D1Database;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    d1 = makeD1Shim(db);
    // tokens has FK → members; insert a member first
    db.prepare(
      'INSERT INTO members (athlete_id, name, avatar_url, created_at) VALUES (?, ?, ?, ?)',
    ).run(444, 'Dave', '', 1700000000);
    db.prepare(
      'INSERT INTO members (athlete_id, name, avatar_url, created_at) VALUES (?, ?, ?, ?)',
    ).run(555, 'Eve', '', 1700000000);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  });

  it('BE-T008: inserts a token row with correct fields', async () => {
    const { upsertToken } = require('@/src/lib/db/tokens');
    await upsertToken(d1, {
      athlete_id: 444,
      access_token: 'acc1',
      refresh_token: 'ref1',
      expires_at: 1900000000,
    });

    const row = db.prepare('SELECT * FROM tokens WHERE athlete_id = 444').get() as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.access_token).toBe('acc1');
    expect(row.refresh_token).toBe('ref1');
    expect(row.expires_at).toBe(1900000000);
  });

  it('BE-T009: updates all token fields on re-insert', async () => {
    const { upsertToken } = require('@/src/lib/db/tokens');
    await upsertToken(d1, { athlete_id: 555, access_token: 'old_acc', refresh_token: 'old_ref', expires_at: 100 });
    await upsertToken(d1, { athlete_id: 555, access_token: 'new_acc', refresh_token: 'new_ref', expires_at: 999 });

    const row = db.prepare('SELECT * FROM tokens WHERE athlete_id = 555').get() as Record<string, unknown>;
    expect(row.access_token).toBe('new_acc');
    expect(row.refresh_token).toBe('new_ref');
    expect(row.expires_at).toBe(999);
  });

  it('BE-T010: does not create duplicate token rows on second upsert', async () => {
    const { upsertToken } = require('@/src/lib/db/tokens');
    await upsertToken(d1, { athlete_id: 444, access_token: 'a', refresh_token: 'b', expires_at: 1 });
    await upsertToken(d1, { athlete_id: 444, access_token: 'c', refresh_token: 'd', expires_at: 2 });

    const count = (db.prepare('SELECT COUNT(*) as c FROM tokens WHERE athlete_id = 444').get() as { c: number }).c;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/connect — integration
// ---------------------------------------------------------------------------
describe('GET /api/auth/connect', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRAVA_CLIENT_ID: 'cid_test',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('BE-T011: returns 302 with Location pointing to Strava', async () => {
    const { GET } = require('@/app/api/auth/connect/route');
    const req = new Request('http://localhost:3000/api/auth/connect');
    const res: Response = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/^https:\/\/www\.strava\.com\/oauth\/authorize/);
  });

  it('BE-T012: Strava URL includes scope=activity:read_all', async () => {
    const { GET } = require('@/app/api/auth/connect/route');
    const req = new Request('http://localhost:3000/api/auth/connect');
    const res: Response = await GET(req);
    const location = res.headers.get('Location')!;
    const url = new URL(location);
    expect(url.searchParams.get('scope')).toBe('activity:read_all');
  });

  it('BE-T013: Strava URL includes correct client_id', async () => {
    const { GET } = require('@/app/api/auth/connect/route');
    const req = new Request('http://localhost:3000/api/auth/connect');
    const res: Response = await GET(req);
    const url = new URL(res.headers.get('Location')!);
    expect(url.searchParams.get('client_id')).toBe('cid_test');
  });

  it('BE-T014: Strava URL includes correct redirect_uri', async () => {
    const { GET } = require('@/app/api/auth/connect/route');
    const req = new Request('http://localhost:3000/api/auth/connect');
    const res: Response = await GET(req);
    const url = new URL(res.headers.get('Location')!);
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback');
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/callback — integration (real D1 shim)
// ---------------------------------------------------------------------------
describe('GET /api/auth/callback', () => {
  let db: Database.Database;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    db = buildTestDb();
    process.env = {
      ...OLD_ENV,
      STRAVA_CLIENT_ID: 'cid_test',
      STRAVA_CLIENT_SECRET: 'csecret_test',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  function makeCallbackRequest(params: Record<string, string>) {
    const url = new URL('http://localhost:3000/api/auth/callback');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    // Attach D1 shim via the env object that Next.js edge routes receive
    const req = new Request(url.toString());
    // We pass d1 via process level since edge routes read from cloudflare env —
    // the route handler is tested with a context injection approach via module-level mock
    return req;
  }

  async function callGET(params: Record<string, string>): Promise<Response> {
    // Inject D1 into the route module via a jest module mock of the db helpers
    // so the route uses our test DB shim instead of real D1 binding.
    jest.doMock('@/src/lib/db/members', () => ({
      upsertMember: async (
        _db: unknown,
        member: { athlete_id: number; name: string; avatar_url: string; created_at: number },
      ) => {
        db.prepare(
          `INSERT INTO members (athlete_id, name, avatar_url, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (athlete_id) DO UPDATE SET
             name = excluded.name,
             avatar_url = excluded.avatar_url`,
        ).run(member.athlete_id, member.name, member.avatar_url, member.created_at);
      },
    }));

    jest.doMock('@/src/lib/db/tokens', () => ({
      upsertToken: async (
        _db: unknown,
        token: { athlete_id: number; access_token: string; refresh_token: string; expires_at: number },
      ) => {
        db.prepare(
          `INSERT INTO tokens (athlete_id, access_token, refresh_token, expires_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (athlete_id) DO UPDATE SET
             access_token = excluded.access_token,
             refresh_token = excluded.refresh_token,
             expires_at = excluded.expires_at`,
        ).run(token.athlete_id, token.access_token, token.refresh_token, token.expires_at);
      },
    }));

    const { GET } = require('@/app/api/auth/callback/route');
    return GET(makeCallbackRequest(params));
  }

  it('BE-T015: successful callback redirects to /', async () => {
    mockStravaFetchSuccess();
    const res = await callGET({ code: 'valid_code' });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/');
  });

  it('BE-T016: members row exists in D1 after successful callback', async () => {
    mockStravaFetchSuccess();
    await callGET({ code: 'valid_code' });

    const row = db
      .prepare('SELECT * FROM members WHERE athlete_id = ?')
      .get(MOCK_ATHLETE.id) as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.name).toBe('Jane Runner');
    expect(row.avatar_url).toBe(MOCK_ATHLETE.profile);
    expect(typeof row.created_at).toBe('number');
  });

  it('BE-T017: tokens row exists in D1 after successful callback', async () => {
    mockStravaFetchSuccess();
    await callGET({ code: 'valid_code' });

    const row = db
      .prepare('SELECT * FROM tokens WHERE athlete_id = ?')
      .get(MOCK_ATHLETE.id) as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.access_token).toBe(MOCK_TOKEN_RESPONSE.access_token);
    expect(row.refresh_token).toBe(MOCK_TOKEN_RESPONSE.refresh_token);
    expect(row.expires_at).toBe(MOCK_TOKEN_RESPONSE.expires_at);
  });

  it('BE-T018: second callback with same athlete_id does not duplicate rows', async () => {
    mockStravaFetchSuccess();
    await callGET({ code: 'code_first' });
    mockStravaFetchSuccess();
    await callGET({ code: 'code_second' });

    const memberCount = (
      db.prepare('SELECT COUNT(*) as c FROM members WHERE athlete_id = ?').get(MOCK_ATHLETE.id) as { c: number }
    ).c;
    const tokenCount = (
      db.prepare('SELECT COUNT(*) as c FROM tokens WHERE athlete_id = ?').get(MOCK_ATHLETE.id) as { c: number }
    ).c;
    expect(memberCount).toBe(1);
    expect(tokenCount).toBe(1);
  });

  it('BE-T019: ?error=access_denied redirects to /connect?error=access_denied', async () => {
    const res = await callGET({ error: 'access_denied' });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/connect?error=access_denied');
  });

  it('BE-T020: missing ?code redirects to /connect?error=token_exchange_failed', async () => {
    const res = await callGET({});
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/connect?error=token_exchange_failed');
  });

  it('BE-T021: Strava token exchange failure redirects to /connect?error=token_exchange_failed', async () => {
    mockStravaFetchFailure(401);
    const res = await callGET({ code: 'bad_code' });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/connect?error=token_exchange_failed');
  });
});
