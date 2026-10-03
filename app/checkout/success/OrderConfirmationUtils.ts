import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import {
    EvaluatedDiscount,
    OrderTotals,
    ShippingAddressInfo,
    OrderStatuses,
} from './OrderConfirmationTypes';

export const extractShippingAddress = (order: OrderWithRelations): ShippingAddressInfo => {
    const address = order.order_addresses?.[0];

    if (address) {
        const recipientName =
            `${address.first_name} ${address.last_name}`.trim() || 'Valued Customer';
        const cityPostcode = [address.city, address.postcode.toUpperCase()]
            .filter(Boolean)
            .join(', ');
        const addressLines = [address.street_address, cityPostcode, address.country].filter(
            (line): line is string => Boolean(line && line.trim().length > 0),
        );

        return { recipientName, addressLines };
    }

    return {
        recipientName: 'Valued Customer',
        addressLines: [],
    };
};

export const calculateOrderTotals = (order: OrderWithRelations): OrderTotals => {
    const items = order.order_items ?? [];
    const orderDiscounts = order.order_discounts ?? [];

    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal =
        Number(order.subtotal ?? 0) ||
        items.reduce((acc, item) => {
            const itemPrice = Number(item.price ?? 0);
            return acc + itemPrice * item.quantity;
        }, 0);

    const evaluatedDiscounts: EvaluatedDiscount[] = orderDiscounts
        .map((od) => {
            const discount = od.discounts;
            if (!discount) return null;

            const rawValue = Number(discount.value);
            let deduction = 0;

            if (discount.type === 'percentage') deduction = (subtotal * rawValue) / 100;
            else if (discount.type === 'fixed_amount') deduction = Math.min(rawValue, subtotal);

            return {
                id: discount.id,
                code: discount.code,
                amount: deduction,
            };
        })
        .filter((d): d is EvaluatedDiscount => d !== null);

    const discountTotal =
        Number(order.discount_amount ?? 0) ||
        evaluatedDiscounts.reduce((acc, d) => acc + d.amount, 0);
    const shippingCost = Number(order.shipping_cost ?? 0);
    const grandTotal = Number(order.total_amount ?? 0);

    return {
        subtotal,
        discountTotal,
        shippingCost,
        grandTotal,
        totalItemCount,
        evaluatedDiscounts,
    };
};

export const extractOrderStatuses = (order: OrderWithRelations): OrderStatuses => {
    const record = order as unknown as Record<string, unknown>;

    const rawPayment =
        typeof record.payment_status === 'string' && record.payment_status
            ? record.payment_status
            : 'PAID';
    const rawFulfillment =
        order.status ||
        (typeof record.fulfillment_status === 'string' ? record.fulfillment_status : 'PROCESSING');

    return {
        paymentStatus: rawPayment.toUpperCase(),
        fulfillmentStatus: rawFulfillment.toUpperCase(),
    };
};
