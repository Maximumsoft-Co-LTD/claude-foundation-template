import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDb } from "../../test/helpers/db.js";
import type { Db } from "../db/db.js";
import { AuditLogger } from "../audit/audit.service.js";
import { InventoryService } from "../inventory/inventory.service.js";
import { PurchaseOrderService } from "./po.service.js";
import { IllegalTransitionError, PONotFoundError, ValidationError, StockItemNotFoundError } from "./errors.js";

const PURCHASING = "purchasing-1";
const FINANCE = "finance-1";
const WAREHOUSE = "warehouse-1";

function setup(db: Db) {
  const audit = new AuditLogger(db);
  const inv = new InventoryService(db, audit);
  const po = new PurchaseOrderService(db, audit, inv);
  return { audit, inv, po };
}

describe("PurchaseOrderService", () => {
  let db: Db;
  let svc: { audit: AuditLogger; inv: InventoryService; po: PurchaseOrderService };
  let widgetA: number;
  let widgetB: number;

  beforeEach(() => {
    db = freshDb();
    svc = setup(db);
    widgetA = svc.inv.createStockItem({ sku: "A", name: "Widget A", actorId: WAREHOUSE }).id;
    widgetB = svc.inv.createStockItem({ sku: "B", name: "Widget B", actorId: WAREHOUSE }).id;
  });
  afterEach(() => db.close());

  describe("AC-1 — under threshold auto-approves", () => {
    it("createPO total < 5000 returns APPROVED + auto po_approval row", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 10, unit_price_thb: 200 }], // 2000
        supplierName: "ACME",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(po.status).toBe("APPROVED");
      expect(po.total_thb).toBe(2000);
      const approvals = svc.po.listApprovals(po.id);
      expect(approvals).toHaveLength(1);
      expect(approvals[0]).toMatchObject({ decision: "APPROVED", approver_id: "SYSTEM" });
    });

    it("auto-approve writes PO_CREATED then PO_AUTO_APPROVED audit rows", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      const audit = svc.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });
      expect(audit.map((r) => r.action)).toEqual(["PO_CREATED", "PO_AUTO_APPROVED"]);
    });
  });

  describe("AC-2 — at/above threshold goes to PENDING", () => {
    it("createPO at exactly 5000 → PENDING (boundary >=)", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 5000 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(po.status).toBe("PENDING_APPROVAL");
      expect(svc.po.listApprovals(po.id)).toEqual([]);
      const audit = svc.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });
      expect(audit.map((r) => r.action)).toEqual(["PO_CREATED"]);
    });

    it("createPO well above threshold listed in pending queue", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(svc.po.listPendingApproval().map((p) => p.id)).toContain(po.id);
    });
  });

  describe("AC-3 — finance approves", () => {
    it("approvePO transitions PENDING → APPROVED + writes po_approval + audit PO_APPROVED", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      const updated = svc.po.approvePO({ poId: po.id, approverId: FINANCE });
      expect(updated.status).toBe("APPROVED");
      const approvals = svc.po.listApprovals(po.id);
      expect(approvals).toHaveLength(1);
      expect(approvals[0]).toMatchObject({ decision: "APPROVED", approver_id: FINANCE });
      const audit = svc.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });
      expect(audit.map((r) => r.action)).toEqual(["PO_CREATED", "PO_APPROVED"]);
    });
  });

  describe("AC-4 — markReceived increments stock", () => {
    it("APPROVED PO markReceived → RECEIVED + stock += line.qty + STOCK_RECEIVED audit", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 10, unit_price_thb: 200 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      // auto-approved (2000 < 5000)
      svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE });

      const fresh = svc.po.getPO(po.id);
      expect(fresh?.status).toBe("RECEIVED");
      expect(svc.inv.getStockItem(widgetA)?.on_hand_qty).toBe(10);
      const movements = svc.inv.listMovements(widgetA);
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({ source_type: "PO_RECEIPT", qty_delta: 10 });
      const stockAudit = svc.audit.list({ entity_type: "stock_item", entity_id: String(widgetA) });
      expect(stockAudit.map((r) => r.action)).toContain("STOCK_RECEIVED");
      const poAudit = svc.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });
      expect(poAudit.map((r) => r.action)).toContain("PO_RECEIVED");
    });
  });

  describe("AC-5 / AC-6 — illegal transitions", () => {
    it("approvePO on APPROVED throws IllegalTransitionError", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(() => svc.po.approvePO({ poId: po.id, approverId: FINANCE })).toThrow(
        IllegalTransitionError
      );
    });

    it("approvePO on REJECTED throws", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      svc.po.rejectPO({ poId: po.id, approverId: FINANCE, note: "no" });
      expect(() => svc.po.approvePO({ poId: po.id, approverId: FINANCE })).toThrow(
        IllegalTransitionError
      );
    });

    it("markReceived on PENDING_APPROVAL throws", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(() => svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE })).toThrow(
        IllegalTransitionError
      );
    });

    it("markReceived on RECEIVED throws", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE });
      expect(() => svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE })).toThrow(
        IllegalTransitionError
      );
    });

    it("approvePO on missing PO throws PONotFoundError", () => {
      expect(() => svc.po.approvePO({ poId: 9999, approverId: FINANCE })).toThrow(PONotFoundError);
    });
  });

  describe("AC-7 — empty lines / validation", () => {
    it("createPO with empty lines throws ValidationError", () => {
      expect(() =>
        svc.po.createPO({
          lines: [],
          supplierName: "X",
          requestedBy: PURCHASING,
          actorId: PURCHASING,
        })
      ).toThrow(ValidationError);
    });

    it("createPO with line.qty=0 throws ValidationError", () => {
      expect(() =>
        svc.po.createPO({
          lines: [{ stockItemId: widgetA, qty: 0, unit_price_thb: 100 }],
          supplierName: "X",
          requestedBy: PURCHASING,
          actorId: PURCHASING,
        })
      ).toThrow(ValidationError);
    });

    it("createPO with unit_price_thb=0 throws ValidationError", () => {
      expect(() =>
        svc.po.createPO({
          lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 0 }],
          supplierName: "X",
          requestedBy: PURCHASING,
          actorId: PURCHASING,
        })
      ).toThrow(ValidationError);
    });

    it("createPO with unknown stockItemId throws StockItemNotFoundError", () => {
      expect(() =>
        svc.po.createPO({
          lines: [{ stockItemId: 9999, qty: 1, unit_price_thb: 100 }],
          supplierName: "X",
          requestedBy: PURCHASING,
          actorId: PURCHASING,
        })
      ).toThrow(StockItemNotFoundError);
    });
  });

  describe("AC-8 — multi-line markReceived", () => {
    it("multi-line PO increments each item separately", () => {
      const po = svc.po.createPO({
        lines: [
          { stockItemId: widgetA, qty: 5, unit_price_thb: 100 },
          { stockItemId: widgetB, qty: 3, unit_price_thb: 100 },
        ],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE });
      expect(svc.inv.getStockItem(widgetA)?.on_hand_qty).toBe(5);
      expect(svc.inv.getStockItem(widgetB)?.on_hand_qty).toBe(3);
      const aMovements = svc.inv.listMovements(widgetA);
      const bMovements = svc.inv.listMovements(widgetB);
      expect(aMovements).toHaveLength(1);
      expect(bMovements).toHaveLength(1);
      expect(aMovements[0]?.source_type).toBe("PO_RECEIPT");
      expect(bMovements[0]?.source_type).toBe("PO_RECEIPT");
    });
  });

  describe("AC-9 — finance rejects", () => {
    it("rejectPO transitions PENDING → REJECTED + writes po_approval + audit + no stock change", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      const before = svc.inv.getStockItem(widgetA)!.on_hand_qty;
      const updated = svc.po.rejectPO({ poId: po.id, approverId: FINANCE, note: "over budget" });
      expect(updated.status).toBe("REJECTED");
      const approvals = svc.po.listApprovals(po.id);
      expect(approvals[0]).toMatchObject({ decision: "REJECTED", approver_id: FINANCE, note: "over budget" });
      const audit = svc.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });
      expect(audit.map((r) => r.action)).toEqual(["PO_CREATED", "PO_REJECTED"]);
      expect(svc.inv.getStockItem(widgetA)!.on_hand_qty).toBe(before);
    });

    it("rejectPO requires non-empty note", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      expect(() => svc.po.rejectPO({ poId: po.id, approverId: FINANCE, note: "" })).toThrow(
        ValidationError
      );
    });
  });

  describe("AC-10 — PAT-008: audit failure rolls back transition", () => {
    it("audit.append throwing inside createPO rolls back the PO + lines", () => {
      const original = svc.audit.append.bind(svc.audit);
      svc.audit.append = (e) => {
        if (e.action === "PO_CREATED") throw new Error("simulated audit failure");
        return original(e);
      };
      const beforePOs = svc.po.listAll().length;
      expect(() =>
        svc.po.createPO({
          lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
          supplierName: "X",
          requestedBy: PURCHASING,
          actorId: PURCHASING,
        })
      ).toThrow("simulated audit failure");
      svc.audit.append = original;
      expect(svc.po.listAll().length).toBe(beforePOs); // no new PO row
    });

    it("audit.append throwing inside approvePO leaves status unchanged", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      const original = svc.audit.append.bind(svc.audit);
      svc.audit.append = (e) => {
        if (e.action === "PO_APPROVED") throw new Error("audit fail");
        return original(e);
      };
      expect(() => svc.po.approvePO({ poId: po.id, approverId: FINANCE })).toThrow("audit fail");
      svc.audit.append = original;
      expect(svc.po.getPO(po.id)?.status).toBe("PENDING_APPROVAL");
      expect(svc.po.listApprovals(po.id)).toHaveLength(0);
    });

    it("audit.append throwing inside markReceived leaves stock + status unchanged", () => {
      const po = svc.po.createPO({
        lines: [{ stockItemId: widgetA, qty: 10, unit_price_thb: 200 }],
        supplierName: "X",
        requestedBy: PURCHASING,
        actorId: PURCHASING,
      });
      const original = svc.audit.append.bind(svc.audit);
      svc.audit.append = (e) => {
        // fail on the OUTER audit (PO_RECEIVED). The inner STOCK_RECEIVED must also roll back.
        if (e.action === "PO_RECEIVED") throw new Error("audit fail");
        return original(e);
      };
      expect(() => svc.po.markReceived({ poId: po.id, actorId: WAREHOUSE })).toThrow("audit fail");
      svc.audit.append = original;
      expect(svc.po.getPO(po.id)?.status).toBe("APPROVED");
      expect(svc.inv.getStockItem(widgetA)?.on_hand_qty).toBe(0);
      expect(svc.inv.listMovements(widgetA)).toHaveLength(0);
    });
  });
});
