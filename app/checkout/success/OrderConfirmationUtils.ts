import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { SHIPPING_COST } from '@/data/checkout/CheckoutConstants';
import {
    EvaluatedDiscount,
    OrderTotals,
    ShippingAddressInfo,
    OrderStatuses,
} from './OrderConfirmationTypes';

const getMetadataString = (record: Record<string, unknown>, keys: readonly string[]): string => {
    for (const key of keys) {
        const val = record[key];
        if (typeof val === 'string' && val.trim().length > 0) {
            return val.trim();
        }
    }
    return '';
};

export const calculateOrderTotals = (order: OrderWithRelations): OrderTotals => {
    const items = order.order_items ?? [];
    const orderDiscounts = order.order_discounts ?? [];

    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = items.reduce((acc, item) => {
        const itemPrice = Number(item.price ?? 0);
        return acc + itemPrice * item.quantity;
    }, 0);

    const evaluatedDiscounts: EvaluatedDiscount[] = orderDiscounts
        .map((od) => {
            const discount = od.discounts;
            if (!discount) return null;

            const rawValue = Number(discount.value);
            let deduction = 0;

            if (discount.type === 'percentage') {
                deduction = (subtotal * rawValue) / 100;
            } else if (discount.type === 'fixed_amount') {
                deduction = Math.min(rawValue, subtotal);
            }

            return {
                id: discount.id,
                code: discount.code,
                amount: deduction,
            };
        })
        .filter((d): d is EvaluatedDiscount => d !== null);

    const discountTotal = evaluatedDiscounts.reduce((acc, d) => acc + d.amount, 0);
    const shippingCost = SHIPPING_COST;
    const grandTotal = Math.max(0, subtotal + shippingCost - discountTotal);

    return {
        subtotal,
        discountTotal,
        shippingCost,
        grandTotal,
        totalItemCount,
        evaluatedDiscounts,
    };
};

export const extractShippingAddress = (order: OrderWithRelations): ShippingAddressInfo => {
    const record = order as unknown as Record<string, unknown>;

    const recipientName =
        getMetadataString(record, ['shipping_name', 'full_name', 'name']) || 'Valued Customer';

    const addressLine1 = getMetadataString(record, [
        'shipping_address_line1',
        'shipping_address',
        'address',
    ]);
    const addressLine2 = getMetadataString(record, ['shipping_address_line2']);
    const city = getMetadataString(record, ['shipping_city', 'city']);
    const postalCode = getMetadataString(record, ['shipping_postal_code', 'postal_code', 'zip']);
    const country = getMetadataString(record, ['shipping_country', 'country']);

    const cityPostal = [city, postalCode].filter(Boolean).join(', ');

    const addressLines = [addressLine1, addressLine2, cityPostal, country].filter(
        (line): line is string => Boolean(line && line.length > 0),
    );

    return { recipientName, addressLines };
};

export const extractOrderStatuses = (order: OrderWithRelations): OrderStatuses => {
    const record = order as unknown as Record<string, unknown>;

    const rawPayment = getMetadataString(record, ['payment_status', 'payment_state']) || 'PAID';
    const rawFulfillment =
        order.status || getMetadataString(record, ['fulfillment_status']) || 'PROCESSING';

    return {
        paymentStatus: rawPayment.toUpperCase(),
        fulfillmentStatus: rawFulfillment.toUpperCase(),
    };
};
