'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { SHIPPING_COST } from '@/data/checkout/CheckoutConstants';

interface OrderConfirmationSummaryProps {
    readonly order: OrderWithRelations;
}

interface OrderRecordMetadata {
    readonly shipping_name?: string;
    readonly full_name?: string;
    readonly name?: string;
    readonly shipping_address_line1?: string;
    readonly shipping_address?: string;
    readonly address?: string;
    readonly shipping_address_line2?: string;
    readonly shipping_city?: string;
    readonly city?: string;
    readonly shipping_postal_code?: string;
    readonly postal_code?: string;
    readonly zip?: string;
    readonly shipping_country?: string;
    readonly country?: string;
    readonly payment_status?: string;
    readonly payment_state?: string;
    readonly fulfillment_status?: string;
}

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps): JSX.Element {
    const items = order.order_items ?? [];
    const orderDiscounts = order.order_discounts ?? [];

    const subtotal = items.reduce((acc: number, item) => {
        const itemPrice = Number(item.price ?? 0);
        return acc + itemPrice * item.quantity;
    }, 0);

    const evaluatedDiscounts = orderDiscounts
        .map((od) => {
            const discount = od.discounts;
            if (!discount) return null;

            const rawValue = Number(discount.value);
            let deduction = 0;

            if (discount.type === 'percentage') {
                deduction = (subtotal * rawValue) / 100;
            } else if (discount.type === 'fixed_amount') {
                deduction = Math.min(rawValue, subtotal);
            }

            return {
                id: discount.id,
                code: discount.code,
                amount: deduction,
            };
        })
        .filter(
            (d): d is { readonly id: string; readonly code: string; readonly amount: number } =>
                d !== null,
        );

    const discountTotal = evaluatedDiscounts.reduce((acc, d) => acc + d.amount, 0);
    const shippingCost = SHIPPING_COST;
    const grandTotal = subtotal + shippingCost - discountTotal;

    const orderRecord = order as unknown as OrderRecordMetadata;

    const recipientName =
        orderRecord.shipping_name || orderRecord.full_name || orderRecord.name || 'Valued Customer';

    const addressLine1 =
        orderRecord.shipping_address_line1 ||
        orderRecord.shipping_address ||
        orderRecord.address ||
        '';
    const addressLine2 = orderRecord.shipping_address_line2 || '';
    const city = orderRecord.shipping_city || orderRecord.city || '';
    const postalCode =
        orderRecord.shipping_postal_code || orderRecord.postal_code || orderRecord.zip || '';
    const country = orderRecord.shipping_country || orderRecord.country || '';

    const addressLines = [
        addressLine1,
        addressLine2,
        [city, postalCode].filter(Boolean).join(', '),
        country,
    ].filter((line): line is string => Boolean(line && line.trim().length > 0));

    const paymentStatus = (
        orderRecord.payment_status ||
        orderRecord.payment_state ||
        'PAID'
    ).toUpperCase();

    const fulfillmentStatus = (
        order.status ||
        orderRecord.fulfillment_status ||
        'PROCESSING'
    ).toUpperCase();

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 px-6 lg:px-12">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm lg:p-10">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100">
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                Order Confirmed Successfully
                            </h1>
                            <p className="mt-1 text-base text-slate-600">
                                We&apos;ve received your payment and are getting your books ready
                                for dispatch.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 shadow-inner">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                            Order ID
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">
                            {order.id}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-2xl bg-amber-100/80 p-3 text-amber-700">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                                        Delivery Address
                                    </h3>
                                </div>
                                <p className="text-base font-bold text-slate-900">
                                    {recipientName}
                                </p>
                                <div className="mt-2 space-y-1 text-sm font-medium text-slate-600">
                                    {addressLines.length > 0 ? (
                                        addressLines.map((line) => <p key={line}>{line}</p>)
                                    ) : (
                                        <p className="text-slate-500 italic">
                                            Shipping details registered securely
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-2xl bg-blue-100/80 p-3 text-blue-700">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                                        Status &amp; Verification
                                    </h3>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-slate-500">
                                            Payment Status
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black tracking-wide text-emerald-800">
                                            {paymentStatus}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-slate-500">
                                            Fulfillment State
                                        </span>
                                        <span className="rounded-full bg-blue-100 px-3.5 py-1 text-xs font-black tracking-wide text-blue-800">
                                            {fulfillmentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                                Itemized Books Ledger
                            </h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {items.reduce((sum, i) => sum + i.quantity, 0)} Items Total
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {items.map((item) => {
                                const itemPrice = Number(item.price ?? 0);
                                const title = item.books?.title ?? 'Book Item';
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="pr-4">
                                            <p className="text-base font-bold text-slate-900">
                                                {title}
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <span className="font-mono text-base font-extrabold whitespace-nowrap text-slate-900">
                                            £{(itemPrice * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="sticky top-8 space-y-6">
                        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-md">
                            <h3 className="border-b border-slate-100 pb-4 text-xs font-black tracking-widest text-slate-400 uppercase">
                                Settlement Summary
                            </h3>

                            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                                <span>Original Subtotal</span>
                                <span className="font-mono font-bold text-slate-900">
                                    £{subtotal.toFixed(2)}
                                </span>
                            </div>

                            {evaluatedDiscounts.map((discount) => (
                                <div
                                    key={discount.id}
                                    className="flex items-center justify-between gap-3 text-sm font-semibold text-emerald-700"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>Discount Applied</span>
                                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-black tracking-wider text-emerald-900 uppercase">
                                            {discount.code}
                                        </span>
                                    </div>
                                    <span className="shrink-0 font-mono font-bold">
                                        -£{discount.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}

                            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                                <span>Shipping &amp; Handling</span>
                                <span className="font-mono font-bold text-slate-900">
                                    £{shippingCost.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-baseline justify-between border-t border-slate-200 pt-5">
                                <span className="text-base font-black text-slate-900">
                                    Grand Total Paid
                                </span>
                                <span className="font-mono text-2xl font-black text-emerald-700">
                                    £{grandTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <Link
                                href="/catalog"
                                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-8 py-5 text-sm font-extrabold text-white shadow-xl shadow-slate-900/15 transition-all hover:bg-slate-800 active:scale-[0.98]"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
