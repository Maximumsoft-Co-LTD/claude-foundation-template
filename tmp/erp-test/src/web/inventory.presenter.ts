import type { InventoryService, StockItem, StockMovement } from "../inventory/inventory.service.js";
import type { AuditLogger, AuditEntry } from "../audit/audit.service.js";

export type Role = "warehouse" | "purchasing" | "finance";

export interface ActionLink {
  id: string;
  label: string;
}

export interface StockListView {
  kind: "list";
  items: Array<{ id: number; sku: string; name: string; on_hand_qty: number }>;
  canCreate: boolean;
  canRecordMovement: boolean;
  actions: ActionLink[];
  empty_message?: string;
}

export interface StockDetailView {
  kind: "detail";
  item: StockItem;
  movements: StockMovement[];
  audit: AuditEntry[];
  canRecordMovement: boolean;
  actions: ActionLink[];
}

export interface NotFoundView {
  kind: "not-found";
  message: string;
}

export interface PresenterDeps {
  svc: InventoryService;
  audit: AuditLogger;
  role: Role;
}

export function renderStockListPage(deps: PresenterDeps): StockListView {
  const items = deps.svc.listStock().map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    on_hand_qty: i.on_hand_qty,
  }));
  const canCreate = deps.role === "warehouse";
  const canRecordMovement = deps.role === "warehouse";
  const actions: ActionLink[] = canCreate ? [{ id: "create-sku", label: "Register SKU" }] : [];
  return {
    kind: "list",
    items,
    canCreate,
    canRecordMovement,
    actions,
    empty_message: items.length === 0 ? "No stock items yet — register one above." : undefined,
  };
}

export function renderStockDetailPage(
  deps: PresenterDeps & { stockItemId: number }
): StockDetailView | NotFoundView {
  const item = deps.svc.getStockItem(deps.stockItemId);
  if (!item) {
    return { kind: "not-found", message: "Stock item not found" };
  }
  const movements = deps.svc.listMovements(item.id);
  const audit = deps.audit.list({ entity_type: "stock_item", entity_id: String(item.id) });
  const canRecordMovement = deps.role === "warehouse";
  const actions: ActionLink[] = canRecordMovement
    ? [
        { id: "record-receipt", label: "Record receipt" },
        { id: "record-adjustment", label: "Record adjustment" },
      ]
    : [];
  return { kind: "detail", item, movements, audit, canRecordMovement, actions };
}
