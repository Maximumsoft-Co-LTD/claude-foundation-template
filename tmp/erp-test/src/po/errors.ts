import { DomainError } from "../inventory/errors.js";
export {
  DomainError,
  ValidationError,
  StockItemNotFoundError,
} from "../inventory/errors.js";

export class IllegalTransitionError extends DomainError {
  constructor(currentStatus: string, attempted: string) {
    super(
      "ILLEGAL_TRANSITION",
      `PO is ${currentStatus} — ${attempted} is not allowed`
    );
  }
}

export class PONotFoundError extends DomainError {
  constructor(poId: number) {
    super("PO_NOT_FOUND", `Purchase order not found: id=${poId}`);
  }
}
