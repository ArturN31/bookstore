import { createAdminClient } from '@/utils/db/admin';
import { Suspense } from 'react';
import { TelemetrySkeleton } from './TelemetrySkeleton';

export const LiveTelemetry = async () => {
    const supabase = await createAdminClient();

    const TABLE_CONFIG = [
        { id: 'books', label: 'Books', color: 'bg-blue-500' },
        { id: 'book_reviews', label: 'Book Reviews', color: 'bg-orange-500' },
        { id: 'users', label: 'Users', color: 'bg-emerald-500' },
        { id: 'shopping_carts', label: 'Carts', color: 'bg-lime-500' },
        { id: 'shopping_cart_items', label: 'Cart Items', color: 'bg-lime-500' },
        { id: 'orders', label: 'Orders', color: 'bg-fuchsia-500' },
        { id: 'order_items', label: 'Order Items', color: 'bg-fuchsia-500' },
        { id: 'order_discounts', label: 'Order Discounts', color: 'bg-fuchsia-500' },
        { id: 'discounts', label: 'Discounts', color: 'bg-yellow' },
        { id: 'wishlist', label: 'Wishlist', color: 'bg-red-500' },
    ];

    const results = await Promise.all(
        TABLE_CONFIG.map((table) =>
            supabase.from(table.id).select('*', { count: 'exact', head: true }),
        ),
    );

    return (
        <Suspense fallback={<TelemetrySkeleton />}>
            <div
                id="telemetry-unit"
                className="crt-container border-gunmetal border-4 shadow-[12px_12px_0px_0px_rgba(32,39,47,0.1)]"
            >
                <div className="scanline-overlay" />
                <div className="scanline-beam" />

                <div className="bg-gunmetal relative z-10 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-5">
                    {TABLE_CONFIG.map((table, i) => (
                        <div
                            key={table.id}
                            className="group flex cursor-crosshair bg-white p-4 transition-colors hover:bg-slate-50"
                        >
                            <div
                                className={`mr-4 w-1.5 ${table.color} transition-all group-hover:w-3`}
                            />
                            <div className="relative z-20 flex flex-col">
                                <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                    Instance_{i.toString().padStart(2, '0')}
                                </span>
                                <span className="text-gunmetal text-xs font-bold tracking-tight uppercase">
                                    {table.label}
                                </span>
                                <span
                                    key={`${table.id}-${results[i].count}`}
                                    className="text-gunmetal animate-terminal-sync inline-block text-4xl font-black tracking-tighter"
                                    style={
                                        {
                                            '--pulse-delay': `${i * 150}ms`,
                                            '--pulse-duration': `${2 + (i % 3) * 0.5}s`,
                                        } as React.CSSProperties
                                    }
                                >
                                    {results[i].count?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Suspense>
    );
};
