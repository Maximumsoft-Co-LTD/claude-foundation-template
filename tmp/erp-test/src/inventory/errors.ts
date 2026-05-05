export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DuplicateSkuError extends DomainError {
  constructor(sku: string) {
    super("DUPLICATE_SKU", `SKU '${sku}' already exists`);
  }
}

export class InvalidQtyError extends DomainError {
  constructor(message: string) {
    super("INVALID_QTY", message);
  }
}

export class NegativeStockError extends DomainError {
  constructor(currentOnHand: number) {
    super(
      "NEGATIVE_STOCK",
      `Adjustment would make on-hand negative (current: ${currentOnHand})`
    );
  }
}

export class StockItemNotFoundError extends DomainError {
  constructor(stockItemId: number) {
    super("STOCK_ITEM_NOT_FOUND", `Stock item not found: id=${stockItemId}`);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields: { field: string; message: string }[] = []
  ) {
    super("VALIDATION_ERROR", message);
  }
}
