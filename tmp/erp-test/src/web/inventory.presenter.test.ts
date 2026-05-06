import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDb } from "../../test/helpers/db.js";
import type { Db } from "../db/db.js";
import { AuditLogger } from "../audit/audit.service.js";
import { InventoryService } from "../inventory/inventory.service.js";
import { renderStockListPage, renderStockDetailPage } from "./inventory.presenter.js";

const ACTOR = "warehouse-1";

describe("inventory presenter", () => {
  let db: Db;
  let audit: AuditLogger;
  let svc: InventoryService;

  beforeEach(() => {
    db = freshDb();
    audit = new AuditLogger(db);
    svc = new InventoryService(db, audit);
  });
  afterEach(() => db.close());

  describe("renderStockListPage", () => {
    it("returns empty list view-model with empty_message when DB is empty", () => {
      const view = renderStockListPage({ svc, audit, role: "warehouse" });
      expect(view.kind).toBe("list");
      expect(view.items).toEqual([]);
      expect(view.empty_message).toContain("No stock items");
    });

    it("returns items with current on_hand_qty after a receipt", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      const view = renderStockListPage({ svc, audit, role: "warehouse" });
      expect(view.items).toHaveLength(1);
      expect(view.items[0]).toMatchObject({ sku: "WIDGET-A", on_hand_qty: 50 });
      expect(view.empty_message).toBeUndefined();
    });

    it("warehouse role gets canCreate=true and the create action", () => {
      const view = renderStockListPage({ svc, audit, role: "warehouse" });
      expect(view.canCreate).toBe(true);
      expect(view.canRecordMovement).toBe(true);
      expect(view.actions.map((a) => a.id)).toContain("create-sku");
    });

    it("purchasing role gets canCreate=false and no create action", () => {
      const view = renderStockListPage({ svc, audit, role: "purchasing" });
      expect(view.canCreate).toBe(false);
      expect(view.canRecordMovement).toBe(false);
      expect(view.actions).toEqual([]);
    });

    it("finance role gets canCreate=false", () => {
      const view = renderStockListPage({ svc, audit, role: "finance" });
      expect(view.canCreate).toBe(false);
    });
  });

  describe("renderStockDetailPage", () => {
    it("returns not-found view-model for missing id", () => {
      const view = renderStockDetailPage({ svc, audit, role: "warehouse", stockItemId: 9999 });
      expect(view.kind).toBe("not-found");
      if (view.kind === "not-found") {
        expect(view.message).toContain("not found");
      }
    });

    it("returns item + movements + audit log for existing id", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      svc.recordReceipt({ stockItemId: item.id, qty: 50, actorId: ACTOR });
      svc.recordAdjustment({ stockItemId: item.id, qtyDelta: -10, reason: "damage", actorId: ACTOR });

      const view = renderStockDetailPage({ svc, audit, role: "warehouse", stockItemId: item.id });
      expect(view.kind).toBe("detail");
      if (view.kind !== "detail") return;

      expect(view.item.sku).toBe("WIDGET-A");
      expect(view.item.on_hand_qty).toBe(40);
      expect(view.movements.map((m) => m.qty_delta)).toEqual([50, -10]);
      expect(view.audit.map((a) => a.action)).toEqual([
        "STOCK_ITEM_CREATED",
        "STOCK_RECEIVED",
        "STOCK_ADJUSTED",
      ]);
      expect(view.actions.map((a) => a.id)).toEqual(["record-receipt", "record-adjustment"]);
    });

    it("non-warehouse role on detail page gets no actions", () => {
      const item = svc.createStockItem({ sku: "WIDGET-A", name: "Widget A", actorId: ACTOR });
      const view = renderStockDetailPage({ svc, audit, role: "finance", stockItemId: item.id });
      expect(view.kind).toBe("detail");
      if (view.kind !== "detail") return;
      expect(view.actions).toEqual([]);
      expect(view.canRecordMovement).toBe(false);
    });
  });
});
