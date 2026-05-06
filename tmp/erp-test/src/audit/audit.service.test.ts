import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDb } from "../../test/helpers/db.js";
import type { Db } from "../db/db.js";
import { AuditLogger } from "./audit.service.js";

describe("AuditLogger", () => {
  let db: Db;
  let logger: AuditLogger;

  beforeEach(() => {
    db = freshDb();
    logger = new AuditLogger(db);
  });

  afterEach(() => db.close());

  it("appends an entry and lists it back", () => {
    logger.append({
      entity_type: "stock_item",
      entity_id: "1",
      action: "STOCK_ITEM_CREATED",
      payload: { sku: "WIDGET-A", name: "Widget A" },
      actor_id: "warehouse-1",
    });
    const rows = logger.list({ entity_type: "stock_item", entity_id: "1" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.action).toBe("STOCK_ITEM_CREATED");
    expect(rows[0]?.actor_id).toBe("warehouse-1");
    expect(rows[0]?.payload).toEqual({ sku: "WIDGET-A", name: "Widget A" });
    expect(typeof rows[0]?.created_at).toBe("string");
  });

  it("filters by entity_type + entity_id", () => {
    logger.append({ entity_type: "stock_item", entity_id: "1", action: "A", payload: {}, actor_id: "u" });
    logger.append({ entity_type: "stock_item", entity_id: "2", action: "B", payload: {}, actor_id: "u" });
    logger.append({ entity_type: "purchase_order", entity_id: "1", action: "C", payload: {}, actor_id: "u" });

    expect(logger.list({ entity_type: "stock_item" })).toHaveLength(2);
    expect(logger.list({ entity_type: "stock_item", entity_id: "1" })).toHaveLength(1);
    expect(logger.list({ entity_type: "purchase_order" })).toHaveLength(1);
    expect(logger.list()).toHaveLength(3);
  });

  it("returns rows in chronological order (oldest first)", () => {
    logger.append({ entity_type: "stock_item", entity_id: "1", action: "FIRST", payload: {}, actor_id: "u" });
    logger.append({ entity_type: "stock_item", entity_id: "1", action: "SECOND", payload: {}, actor_id: "u" });
    const rows = logger.list({ entity_type: "stock_item", entity_id: "1" });
    expect(rows.map((r) => r.action)).toEqual(["FIRST", "SECOND"]);
  });
});
