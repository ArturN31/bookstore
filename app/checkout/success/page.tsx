import { redirect, notFound } from 'next/navigation';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import Link from 'next/link';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';
import { OrderConfirmationSummary } from './components/OrderConfirmationSummary';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { JSX } from 'react/jsx-runtime';

export const dynamic = 'force-dynamic';

interface PageProps {
    readonly searchParams: Promise<{ readonly orderId?: string }>;
}

export default async function CheckoutSuccessPage({
    searchParams,
}: PageProps): Promise<JSX.Element> {
    const resolvedSearchParams = await searchParams;
    const orderId = resolvedSearchParams?.orderId;

    if (!orderId || typeof orderId !== 'string') notFound();

    const ownershipResult = await verifyOrderOwnershipAndFetch(orderId);

    if (ownershipResult.status === 'NOT_FOUND') notFound();

    if (ownershipResult.status === 'UNAUTHENTICATED')
        redirect(`/login?redirect=/checkout/success?orderId=${encodeURIComponent(orderId)}`);

    if (ownershipResult.status === 'UNAUTHORIZED')
        return (
            <main className="flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
                <Box className="w-full max-w-md">
                    <Alert
                        severity="error"
                        className="rounded-2xl border border-red-200"
                    >
                        <AlertTitle className="font-bold">Access Denied</AlertTitle>
                        {APP_ERROR_MESSAGES.UNAUTHORIZED_ORDER_ACCESS}
                    </Alert>
                    <Box className="mt-6 text-center">
                        <Button
                            component={Link}
                            href="/catalog"
                            variant="outlined"
                            className="rounded-xl border-gray-300 font-bold text-gray-700 normal-case"
                        >
                            Return to Storefront
                        </Button>
                    </Box>
                </Box>
            </main>
        );

    return (
        <main className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <OrderConfirmationSummary order={ownershipResult.order} />
        </main>
    );
}
