import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import { getCartData } from '@/data/cart/CartService';
import { redirect } from 'next/navigation';
import { CheckoutEmptyCart } from './components/CheckoutEmptyCart';
import { CheckoutForm } from './components/CheckoutForm';
import { JSX } from 'react/jsx-runtime';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage(): Promise<JSX.Element> {
    const userResult = await getCurrentUserCheckoutData();

    if (userResult.error || !userResult.data) redirect('/login?redirect=/checkout');

    const { id: userId, email, profile, stripeCustomerId } = userResult.data;

    const cartResult = await getCartData(userId);
    const cartItems = cartResult.data?.books ?? [];

    if (cartItems.length === 0) return <CheckoutEmptyCart />;

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Secure Checkout
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Complete your purchase securely with encrypted SSL payment processing.
                    </p>
                </header>

                <CheckoutForm
                    userId={userId}
                    customerEmail={email}
                    stripeCustomerId={stripeCustomerId}
                    initialProfile={profile}
                    initialItems={cartItems}
                />
            </div>
        </main>
    );
}
