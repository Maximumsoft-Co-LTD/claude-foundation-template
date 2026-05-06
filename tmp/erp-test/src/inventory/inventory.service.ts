import type { Db } from "../db/db.js";
import type { AuditLogger } from "../audit/audit.service.js";
import {
  DuplicateSkuError,
  InvalidQtyError,
  NegativeStockError,
  StockItemNotFoundError,
  ValidationError,
} from "./errors.js";

export interface StockItem {
  id: number;
  sku: string;
  name: string;
  on_hand_qty: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  stock_item_id: number;
  qty_delta: number;
  reason: string | null;
  source_type: "RECEIPT" | "ADJUSTMENT" | "PO_RECEIPT";
  source_id: string | null;
  actor_id: string;
  created_at: string;
}

export interface CreateStockItemInput {
  sku: string;
  name: string;
  actorId: string;
}

export interface RecordReceiptInput {
  stockItemId: number;
  qty: number;
  actorId: string;
  sourceType?: "RECEIPT" | "PO_RECEIPT";
  sourceId?: string;
}

export interface RecordAdjustmentInput {
  stockItemId: number;
  qtyDelta: number;
  reason: string;
  actorId: string;
}

export interface ApplyReceiptInput {
  stockItemId: number;
  qty: number;
  sourceId: string;
  actorId: string;
}

const SKU_MAX = 64;
const NAME_MAX = 200;
const REASON_MAX = 200;

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
    throw new ValidationError(`${field} too long (max ${max})`, [
      { field, message: `must be ≤ ${max} chars` },
    ]);
  }
  return trimmed;
}

export class InventoryService {
  private readonly insertItem;
  private readonly selectItemById;
  private readonly selectItemBySku;
  private readonly insertMovement;
  private readonly updateOnHand;
  private readonly listItemsStmt;
  private readonly listMovementsStmt;

  constructor(private readonly db: Db, private readonly audit: AuditLogger) {
    this.insertItem = db.prepare(
      `INSERT INTO stock_item (sku, name, on_hand_qty, created_at, updated_at)
       VALUES (@sku, @name, 0, @created_at, @updated_at)`
    );
    this.selectItemById = db.prepare(`SELECT * FROM stock_item WHERE id = ?`);
    this.selectItemBySku = db.prepare(`SELECT * FROM stock_item WHERE sku = ?`);
    this.insertMovement = db.prepare(
      `INSERT INTO stock_movement (stock_item_id, qty_delta, reason, source_type, source_id, actor_id, created_at)
       VALUES (@stock_item_id, @qty_delta, @reason, @source_type, @source_id, @actor_id, @created_at)`
    );
    this.updateOnHand = db.prepare(
      `UPDATE stock_item SET on_hand_qty = on_hand_qty + @delta, updated_at = @updated_at WHERE id = @id`
    );
    this.listItemsStmt = db.prepare(`SELECT * FROM stock_item ORDER BY id DESC`);
    this.listMovementsStmt = db.prepare(
      `SELECT * FROM stock_movement WHERE stock_item_id = ? ORDER BY id ASC`
    );
  }

  createStockItem(input: CreateStockItemInput): StockItem {
    const sku = requireNonEmpty("sku", input.sku, SKU_MAX);
    const name = requireNonEmpty("name", input.name, NAME_MAX);
    const actorId = requireNonEmpty("actorId", input.actorId);

    const created_at = nowIso();
    const txn = this.db.transaction((): StockItem => {
      const existing = this.selectItemBySku.get(sku) as StockItem | undefined;
      if (existing) throw new DuplicateSkuError(sku);
      const result = this.insertItem.run({ sku, name, created_at, updated_at: created_at });
      const id = Number(result.lastInsertRowid);
      const item = this.selectItemById.get(id) as StockItem;
      this.audit.append({
        entity_type: "stock_item",
        entity_id: String(id),
        action: "STOCK_ITEM_CREATED",
        payload: { sku, name },
        actor_id: actorId,
      });
      return item;
    });
    return txn();
  }

  recordReceipt(input: RecordReceiptInput): StockMovement {
    const actorId = requireNonEmpty("actorId", input.actorId);
    if (!Number.isInteger(input.qty) || input.qty <= 0) {
      throw new InvalidQtyError("Receipt quantity must be a positive integer");
    }
    const sourceType = input.sourceType ?? "RECEIPT";
    return this.appendMovement({
      stockItemId: input.stockItemId,
      qtyDelta: input.qty,
      reason: null,
      sourceType,
      sourceId: input.sourceId ?? null,
      actorId,
      auditAction: "STOCK_RECEIVED",
    });
  }

  recordAdjustment(input: RecordAdjustmentInput): StockMovement {
    const actorId = requireNonEmpty("actorId", input.actorId);
    const reason = requireNonEmpty("reason", input.reason, REASON_MAX);
    if (!Number.isInteger(input.qtyDelta) || input.qtyDelta === 0) {
      throw new InvalidQtyError("Adjustment qtyDelta must be a non-zero integer");
    }
    return this.appendMovement({
      stockItemId: input.stockItemId,
      qtyDelta: input.qtyDelta,
      reason,
      sourceType: "ADJUSTMENT",
      sourceId: null,
      actorId,
      auditAction: "STOCK_ADJUSTED",
    });
  }

  applyReceipt(input: ApplyReceiptInput): StockMovement {
    const sourceId = requireNonEmpty("sourceId", input.sourceId);
    return this.recordReceipt({
      stockItemId: input.stockItemId,
      qty: input.qty,
      actorId: input.actorId,
      sourceType: "PO_RECEIPT",
      sourceId,
    });
  }

  getStockItem(id: number): StockItem | null {
    const row = this.selectItemById.get(id) as StockItem | undefined;
    return row ?? null;
  }

  listStock(): StockItem[] {
    return this.listItemsStmt.all() as StockItem[];
  }

  listMovements(stockItemId: number): StockMovement[] {
    return this.listMovementsStmt.all(stockItemId) as StockMovement[];
  }

  private appendMovement(opts: {
    stockItemId: number;
    qtyDelta: number;
    reason: string | null;
    sourceType: "RECEIPT" | "ADJUSTMENT" | "PO_RECEIPT";
    sourceId: string | null;
    actorId: string;
    auditAction: string;
  }): StockMovement {
    // Wrap SELECT-current, INSERT movement, UPDATE on_hand, and audit.append in ONE
    // transaction so that R-2 (every state change → audit row) holds atomically.
    // If audit.append throws, the entire mutation rolls back.
    const created_at = nowIso();
    const txn = this.db.transaction((): StockMovement => {
      const item = this.selectItemById.get(opts.stockItemId) as StockItem | undefined;
      if (!item) throw new StockItemNotFoundError(opts.stockItemId);
      const newOnHand = item.on_hand_qty + opts.qtyDelta;
      if (newOnHand < 0) throw new NegativeStockError(item.on_hand_qty);

      const result = this.insertMovement.run({
        stock_item_id: opts.stockItemId,
        qty_delta: opts.qtyDelta,
        reason: opts.reason,
        source_type: opts.sourceType,
        source_id: opts.sourceId,
        actor_id: opts.actorId,
        created_at,
      });
      this.updateOnHand.run({
        delta: opts.qtyDelta,
        updated_at: created_at,
        id: opts.stockItemId,
      });
      const movementId = Number(result.lastInsertRowid);
      const movement = this.db
        .prepare(`SELECT * FROM stock_movement WHERE id = ?`)
        .get(movementId) as StockMovement;

      this.audit.append({
        entity_type: "stock_item",
        entity_id: String(opts.stockItemId),
        action: opts.auditAction,
        payload: {
          movement_id: movementId,
          qty_delta: opts.qtyDelta,
          reason: opts.reason,
          source_type: opts.sourceType,
          source_id: opts.sourceId,
        },
        actor_id: opts.actorId,
      });
      return movement;
    });
    return txn();
  }
}
