'use client';

import { JSX } from 'react';
import { ShippingAddressInfo } from '../OrderConfirmationTypes';

export function DeliveryAddressCard({
    recipientName,
    addressLines,
}: ShippingAddressInfo): JSX.Element {
    return (
        <article className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
            <div>
                <div className="mb-4 flex items-center gap-3">
                    <div
                        className="rounded-2xl bg-amber-100/80 p-3 text-amber-700"
                        aria-hidden="true"
                    >
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
                    <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                        Delivery Address
                    </h2>
                </div>
                <p className="text-base font-bold text-slate-900">{recipientName}</p>
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
        </article>
    );
}
