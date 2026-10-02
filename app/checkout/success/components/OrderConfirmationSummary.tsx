'use client';

import { JSX } from 'react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { OrderConfirmationHeader } from './OrderConfirmationHeader';
import { DeliveryAddressCard } from './DeliveryAddressCard';
import { OrderStatusCard } from './OrderStatusCard';
import { ItemizedBooksLedger } from './ItemizedBooksLedger';
import { SettlementSummaryCard } from './SettlementSummaryCard';
import {
    calculateOrderTotals,
    extractOrderStatuses,
    extractShippingAddress,
} from '../OrderConfirmationUtils';

interface OrderConfirmationSummaryProps {
    readonly order: OrderWithRelations;
}

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps): JSX.Element {
    const totals = calculateOrderTotals(order);
    const shippingAddress = extractShippingAddress(order);
    const statuses = extractOrderStatuses(order);

    return (
        <main className="mx-auto w-full max-w-[1600px] space-y-8 px-6 lg:px-12">
            <OrderConfirmationHeader orderId={order.id} />

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <DeliveryAddressCard
                            recipientName={shippingAddress.recipientName}
                            addressLines={shippingAddress.addressLines}
                        />
                        <OrderStatusCard
                            paymentStatus={statuses.paymentStatus}
                            fulfillmentStatus={statuses.fulfillmentStatus}
                        />
                    </div>

                    <ItemizedBooksLedger
                        items={order.order_items}
                        totalItemCount={totals.totalItemCount}
                    />
                </div>

                <SettlementSummaryCard totals={totals} />
            </div>
        </main>
    );
}
