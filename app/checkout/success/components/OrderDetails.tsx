import { JSX } from 'react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import {
    extractShippingAddress,
    calculateOrderTotals,
    extractOrderStatuses,
} from '@/app/checkout/success/OrderConfirmationUtils';
import { DeliveryAddressCard } from './DeliveryAddressCard';
import { ItemizedBooksLedger } from './ItemizedBooksLedger';
import { OrderStatusCard } from './OrderStatusCard';
import { SettlementSummaryCard } from './SettlementSummaryCard';

export interface OrderDetailsProps {
    readonly order: OrderWithRelations;
}

export function OrderDetails({ order }: OrderDetailsProps): JSX.Element {
    const shippingAddress = extractShippingAddress(order);
    const totals = calculateOrderTotals(order);
    const statuses = extractOrderStatuses(order);
    const items = order.order_items ?? [];

    return (
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
                    items={items}
                    totalItemCount={totals.totalItemCount}
                />
            </div>

            <SettlementSummaryCard totals={totals} />
        </div>
    );
}
