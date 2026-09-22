export interface AppliedDiscountState {
    readonly code: string;
    readonly discountPercent: number;
    readonly discountAmount: number;
    readonly minimumSubtotal: number | null;
}

export interface CheckoutFormValues {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phoneNumber: string;
    readonly streetAddress: string;
    readonly city: string;
    readonly postcode: string;
    readonly country: string;
    readonly paymentMethod: PaymentMethod;
}

export interface CheckoutSummaryTotals {
    readonly subtotal: number;
    readonly discountAmount: number;
    readonly shippingCost: number;
    readonly taxAmount: number;
    readonly grandTotal: number;
}

export interface ProcessCheckoutResult {
    readonly success: boolean;
    readonly orderId: string | null;
    readonly clientSecret: string | null;
    readonly error: string | null;
}
