import {
    DEFAULT_CURRENCY,
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_METHODS,
    SHIPPING_ZONES,
    ShippingMethodOption,
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

export function determineZone(postcode: string): 'zone_1' | 'zone_2' | 'zone_3' {
    const clean = postcode.trim().toUpperCase();
    if (SHIPPING_ZONES.ZONE_1.prefixes.some((prefix) => clean.startsWith(prefix))) return 'zone_1';
    if (SHIPPING_ZONES.ZONE_2.prefixes.some((prefix) => clean.startsWith(prefix))) return 'zone_2';
    return 'zone_3';
}

export function calculateMethodShippingCost(
    method: ShippingMethodOption,
    subtotalAfterDiscount: number,
    postcode: string,
): number {
    if (subtotalAfterDiscount === 0 || method.isCollect) return 0.0;

    const zone = determineZone(postcode);
    const baseCost = method.baseCosts[zone];

    if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) {
        if (!method.isExpress) return 0.0;
        const standardCost =
            SHIPPING_METHODS.find((m) => !m.isExpress && !m.isCollect)?.baseCosts[zone] ?? 0;
        return Math.max(0, baseCost - standardCost);
    }

    return baseCost;
}

export function calculateTotals(
    items: ReadonlyArray<CartCheckoutItem>,
    discount: AppliedDiscountState | null,
    postcode: string = '',
    selectedMethodId: string = 'royal_mail_standard',
    taxRate: number = 0,
): CheckoutSummaryTotals {
    const subtotal = calculateSubtotal(items);
    const discountAmount = calculateDiscount(subtotal, discount);
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

    const method = SHIPPING_METHODS.find((m) => m.id === selectedMethodId) ?? SHIPPING_METHODS[0];
    const shippingCost = calculateMethodShippingCost(method, subtotalAfterDiscount, postcode);
    const taxAmount = Math.round(subtotalAfterDiscount * taxRate * 100) / 100;
    const grandTotal = Math.round((subtotalAfterDiscount + shippingCost + taxAmount) * 100) / 100;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount,
        shippingCost: Math.round(shippingCost * 100) / 100,
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
