'use client';

import { JSX } from 'react';
import { OrderStatuses } from '../OrderConfirmationTypes';

export function OrderStatusCard({ paymentStatus, fulfillmentStatus }: OrderStatuses): JSX.Element {
    return (
        <article className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
            <div>
                <div className="mb-4 flex items-center gap-3">
                    <div
                        className="rounded-2xl bg-blue-100/80 p-3 text-blue-700"
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                        Status &amp; Verification
                    </h2>
                </div>
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-500">Payment Status</span>
                        <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black tracking-wide text-emerald-800">
                            {paymentStatus}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-500">Fulfillment State</span>
                        <span className="rounded-full bg-blue-100 px-3.5 py-1 text-xs font-black tracking-wide text-blue-800">
                            {fulfillmentStatus}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}
