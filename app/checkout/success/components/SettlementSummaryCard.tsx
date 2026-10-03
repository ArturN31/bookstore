'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { OrderTotals } from '../OrderConfirmationTypes';

interface SettlementSummaryCardProps {
    readonly totals: OrderTotals;
}

export function SettlementSummaryCard({ totals }: SettlementSummaryCardProps): JSX.Element {
    return (
        <aside
            aria-label="Settlement summary"
            className="lg:col-span-4"
        >
            <div className="sticky top-8 space-y-6">
                <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-md">
                    <h2 className="border-b border-slate-100 pb-4 text-xs font-black tracking-widest text-slate-400 uppercase">
                        Settlement Summary
                    </h2>

                    <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                        <span>Original Subtotal</span>
                        <span className="font-mono font-bold text-slate-900">
                            £{totals.subtotal.toFixed(2)}
                        </span>
                    </div>

                    {totals.evaluatedDiscounts.map((discount) => (
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
                            £{totals.shippingCost.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-slate-200 pt-5">
                        <span className="text-base font-black text-slate-900">
                            Grand Total Paid
                        </span>
                        <span className="font-mono text-2xl font-black text-emerald-700">
                            £{totals.grandTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div>
                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-8 py-5 text-sm font-extrabold text-white shadow-xl shadow-slate-900/15 transition-all hover:bg-slate-800 active:scale-[0.98]"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </aside>
    );
}
