import { redirect } from 'next/navigation';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { JSX } from 'react';
import { OrderDetails } from '@/app/checkout/success/components/OrderDetails';
import { OrderErrorState } from '@/app/checkout/success/components/OrderErrorState';
import { OrderCancelModal } from './components/OrderCancelModal';
import { BackButton } from '@/components/layout/BackButton';

export const dynamic = 'force-dynamic';

interface PageProps {
    readonly params: Promise<{ readonly orderId: string }>;
}

export default async function ViewOrderPage({ params }: PageProps): Promise<JSX.Element> {
    const resolvedParams = await params;
    const orderId = resolvedParams?.orderId;

    if (!orderId || typeof orderId !== 'string')
        return (
            <OrderErrorState
                title="Invalid Order Reference"
                message="The order reference provided is invalid or missing."
            />
        );

    const ownershipResult = await verifyOrderOwnershipAndFetch(orderId);

    if (ownershipResult.status === 'NOT_FOUND')
        return (
            <OrderErrorState
                title="Order Not Found"
                message="The requested order could not be found or does not exist."
            />
        );

    if (ownershipResult.status === 'UNAUTHENTICATED')
        return redirect(
            `/user/auth/signin?returnTo=${encodeURIComponent(
                `/user/order/${encodeURIComponent(orderId)}`,
            )}`,
        );

    if (ownershipResult.status === 'RATE_LIMITED')
        return (
            <OrderErrorState
                title="Please Try Again Later"
                message={ownershipResult.message}
            />
        );

    if (ownershipResult.status === 'UNAUTHORIZED')
        return (
            <OrderErrorState
                title="Access Denied"
                message={APP_ERROR_MESSAGES.UNAUTHORIZED_ORDER_ACCESS}
            />
        );

    return (
        <main className="mx-auto max-w-7xl space-y-8 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <BackButton />
            </div>
            <OrderCancelModal
                orderId={orderId}
                orderStatus={ownershipResult.order.status}
            />
            <OrderDetails order={ownershipResult.order} />
        </main>
    );
}
