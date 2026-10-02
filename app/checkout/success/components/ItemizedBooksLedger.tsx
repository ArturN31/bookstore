'use client';

import { JSX } from 'react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';

interface ItemizedBooksLedgerProps {
    readonly items: OrderWithRelations['order_items'] | null;
    readonly totalItemCount: number;
}

export function ItemizedBooksLedger({
    items,
    totalItemCount,
}: ItemizedBooksLedgerProps): JSX.Element {
    const itemList = items ?? [];

    return (
        <section
            aria-label="Itemized order items"
            className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm"
        >
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xs font-black tracking-wider text-slate-400 uppercase">
                    Itemized Books Ledger
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {totalItemCount} Items Total
                </span>
            </div>
            <div className="divide-y divide-slate-100">
                {itemList.map((item) => {
                    const itemPrice = Number(item.price ?? 0);
                    const title = item.books?.title ?? 'Book Item';
                    const itemTotal = (itemPrice * item.quantity).toFixed(2);

                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                        >
                            <div className="pr-4">
                                <p className="text-base font-bold text-slate-900">{title}</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                    Quantity: {item.quantity}
                                </p>
                            </div>
                            <span className="font-mono text-base font-extrabold whitespace-nowrap text-slate-900">
                                £{itemTotal}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
