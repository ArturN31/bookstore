'use client';

import { JSX } from 'react';

interface OrderConfirmationHeaderProps {
    readonly orderId: string;
}

export function OrderConfirmationHeader({ orderId }: OrderConfirmationHeaderProps): JSX.Element {
    return (
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-6">
                    <div
                        aria-hidden="true"
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100"
                    >
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
                            We&apos;ve received your payment and are getting your books ready for
                            dispatch.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 shadow-inner">
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Order ID
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900">{orderId}</span>
                </div>
            </div>
        </header>
    );
}
