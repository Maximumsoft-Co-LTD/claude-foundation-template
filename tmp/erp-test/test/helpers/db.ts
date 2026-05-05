import { openDb, type Db } from "../../src/db/db.js";

export function freshDb(): Db {
  return openDb(":memory:");
}
