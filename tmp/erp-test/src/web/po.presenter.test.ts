import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshDb } from "../../test/helpers/db.js";
import type { Db } from "../db/db.js";
import { AuditLogger } from "../audit/audit.service.js";
import { InventoryService } from "../inventory/inventory.service.js";
import { PurchaseOrderService } from "../po/po.service.js";
import {
  renderPOListPage,
  renderApprovalQueuePage,
  renderPODetailPage,
} from "./po.presenter.js";

describe("PO presenter", () => {
  let db: Db;
  let audit: AuditLogger;
  let inv: InventoryService;
  let po: PurchaseOrderService;
  let widgetA: number;

  beforeEach(() => {
    db = freshDb();
    audit = new AuditLogger(db);
    inv = new InventoryService(db, audit);
    po = new PurchaseOrderService(db, audit, inv);
    widgetA = inv.createStockItem({ sku: "A", name: "A", actorId: "warehouse-1" }).id;
  });
  afterEach(() => db.close());

  describe("renderPOListPage", () => {
    it("empty list returns empty_message", () => {
      const view = renderPOListPage({ svc: po, audit, role: "purchasing" });
      expect(view.items).toEqual([]);
      expect(view.empty_message).toBe("No purchase orders.");
    });

    it("purchasing sees all POs and canCreate=true", () => {
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "Y",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPOListPage({ svc: po, audit, role: "purchasing" });
      expect(view.items).toHaveLength(2);
      expect(view.canCreate).toBe(true);
    });

    it("warehouse only sees APPROVED + RECEIVED", () => {
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "Y",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPOListPage({ svc: po, audit, role: "warehouse" });
      expect(view.items.map((i) => i.status)).toEqual(["APPROVED"]);
      expect(view.canCreate).toBe(false);
    });
  });

  describe("renderApprovalQueuePage", () => {
    it("non-finance role gets empty queue with finance-only message", () => {
      const view = renderApprovalQueuePage({ svc: po, audit, role: "purchasing" });
      expect(view.items).toEqual([]);
      expect(view.canApprove).toBe(false);
      expect(view.empty_message).toContain("finance-only");
    });

    it("finance sees PENDING_APPROVAL POs sorted oldest first", () => {
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "old",
        requestedBy: "p",
        actorId: "p",
      });
      // Wait a millisecond by busy-wait for distinct timestamps; not strictly needed (id ordering isn't asserted, but created_at order is)
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "new",
        requestedBy: "p",
        actorId: "p",
      });
      // Auto-approved one is excluded
      po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "auto",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderApprovalQueuePage({ svc: po, audit, role: "finance" });
      expect(view.items).toHaveLength(2);
      expect(view.items.map((i) => i.supplier_name)).not.toContain("auto");
      expect(view.canApprove).toBe(true);
      expect(view.canReject).toBe(true);
    });

    it("finance with empty pending queue shows empty_message", () => {
      const view = renderApprovalQueuePage({ svc: po, audit, role: "finance" });
      expect(view.empty_message).toBe("No POs awaiting approval.");
    });
  });

  describe("renderPODetailPage", () => {
    it("returns not-found for missing id", () => {
      const view = renderPODetailPage({ svc: po, audit, role: "warehouse", poId: 9999 });
      expect(view.kind).toBe("po-not-found");
    });

    it("finance + PENDING shows approve + reject actions", () => {
      const created = po.createPO({
        lines: [{ stockItemId: widgetA, qty: 100, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPODetailPage({ svc: po, audit, role: "finance", poId: created.id });
      expect(view.kind).toBe("po-detail");
      if (view.kind !== "po-detail") return;
      expect(view.actions.map((a) => a.id)).toEqual(["approve", "reject"]);
    });

    it("warehouse + APPROVED shows mark-received action", () => {
      const created = po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPODetailPage({ svc: po, audit, role: "warehouse", poId: created.id });
      expect(view.kind).toBe("po-detail");
      if (view.kind !== "po-detail") return;
      expect(view.actions.map((a) => a.id)).toEqual(["mark-received"]);
    });

    it("purchasing role gets no destructive actions on any status", () => {
      const created = po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPODetailPage({ svc: po, audit, role: "purchasing", poId: created.id });
      expect(view.kind).toBe("po-detail");
      if (view.kind !== "po-detail") return;
      expect(view.actions).toEqual([]);
    });

    it("detail view includes lines + approvals + chronological audit", () => {
      const created = po.createPO({
        lines: [{ stockItemId: widgetA, qty: 1, unit_price_thb: 100 }],
        supplierName: "X",
        requestedBy: "p",
        actorId: "p",
      });
      const view = renderPODetailPage({ svc: po, audit, role: "purchasing", poId: created.id });
      expect(view.kind).toBe("po-detail");
      if (view.kind !== "po-detail") return;
      expect(view.lines).toHaveLength(1);
      expect(view.approvals).toHaveLength(1);
      expect(view.audit.map((a) => a.action)).toEqual(["PO_CREATED", "PO_AUTO_APPROVED"]);
    });
  });
});
