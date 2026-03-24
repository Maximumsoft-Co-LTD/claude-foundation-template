/**
 * @jest-environment node
 */
/**
 * BE Integration Tests — SP1-T001
 * AC-2: D1 migrations apply successfully (local)
 * AC-5: D1 schema is correct and ready for downstream tasks
 *
 * Strategy: apply migration to a real local SQLite file via wrangler,
 * then query sqlite_master and PRAGMA table_info to verify schema.
 *
 * These tests are written BEFORE implementation.
 * They will be RED until migrations/0001_init.sql and wrangler.toml exist.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.resolve(__dirname, '../migrations/0001_init.sql');
const DB_FILE = path.resolve('/tmp/test-leaderboard-migration.db');

function applyMigration(): Database.Database {
  // Remove any stale test DB
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const db = new Database(DB_FILE);
  db.exec(sql);
  return db;
}

describe('D1 Migration — 0001_init', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = applyMigration();
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  });

  it('AC-2: migration SQL file exists', () => {
    expect(fs.existsSync(MIGRATION_FILE)).toBe(true);
  });

  it('AC-5: members table exists', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='members'").get();
    expect(row).toBeDefined();
  });

  it('AC-5: tokens table exists', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'").get();
    expect(row).toBeDefined();
  });

  it('AC-5: activities table exists', () => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='activities'").get();
    expect(row).toBeDefined();
  });

  it('AC-5: members table has correct columns', () => {
    const cols = db.prepare('PRAGMA table_info(members)').all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain('athlete_id');
    expect(names).toContain('name');
    expect(names).toContain('avatar_url');
    expect(names).toContain('created_at');
    expect(names).toContain('last_synced_at');
  });

  it('AC-5: tokens table has correct columns', () => {
    const cols = db.prepare('PRAGMA table_info(tokens)').all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain('athlete_id');
    expect(names).toContain('access_token');
    expect(names).toContain('refresh_token');
    expect(names).toContain('expires_at');
  });

  it('AC-5: activities table has correct columns', () => {
    const cols = db.prepare('PRAGMA table_info(activities)').all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('athlete_id');
    expect(names).toContain('type');
    expect(names).toContain('distance_km');
    expect(names).toContain('duration_sec');
    expect(names).toContain('calories');
    expect(names).toContain('activity_date');
  });

  it('AC-5: idx_activities_athlete_date index exists', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_activities_athlete_date'"
    ).get();
    expect(row).toBeDefined();
  });
});
