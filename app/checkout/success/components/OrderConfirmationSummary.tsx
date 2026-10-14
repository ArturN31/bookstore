'use client';

import { JSX, useEffect } from 'react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { OrderConfirmationHeader } from './OrderConfirmationHeader';
import { OrderDetails } from './OrderDetails';
import { useCartActions } from '@/providers/cart/utils/useCart';

interface OrderConfirmationSummaryProps {
    readonly order: OrderWithRelations;
}

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps): JSX.Element {
    const { resetCart, refreshCart } = useCartActions();

    useEffect(() => {
        resetCart();
        if (order.user_id) refreshCart(order.user_id);
    }, [resetCart, refreshCart, order.user_id]);

    return (
        <main className="mx-auto w-full max-w-[1600px] space-y-8 px-6 lg:px-12">
            <OrderConfirmationHeader orderId={order.id} />

            <OrderDetails order={order} />
        </main>
    );
}
