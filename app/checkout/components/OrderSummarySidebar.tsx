'use client';

import { JSX } from 'react';
import { Button, Alert } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { CartItem } from '@/data/cart/CartMapper';
import { AppliedDiscountState, CheckoutSummaryTotals } from '@/data/checkout/CheckoutTypes';
import { formatCurrency } from '@/data/checkout/CheckoutUtils';
import { FREE_SHIPPING_THRESHOLD } from '@/data/checkout/CheckoutConstants';

export interface OrderSummarySidebarProps {
    readonly initialItems: readonly CartItem[];
    readonly totals: CheckoutSummaryTotals;
    readonly appliedDiscount: AppliedDiscountState | null;
    readonly isSubmitting: boolean;
    readonly checkoutError: string | null;
}

export function OrderSummarySidebar({
    initialItems,
    totals,
    appliedDiscount,
    isSubmitting,
    checkoutError,
}: OrderSummarySidebarProps): JSX.Element {
    const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
    const freeShippingProgress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return (
        <div className="sticky top-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>

            <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900">
                {amountNeededForFreeShipping > 0 ? (
                    <p className="mb-1.5 font-medium">
                        Add{' '}
                        <span className="font-bold">
                            {formatCurrency(amountNeededForFreeShipping)}
                        </span>{' '}
                        more to qualify for <span className="font-bold">Free Shipping</span>!
                    </p>
                ) : (
                    <p className="mb-1.5 font-semibold text-green-700">
                        🎉 You qualify for Free Shipping!
                    </p>
                )}
                <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
                    <div
                        className="h-full bg-amber-600 transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                    />
                </div>
            </div>

            <div className="mb-6 max-h-72 space-y-3 overflow-y-auto pr-1">
                {initialItems.map((item) => {
                    const itemPrice = Number(item.price) || 0;
                    return (
                        <div
                            key={item.id}
                            className="flex justify-between gap-2 text-sm"
                        >
                            <span className="line-clamp-1 text-gray-600">
                                {item.title}{' '}
                                <span className="font-medium text-gray-400">x{item.quantity}</span>
                            </span>
                            <span className="shrink-0 font-medium text-gray-900">
                                {formatCurrency(itemPrice * item.quantity)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mb-6 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                        {formatCurrency(totals.subtotal)}
                    </span>
                </div>

                {totals.discountAmount > 0 && (
                    <div className="flex justify-between font-medium text-green-600">
                        <span>Discount ({appliedDiscount?.code})</span>
                        <span>-{formatCurrency(totals.discountAmount)}</span>
                    </div>
                )}

                <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">
                        {totals.shippingCost === 0 ? 'FREE' : formatCurrency(totals.shippingCost)}
                    </span>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span className="text-gray-900">{formatCurrency(totals.grandTotal)}</span>
                </div>
            </div>

            {checkoutError && (
                <Alert
                    severity="error"
                    className="mb-4 rounded-xl text-xs"
                >
                    {checkoutError}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                startIcon={<LockIcon />}
                className="rounded-2xl bg-gray-900 py-3.5 font-bold text-white normal-case shadow-md hover:bg-gray-800"
            >
                {isSubmitting
                    ? 'Processing Secure Payment...'
                    : `Pay ${formatCurrency(totals.grandTotal)}`}
            </Button>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
                <p className="font-semibold">⚠️ Personal Project Notice</p>
                <p className="mt-0.5 text-amber-700">
                    This is a personal portfolio project. Please do not insert any real personal or
                    financial details.
                </p>
            </div>
        </div>
    );
}
