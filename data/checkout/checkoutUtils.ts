// TODO: Import Stripe SDK (import Stripe from 'stripe';) once 'stripe' npm package is installed.
import { DEFAULT_CURRENCY, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from './CheckoutConstants';
import { AppliedDiscountState, CheckoutSummaryTotals } from './CheckoutTypes';

// TODO: Initialize server-side Stripe instance: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.acacia' });

export interface PaymentIntentResult {
    readonly success: boolean;
    readonly clientSecret: string | null;
    // TODO: Add paymentIntentId: string | null property to PaymentIntentResult interface.
    readonly error: string | null;
}

export function calculateSubtotal(items: ReadonlyArray<CartItem>): number {
    return items.reduce((accumulator: number, item: CartItem): number => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return accumulator + price * quantity;
    }, 0);
}

export function calculateDiscount(subtotal: number, discount: AppliedDiscountState | null): number {
    if (!discount) return 0;
    if (discount.minimumSubtotal !== null && subtotal < discount.minimumSubtotal) return 0;
    if (discount.discountPercent > 0) {
        const calculated = (subtotal * discount.discountPercent) / 100;
        return Math.round(calculated * 100) / 100;
    }
    return Math.min(discount.discountAmount, subtotal);
}

export function calculateShipping(subtotal: number): number {
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function calculateTotals(
    items: ReadonlyArray<CartItem>,
    discount: AppliedDiscountState | null,
    taxRate: number = 0,
): CheckoutSummaryTotals {
    const subtotal = calculateSubtotal(items);
    const discountAmount = calculateDiscount(subtotal, discount);
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const shippingCost = calculateShipping(subtotalAfterDiscount);
    const taxAmount = Math.round(subtotalAfterDiscount * taxRate * 100) / 100;
    const grandTotal = Math.round((subtotalAfterDiscount + shippingCost + taxAmount) * 100) / 100;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount,
        shippingCost,
        taxAmount,
        grandTotal,
    };
}

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character: string): string => {
        const randomValue = (Math.random() * 16) | 0;
        const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
        return value.toString(16);
    });
}

export async function createPaymentIntentAction(
    totalAmountInCents: number,
    idempotencyKey: string,
    currency: string = DEFAULT_CURRENCY,
): Promise<PaymentIntentResult> {
    // TODO: Replace mock return object below with actual stripe.paymentIntents.create call:
    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: totalAmountInCents,
    //     currency,
    //     automatic_payment_methods: { enabled: true },
    // }, { idempotencyKey });
    // return { success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, error: null };

    return {
        success: true,
        clientSecret: `pi_${idempotencyKey}_secret_mock`,
        error: null,
    };
}
