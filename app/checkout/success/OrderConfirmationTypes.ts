export interface EvaluatedDiscount {
    readonly id: string;
    readonly code: string;
    readonly amount: number;
}

export interface OrderTotals {
    readonly subtotal: number;
    readonly discountTotal: number;
    readonly shippingCost: number;
    readonly grandTotal: number;
    readonly totalItemCount: number;
    readonly evaluatedDiscounts: readonly EvaluatedDiscount[];
}

export interface ShippingAddressInfo {
    readonly recipientName: string;
    readonly addressLines: readonly string[];
}

export interface OrderStatuses {
    readonly paymentStatus: string;
    readonly fulfillmentStatus: string;
}
