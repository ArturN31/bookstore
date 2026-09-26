import {
    DEFAULT_CURRENCY,
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_COST,
} from '@/data/checkout/CheckoutConstants';
import {
    AppliedDiscountState,
    CartCheckoutItem,
    CheckoutSummaryTotals,
} from '@/data/checkout/CheckoutTypes';

export function calculateSubtotal(items: ReadonlyArray<CartCheckoutItem>): number {
    return items.reduce((accumulator: number, item: CartCheckoutItem): number => {
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
    items: ReadonlyArray<CartCheckoutItem>,
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
