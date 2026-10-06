import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { getUserData } from '@/data/user/UserService';
import { redirect } from 'next/navigation';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { JSX } from 'react';
import { checkIsOwner } from '@/utils/auth/checkOwnership';

const PAGE_SIZE = 5;

interface UserOrdersPageProps {
    readonly params: Promise<{ username: string }>;
}

export default async function UserOrdersPage({
    params,
}: UserOrdersPageProps): Promise<JSX.Element> {
    const { username } = await params;

    const supabase = await createBackendClient();
    const { data: userData, error } = await getUserData();

    if (error || !userData) redirect('/user/profile');
    const isOwner = await checkIsOwner(userData.username);
    if (!isOwner) redirect('/user/profile');

    const ordersQueryResult = await safeSupabaseQuery(async () =>
        supabase
            .from('orders')
            .select(
                `
                *,
                order_items (*, books (*)),
                order_addresses (*),
                order_discounts (*, discounts (*))
            `,
            )
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE),
    );

    const rawOrders = (ordersQueryResult.data as unknown as OrderWithRelations[]) ?? [];
    const initialHasMore = rawOrders.length > PAGE_SIZE;
    const orders = initialHasMore ? rawOrders.slice(0, PAGE_SIZE) : rawOrders;

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
            <div>
                <Link
                    href={`/user/profile/public/${username}`}
                    className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    <ArrowBackIcon fontSize="small" />
                    Back to Profile
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{username}&apos;s Orders</h1>
            </div>

            {ordersQueryResult.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    Failed to load order details. Please try again later.
                </div>
            )}

            {!ordersQueryResult.error && orders.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
                    <ReceiptLongOutlinedIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <h2 className="text-lg font-medium text-gray-800">No Orders yet</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        This user hasn&apos;t placed any orders yet.
                    </p>
                </div>
            )}

            {!ordersQueryResult.error && orders.length > 0 && (
                <div className="space-y-6">
                    {orders.map((order) => {
                        const shippingName = order.shipping_method_name || 'Standard Shipping';
                        const paymentMethod = order.payment_method
                            ? order.payment_method.toUpperCase()
                            : 'CARD';

                        return (
                            <Link
                                key={order.id}
                                href={`/user/order/${order.id}`}
                                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                                Order ID:
                                            </span>
                                            <span className="font-mono text-xs font-medium text-gray-800">
                                                {order.id}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-sm text-gray-600">
                                            Placed on{' '}
                                            {new Date(order.created_at).toLocaleDateString(
                                                'en-GB',
                                                {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                },
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            {order.status}
                                        </span>
                                        <ChevronRightIcon className="text-gray-400" />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <LocalShippingOutlinedIcon
                                                fontSize="small"
                                                className="text-gray-400"
                                            />
                                            <span>{shippingName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <PaymentOutlinedIcon
                                                fontSize="small"
                                                className="text-gray-400"
                                            />
                                            <span>{paymentMethod}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:justify-end">
                                        <span className="text-gray-500">Total:</span>
                                        <span className="font-mono text-base font-extrabold text-gray-900">
                                            £{Number(order.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
