'use client';

import { JSX } from 'react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { OrderConfirmationHeader } from './OrderConfirmationHeader';
import { OrderDetails } from './OrderDetails';

interface OrderConfirmationSummaryProps {
    readonly order: OrderWithRelations;
}

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps): JSX.Element {
    return (
        <main className="mx-auto w-full max-w-[1600px] space-y-8 px-6 lg:px-12">
            <OrderConfirmationHeader orderId={order.id} />

            <OrderDetails order={order} />
        </main>
    );
}
