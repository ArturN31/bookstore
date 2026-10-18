'use client';

import { JSX, useState, useTransition } from 'react';
import { cancelOrderAction } from '@/data/orders/OrderCancelAction';
import { useRouter } from 'next/navigation';

interface OrderCancelModalProps {
    readonly orderId: string;
    readonly orderStatus: string;
}

export function OrderCancelModal({
    orderId,
    orderStatus,
}: OrderCancelModalProps): JSX.Element | null {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (orderStatus !== 'pending') return null;

    const handleCancelOrder = (): void => {
        setError(null);
        startTransition(async () => {
            const result = await cancelOrderAction(orderId);
            if (!result.success) setError(result.error ?? 'An unexpected error occurred.');
            else {
                setIsOpen(false);
                router.refresh();
            }
        });
    };

    return (
        <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Cancel Order</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        You can cancel this order while it is still pending processing.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:cursor-pointer hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                    Cancel Order
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Confirm Order Cancellation
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to cancel this order? Stock items will be returned
                            to inventory, and this action cannot be undone.
                        </p>

                        {error && (
                            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors ring-inset hover:cursor-pointer hover:bg-gray-50"
                            >
                                Keep Order
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleCancelOrder}
                                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:cursor-pointer hover:bg-red-500 disabled:opacity-50"
                            >
                                {isPending ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
