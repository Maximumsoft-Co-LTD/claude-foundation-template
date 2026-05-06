import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDb } from "../../test/helpers/db.js";
import type { Db } from "../db/db.js";
import { AuditLogger } from "../audit/audit.service.js";
import { InventoryService } from "./inventory.service.js";
import {
  DuplicateSkuError,
  InvalidQtyError,
  NegativeStockError,
  StockItemNotFoundError,
  ValidationError,
} from "./errors.js";

const ACTOR = "warehouse-1";

describe("InventoryService", () => {
  let db: Db;
  let audit: AuditLogger;
  let svc: InventoryService;

  beforeEach(() => {
    db = freshDb();
    audit = new AuditLogger(db);
    svc = new InventoryService(db, audit);
  });
  afterEach(() => db.close());

  describe("AC-1 — register SKU + initial receipt", () => {
    it("createStockItem returns a row with on_hand=0", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(item.id).toBeGreaterThan(0);
      expect(item.sku).toBe("WIDGET-A");
      expect(item.name).toBe("Widget A");
      expect(item.on_hand_qty).toBe(0);
      expect(typeof item.created_at).toBe("string");
    });

    it("createStockItem appends STOCK_ITEM_CREATED audit row", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      const rows = audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.action).toBe("STOCK_ITEM_CREATED");
      expect(rows[0]?.actor_id).toBe(ACTOR);
      expect(rows[0]?.payload).toMatchObject({ sku: "WIDGET-A", name: "Widget A" });
    });

    it("recordReceipt(50) sets on_hand=50", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      const fresh = svc.getStockItem(item.id);
      expect(fresh?.on_hand_qty).toBe(50);
    });

    it("recordReceipt appends STOCK_RECEIVED audit row", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      const rows = audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
      expect(rows.map((r) => r.action)).toEqual(["STOCK_ITEM_CREATED", "STOCK_RECEIVED"]);
      expect(rows[1]?.payload).toMatchObject({ qty_delta: 50, source_type: "RECEIPT" });
    });
  });

  describe("AC-2 — adjustment with reason", () => {
    it("adjustment(-10) on on-hand=50 sets on_hand=40", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -10, reason: "damage", actorId: ACTOR });
      expect(svc.getStockItem(item.id)?.on_hand_qty).toBe(40);
    });

    it("adjustment audit payload contains qtyDelta + reason", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -10, reason: "damage", actorId: ACTOR });
      const rows = audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
      const last = rows.at(-1);
      expect(last?.action).toBe("STOCK_ADJUSTED");
      expect(last?.payload).toMatchObject({ qty_delta: -10, reason: "damage" });
    });
  });

  describe("AC-3 — reject negative-stock adjustment", () => {
    it("adjustment(-5) when on_hand=0 throws NegativeStockError", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(() =>
        svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -5, reason: "damage", actorId: ACTOR })
      ).toThrow(NegativeStockError);
    });

    it("rejection writes 0 audit rows beyond the create", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      try {
        svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -5, reason: "damage", actorId: ACTOR });
      } catch {}
      const rows = audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
      expect(rows.map((r) => r.action)).toEqual(["STOCK_ITEM_CREATED"]);
    });

    it("rejection leaves on_hand unchanged", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      try {
        svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -5, reason: "damage", actorId: ACTOR });
      } catch {}
      expect(svc.getStockItem(item.id)?.on_hand_qty).toBe(0);
    });
  });

  describe("AC-4 — reject duplicate SKU", () => {
    it("createStockItem with existing SKU throws DuplicateSkuError", () => {
      svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(() =>
        svc.createStockItem({ sku: "WIDGET-A", name: "Whatever", actorId: ACTOR })
      ).toThrow(DuplicateSkuError);
    });

    it("duplicate-rejection writes no extra audit row", () => {
      svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      try {
        svc.createStockItem({ sku: "WIDGET-A", name: "Whatever", actorId: ACTOR });
      } catch {}
      const rows = audit.list({ entity_type: "stock_item" });
      expect(rows).toHaveLength(1);
    });
  });

  describe("AC-5 — reject non-positive receipt qty", () => {
    it("recordReceipt(0) throws InvalidQtyError", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(() =>
        svc.recordReceipt({ stockItemId: item.id, qty: 0, actorId: ACTOR })
      ).toThrow(InvalidQtyError);
    });

    it("recordReceipt(-1) throws InvalidQtyError", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(() =>
        svc.recordReceipt({ stockItemId: item.id, qty: -1, actorId: ACTOR })
      ).toThrow(InvalidQtyError);
    });
  });

  describe("edge cases", () => {
    it("recordReceipt for missing stock item throws StockItemNotFoundError", () => {
      expect(() =>
        svc.recordReceipt({ stockItemId: 9999, qty: 5, actorId: ACTOR })
      ).toThrow(StockItemNotFoundError);
    });

    it("createStockItem with empty sku throws ValidationError", () => {
      expect(() => svc.createStockItem({ sku: "", name: "n", actorId: ACTOR })).toThrow(
        ValidationError
      );
    });

    it("createStockItem with empty name throws ValidationError", () => {
      expect(() => svc.createStockItem({ sku: "S", name: "", actorId: ACTOR })).toThrow(
        ValidationError
      );
    });

    it("recordAdjustment with qtyDelta=0 throws InvalidQtyError", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      expect(() =>
        svc.recordAdjustment({ stockItemId: item.id, qtyDelta: 0, reason: "n", actorId: ACTOR })
      ).toThrow(InvalidQtyError);
    });

    it("recordAdjustment with empty reason throws ValidationError", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 10, actorId: ACTOR });
      expect(() =>
        svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -1, reason: "", actorId: ACTOR })
      ).toThrow(ValidationError);
    });

    it("listStock returns items sorted by created_at DESC (newest first)", () => {
      const a = svc.createStockItem({ sku: "A", name: "A", actorId: ACTOR });
      const b = svc.createStockItem({ sku: "B", name: "B", actorId: ACTOR });
      const list = svc.listStock();
      expect(list.map((i) => i.id)).toEqual([b.id, a.id]);
    });

    it("listMovements returns movements for an item in chronological order", () => {
      const item = svc.createStockItem({ sku: "A", name: "A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 10, actorId: ACTOR });
      svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -3, reason: "x", actorId: ACTOR });
      const movements = svc.listMovements(item.id);
      expect(movements.map((m) => m.qty_delta)).toEqual([10, -3]);
    });

    it("applyReceipt tags movement with PO_RECEIPT and source_id", () => {
      const item = svc.createStockItem({ sku: "A", name: "A", actorId: ACTOR });
      svc.applyReceipt({ stockItemId: item.id, qty: 7, sourceId: "po-line-42", actorId: ACTOR });
      const movements = svc.listMovements(item.id);
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({
        qty_delta: 7,
        source_type: "PO_RECEIPT",
        source_id: "po-line-42",
      });
    });

    it("rolls back movement + on_hand if audit.append throws (R-2: every state change → audit row)", () => {
      const item = svc.createStockItem({ sku: "ROLLBACK", name: "Rollback test", actorId: ACTOR });
      const originalAppend = audit.append.bind(audit);
      let calls = 0;
      audit.append = (e) => {
        calls += 1;
        // first call (item created above) succeeded; fail on the receipt's audit append
        if (calls > 0 && e.action === "STOCK_RECEIVED") {
          throw new Error("simulated audit storage failure");
        }
        return originalAppend(e);
      };
      expect(() =>
        svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR })
      ).toThrow("simulated audit storage failure");

      // Restore
      audit.append = originalAppend;

      // Stock and movement must NOT have been persisted
      expect(svc.getStockItem(item.id)?.on_hand_qty).toBe(0);
      expect(svc.listMovements(item.id)).toHaveLength(0);
      // audit_log only has the original CREATE row
      const rows = audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
      expect(rows.map((r) => r.action)).toEqual(["STOCK_ITEM_CREATED"]);
    });
  });
});
