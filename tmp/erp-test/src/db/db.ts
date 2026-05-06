import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(here, "schema.sql");

export type Db = Database.Database;

export function openDb(path = ":memory:"): Db {
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  return db;
}
