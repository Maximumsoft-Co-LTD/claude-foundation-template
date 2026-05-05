import type { Db } from "../db/db.js";

export type EntityType =
  | "stock_item"
  | "stock_movement"
  | "purchase_order"
  | "po_line"
  | "po_approval";

export interface AuditEntryInput {
  entity_type: EntityType;
  entity_id: string;
  action: string;
  payload: Record<string, unknown>;
  actor_id: string;
}

export interface AuditEntry {
  id: number;
  entity_type: EntityType;
  entity_id: string;
  action: string;
  payload: Record<string, unknown>;
  actor_id: string;
  created_at: string;
}

export interface AuditFilter {
  entity_type?: EntityType;
  entity_id?: string;
}

interface AuditRow {
  id: number;
  entity_type: EntityType;
  entity_id: string;
  action: string;
  payload_json: string | null;
  actor_id: string;
  created_at: string;
}

export class AuditLogger {
  private readonly insertStmt;
  constructor(private readonly db: Db) {
    this.insertStmt = db.prepare(
      `INSERT INTO audit_log (entity_type, entity_id, action, payload_json, actor_id, created_at)
       VALUES (@entity_type, @entity_id, @action, @payload_json, @actor_id, @created_at)`
    );
  }

  append(entry: AuditEntryInput): void {
    this.insertStmt.run({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      payload_json: JSON.stringify(entry.payload),
      actor_id: entry.actor_id,
      created_at: new Date().toISOString(),
    });
  }

  list(filter: AuditFilter = {}): AuditEntry[] {
    const where: string[] = [];
    const params: Record<string, string> = {};
    if (filter.entity_type !== undefined) {
      where.push("entity_type = @entity_type");
      params.entity_type = filter.entity_type;
    }
    if (filter.entity_id !== undefined) {
      where.push("entity_id = @entity_id");
      params.entity_id = filter.entity_id;
    }
    const sql =
      `SELECT id, entity_type, entity_id, action, payload_json, actor_id, created_at
       FROM audit_log` +
      (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      ` ORDER BY id ASC`;
    const rows = this.db.prepare(sql).all(params) as AuditRow[];
    return rows.map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      action: r.action,
      payload: r.payload_json ? (JSON.parse(r.payload_json) as Record<string, unknown>) : {},
      actor_id: r.actor_id,
      created_at: r.created_at,
    }));
  }
}
