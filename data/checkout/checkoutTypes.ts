import { Database } from '@/database.types';

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
    // TODO: Add paymentIntentId: string | null to ProcessCheckoutResult interface for tracking Stripe transaction state.
    readonly error: string | null;
}

export type OrderDetailsRow = Database['public']['Tables']['orders']['Row'];
export type DiscountRow = Database['public']['Tables']['discounts']['Row'];

export interface ProcessCheckoutParams {
    readonly userId: string;
    readonly items: readonly { readonly bookId: string; readonly quantity: number }[];
    readonly discountId: string | null;
    readonly paymentMethod: string;
    readonly idempotencyKey: string;
    // TODO: Add stripeCustomerId?: string to ProcessCheckoutParams if associating existing Stripe Customers.
}

export interface ProcessOrderPayloadItem {
    readonly book_id: string;
    readonly quantity: number;
    readonly price: number;
}

export interface ProcessOrderPayload {
    readonly user_id: string;
    readonly total_amount: number;
    readonly payment_method: string;
    readonly discount_id: string | null;
    readonly items: readonly ProcessOrderPayloadItem[];
}
