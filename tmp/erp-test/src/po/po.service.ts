import type { Db } from "../db/db.js";
import type { AuditLogger } from "../audit/audit.service.js";
import type { InventoryService } from "../inventory/inventory.service.js";
import { APPROVAL_THRESHOLD_THB } from "./config.js";
import {
  IllegalTransitionError,
  PONotFoundError,
  ValidationError,
  StockItemNotFoundError,
} from "./errors.js";

export type POStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "RECEIVED";

export interface PurchaseOrder {
  id: number;
  status: POStatus;
  total_thb: number;
  supplier_name: string;
  requested_by: string;
  created_at: string;
  updated_at: string;
}

export interface POLine {
  id: number;
  po_id: number;
  stock_item_id: number;
  qty: number;
  unit_price_thb: number;
}

export interface POApproval {
  id: number;
  po_id: number;
  decision: "APPROVED" | "REJECTED";
  approver_id: string;
  note: string | null;
  approved_at: string;
}

export interface CreatePOInput {
  lines: { stockItemId: number; qty: number; unit_price_thb: number }[];
  supplierName: string;
  requestedBy: string;
  actorId: string;
}

export interface ApproveInput {
  poId: number;
  approverId: string;
  note?: string;
}

export interface RejectInput {
  poId: number;
  approverId: string;
  note: string;
}

export interface MarkReceivedInput {
  poId: number;
  actorId: string;
}

const SYSTEM_APPROVER = "SYSTEM";

function nowIso(): string {
  return new Date().toISOString();
}

function requireNonEmpty(field: string, value: unknown, max?: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`, [{ field, message: "must be a string" }]);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${field} is required`, [{ field, message: "is required" }]);
  }
  if (max !== undefined && trimmed.length > max) {
    throw new ValidationError(`${field} too long`, [{ field, message: `must be ≤ ${max}` }]);
  }
  return trimmed;
}

export class PurchaseOrderService {
  private readonly insertPo;
  private readonly insertLine;
  private readonly insertApproval;
  private readonly selectPo;
  private readonly updatePoStatus;
  private readonly listPoStmt;
  private readonly listPendingStmt;
  private readonly listLinesStmt;
  private readonly listApprovalsStmt;
  private readonly selectStockItem;

  constructor(
    private readonly db: Db,
    private readonly audit: AuditLogger,
    private readonly inventory: InventoryService
  ) {
    this.insertPo = db.prepare(
      `INSERT INTO purchase_order (status, total_thb, supplier_name, requested_by, created_at, updated_at)
       VALUES (@status, @total_thb, @supplier_name, @requested_by, @created_at, @updated_at)`
    );
    this.insertLine = db.prepare(
      `INSERT INTO po_line (po_id, stock_item_id, qty, unit_price_thb)
       VALUES (@po_id, @stock_item_id, @qty, @unit_price_thb)`
    );
    this.insertApproval = db.prepare(
      `INSERT INTO po_approval (po_id, decision, approver_id, note, approved_at)
       VALUES (@po_id, @decision, @approver_id, @note, @approved_at)`
    );
    this.selectPo = db.prepare(`SELECT * FROM purchase_order WHERE id = ?`);
    this.updatePoStatus = db.prepare(
      `UPDATE purchase_order SET status = @status, updated_at = @updated_at WHERE id = @id`
    );
    this.listPoStmt = db.prepare(`SELECT * FROM purchase_order ORDER BY id DESC`);
    this.listPendingStmt = db.prepare(
      `SELECT * FROM purchase_order WHERE status = 'PENDING_APPROVAL' ORDER BY created_at ASC`
    );
    this.listLinesStmt = db.prepare(`SELECT * FROM po_line WHERE po_id = ? ORDER BY id ASC`);
    this.listApprovalsStmt = db.prepare(
      `SELECT * FROM po_approval WHERE po_id = ? ORDER BY id ASC`
    );
    this.selectStockItem = db.prepare(`SELECT id FROM stock_item WHERE id = ?`);
  }

  createPO(input: CreatePOInput): PurchaseOrder {
    const supplier = requireNonEmpty("supplierName", input.supplierName, 200);
    const requester = requireNonEmpty("requestedBy", input.requestedBy, 200);
    const actor = requireNonEmpty("actorId", input.actorId);

    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new ValidationError("PO must have at least one line", [{ field: "lines", message: "non-empty" }]);
    }
    for (const [i, line] of input.lines.entries()) {
      if (!Number.isInteger(line.qty) || line.qty <= 0) {
        throw new ValidationError(`line[${i}].qty must be > 0`, [{ field: `lines[${i}].qty`, message: "> 0" }]);
      }
      if (!Number.isInteger(line.unit_price_thb) || line.unit_price_thb <= 0) {
        throw new ValidationError(`line[${i}].unit_price_thb must be > 0`, [
          { field: `lines[${i}].unit_price_thb`, message: "> 0" },
        ]);
      }
    }
    const total_thb = input.lines.reduce((sum, l) => sum + l.qty * l.unit_price_thb, 0);

    const ts = nowIso();
    const txn = this.db.transaction((): PurchaseOrder => {
      // Verify each stockItemId exists
      for (const line of input.lines) {
        const found = this.selectStockItem.get(line.stockItemId);
        if (!found) throw new StockItemNotFoundError(line.stockItemId);
      }
      const initialStatus: POStatus = total_thb < APPROVAL_THRESHOLD_THB ? "APPROVED" : "PENDING_APPROVAL";
      const result = this.insertPo.run({
        status: initialStatus,
        total_thb,
        supplier_name: supplier,
        requested_by: requester,
        created_at: ts,
        updated_at: ts,
      });
      const poId = Number(result.lastInsertRowid);
      for (const line of input.lines) {
        this.insertLine.run({
          po_id: poId,
          stock_item_id: line.stockItemId,
          qty: line.qty,
          unit_price_thb: line.unit_price_thb,
        });
      }
      this.audit.append({
        entity_type: "purchase_order",
        entity_id: String(poId),
        action: "PO_CREATED",
        payload: {
          total_thb,
          supplier: supplier,
          line_count: input.lines.length,
        },
        actor_id: actor,
      });
      if (initialStatus === "APPROVED") {
        this.insertApproval.run({
          po_id: poId,
          decision: "APPROVED",
          approver_id: SYSTEM_APPROVER,
          note: null,
          approved_at: ts,
        });
        this.audit.append({
          entity_type: "purchase_order",
          entity_id: String(poId),
          action: "PO_AUTO_APPROVED",
          payload: { reason: "total below threshold", threshold_thb: APPROVAL_THRESHOLD_THB },
          actor_id: actor,
        });
      }
      return this.selectPo.get(poId) as PurchaseOrder;
    });
    return txn();
  }

  approvePO(input: ApproveInput): PurchaseOrder {
    const approverId = requireNonEmpty("approverId", input.approverId);
    const txn = this.db.transaction((): PurchaseOrder => {
      const po = this.selectPo.get(input.poId) as PurchaseOrder | undefined;
      if (!po) throw new PONotFoundError(input.poId);
      if (po.status !== "PENDING_APPROVAL") {
        throw new IllegalTransitionError(po.status, "approve");
      }
      const ts = nowIso();
      this.updatePoStatus.run({ status: "APPROVED", updated_at: ts, id: input.poId });
      this.insertApproval.run({
        po_id: input.poId,
        decision: "APPROVED",
        approver_id: approverId,
        note: input.note ?? null,
        approved_at: ts,
      });
      this.audit.append({
        entity_type: "purchase_order",
        entity_id: String(input.poId),
        action: "PO_APPROVED",
        payload: { approver_id: approverId, note: input.note ?? null },
        actor_id: approverId,
      });
      return this.selectPo.get(input.poId) as PurchaseOrder;
    });
    return txn();
  }

  rejectPO(input: RejectInput): PurchaseOrder {
    const approverId = requireNonEmpty("approverId", input.approverId);
    const note = requireNonEmpty("note", input.note, 500);
    const txn = this.db.transaction((): PurchaseOrder => {
      const po = this.selectPo.get(input.poId) as PurchaseOrder | undefined;
      if (!po) throw new PONotFoundError(input.poId);
      if (po.status !== "PENDING_APPROVAL") {
        throw new IllegalTransitionError(po.status, "reject");
      }
      const ts = nowIso();
      this.updatePoStatus.run({ status: "REJECTED", updated_at: ts, id: input.poId });
      this.insertApproval.run({
        po_id: input.poId,
        decision: "REJECTED",
        approver_id: approverId,
        note,
        approved_at: ts,
      });
      this.audit.append({
        entity_type: "purchase_order",
        entity_id: String(input.poId),
        action: "PO_REJECTED",
        payload: { approver_id: approverId, note },
        actor_id: approverId,
      });
      return this.selectPo.get(input.poId) as PurchaseOrder;
    });
    return txn();
  }

  markReceived(input: MarkReceivedInput): PurchaseOrder {
    const actor = requireNonEmpty("actorId", input.actorId);
    const txn = this.db.transaction((): PurchaseOrder => {
      const po = this.selectPo.get(input.poId) as PurchaseOrder | undefined;
      if (!po) throw new PONotFoundError(input.poId);
      if (po.status !== "APPROVED") {
        throw new IllegalTransitionError(po.status, "markReceived");
      }
      const lines = this.listLinesStmt.all(input.poId) as POLine[];
      for (const line of lines) {
        // applyReceipt writes a stock_movement + audit row; runs inside the same outer txn
        this.inventory.applyReceipt({
          stockItemId: line.stock_item_id,
          qty: line.qty,
          sourceId: String(line.id),
          actorId: actor,
        });
      }
      const ts = nowIso();
      this.updatePoStatus.run({ status: "RECEIVED", updated_at: ts, id: input.poId });
      this.audit.append({
        entity_type: "purchase_order",
        entity_id: String(input.poId),
        action: "PO_RECEIVED",
        payload: { line_count: lines.length },
        actor_id: actor,
      });
      return this.selectPo.get(input.poId) as PurchaseOrder;
    });
    return txn();
  }

  getPO(id: number): PurchaseOrder | null {
    const row = this.selectPo.get(id) as PurchaseOrder | undefined;
    return row ?? null;
  }

  listAll(): PurchaseOrder[] {
    return this.listPoStmt.all() as PurchaseOrder[];
  }

  listPendingApproval(): PurchaseOrder[] {
    return this.listPendingStmt.all() as PurchaseOrder[];
  }

  listLines(poId: number): POLine[] {
    return this.listLinesStmt.all(poId) as POLine[];
  }

  listApprovals(poId: number): POApproval[] {
    return this.listApprovalsStmt.all(poId) as POApproval[];
  }
}
