-- ERP-test schema. Idempotent — re-runnable via openDb().
-- Owned by SP1-T001 (stock_item, stock_movement, audit_log).
-- SP1-T002 will extend with purchase_order, po_line, po_approval.

CREATE TABLE IF NOT EXISTS stock_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sku           TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  on_hand_qty   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movement (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_item_id  INTEGER NOT NULL REFERENCES stock_item(id),
  qty_delta      INTEGER NOT NULL,
  reason         TEXT,
  source_type    TEXT NOT NULL,
  source_id      TEXT,
  actor_id       TEXT NOT NULL,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_movement_item_created
  ON stock_movement(stock_item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  action        TEXT NOT NULL,
  payload_json  TEXT,
  actor_id      TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_created
  ON audit_log(entity_type, entity_id, created_at DESC);

-- SP1-T002: purchase orders
CREATE TABLE IF NOT EXISTS purchase_order (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  status        TEXT NOT NULL,
  total_thb     INTEGER NOT NULL,
  supplier_name TEXT NOT NULL,
  requested_by  TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchase_order_status_created
  ON purchase_order(status, created_at DESC);

CREATE TABLE IF NOT EXISTS po_line (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id           INTEGER NOT NULL REFERENCES purchase_order(id),
  stock_item_id   INTEGER NOT NULL REFERENCES stock_item(id),
  qty             INTEGER NOT NULL,
  unit_price_thb  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_po_line_po ON po_line(po_id);

CREATE TABLE IF NOT EXISTS po_approval (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id       INTEGER NOT NULL REFERENCES purchase_order(id),
  decision    TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  note        TEXT,
  approved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_po_approval_po
  ON po_approval(po_id, approved_at DESC);
