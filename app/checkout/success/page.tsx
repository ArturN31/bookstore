import { redirect } from 'next/navigation';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';
import { OrderConfirmationSummary } from './components/OrderConfirmationSummary';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { JSX } from 'react/jsx-runtime';
import { OrderErrorState } from './components/OrderErrorState';

export const dynamic = 'force-dynamic';

interface PageProps {
    readonly searchParams: Promise<{ readonly orderId?: string }>;
}

export default async function CheckoutSuccessPage({
    searchParams,
}: PageProps): Promise<JSX.Element> {
    const resolvedSearchParams = await searchParams;
    const orderId = resolvedSearchParams?.orderId;

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
        redirect(`/login?redirect=/checkout/success?orderId=${encodeURIComponent(orderId)}`);

    if (ownershipResult.status === 'UNAUTHORIZED')
        return (
            <OrderErrorState
                title="Access Denied"
                message={APP_ERROR_MESSAGES.UNAUTHORIZED_ORDER_ACCESS}
            />
        );

    return (
        <main className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <OrderConfirmationSummary order={ownershipResult.order} />
        </main>
    );
}
