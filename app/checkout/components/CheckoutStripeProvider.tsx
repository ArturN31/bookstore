'use client';

import { ReactNode, JSX, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripeHeader } from '@/data/checkout/CheckoutStripeClient';
import { Stripe } from '@stripe/stripe-js';

export interface CheckoutStripeProviderProps {
    readonly children: ReactNode;
}

export function CheckoutStripeProvider({ children }: CheckoutStripeProviderProps): JSX.Element {
    const [stripePromise] = useState<Promise<Stripe | null>>(() => getStripeHeader());

    return <Elements stripe={stripePromise}>{children}</Elements>;
}
