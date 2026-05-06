import type {
  PurchaseOrderService,
  PurchaseOrder,
  POLine,
  POApproval,
  POStatus,
} from "../po/po.service.js";
import type { AuditLogger, AuditEntry } from "../audit/audit.service.js";
import type { Role, ActionLink } from "./inventory.presenter.js";

export interface POListView {
  kind: "po-list";
  items: Array<{ id: number; status: POStatus; total_thb: number; supplier_name: string }>;
  canCreate: boolean;
  empty_message?: string;
}

export interface ApprovalQueueView {
  kind: "approval-queue";
  items: Array<{ id: number; total_thb: number; supplier_name: string; created_at: string }>;
  canApprove: boolean;
  canReject: boolean;
  empty_message?: string;
}

export interface PODetailView {
  kind: "po-detail";
  po: PurchaseOrder;
  lines: POLine[];
  approvals: POApproval[];
  audit: AuditEntry[];
  actions: ActionLink[];
}

export interface PONotFoundView {
  kind: "po-not-found";
  message: string;
}

export interface POPresenterDeps {
  svc: PurchaseOrderService;
  audit: AuditLogger;
  role: Role;
}

export function renderPOListPage(deps: POPresenterDeps): POListView {
  const all = deps.svc.listAll();
  const filtered = all.filter((po) => {
    if (deps.role === "warehouse") return po.status === "APPROVED" || po.status === "RECEIVED";
    return true; // purchasing + finance see all
  });
  const items = filtered.map((p) => ({
    id: p.id,
    status: p.status,
    total_thb: p.total_thb,
    supplier_name: p.supplier_name,
  }));
  return {
    kind: "po-list",
    items,
    canCreate: deps.role === "purchasing",
    empty_message: items.length === 0 ? "No purchase orders." : undefined,
  };
}

export function renderApprovalQueuePage(deps: POPresenterDeps): ApprovalQueueView {
  if (deps.role !== "finance") {
    return {
      kind: "approval-queue",
      items: [],
      canApprove: false,
      canReject: false,
      empty_message: "Approval queue is finance-only.",
    };
  }
  const pending = deps.svc.listPendingApproval();
  return {
    kind: "approval-queue",
    items: pending.map((p) => ({
      id: p.id,
      total_thb: p.total_thb,
      supplier_name: p.supplier_name,
      created_at: p.created_at,
    })),
    canApprove: true,
    canReject: true,
    empty_message: pending.length === 0 ? "No POs awaiting approval." : undefined,
  };
}

export function renderPODetailPage(
  deps: POPresenterDeps & { poId: number }
): PODetailView | PONotFoundView {
  const po = deps.svc.getPO(deps.poId);
  if (!po) return { kind: "po-not-found", message: "Purchase order not found" };
  const lines = deps.svc.listLines(po.id);
  const approvals = deps.svc.listApprovals(po.id);
  const audit = deps.audit.list({ entity_type: "purchase_order", entity_id: String(po.id) });

  const actions: ActionLink[] = [];
  if (deps.role === "finance" && po.status === "PENDING_APPROVAL") {
    actions.push({ id: "approve", label: "Approve" });
    actions.push({ id: "reject", label: "Reject (requires note)" });
  }
  if (deps.role === "warehouse" && po.status === "APPROVED") {
    actions.push({ id: "mark-received", label: "Mark Received" });
  }
  return { kind: "po-detail", po, lines, approvals, audit, actions };
}
