import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";

describe("toolchain smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("loads better-sqlite3 in-memory", () => {
    const db = new Database(":memory:");
    db.exec("CREATE TABLE t(x INT); INSERT INTO t(x) VALUES (1),(2);");
    const row = db.prepare("SELECT SUM(x) AS s FROM t").get() as { s: number };
    expect(row.s).toBe(3);
    db.close();
  });
});
