'use client';

import { JSX } from 'react';
import { Alert } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { CardElement, useStripe } from '@stripe/react-stripe-js';
import { SANDBOX_BANNER_MESSAGE } from '@/data/checkout/CheckoutConstants';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#111827',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '15px',
            '::placeholder': {
                color: '#9ca3af',
            },
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
    hidePostalCode: true,
};

export function PaymentMethodSection(): JSX.Element {
    const stripe = useStripe();
    const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const isKeyMissing = !rawKey || !rawKey.trim().startsWith('pk_');

    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CreditCardIcon
                    fontSize="small"
                    className="text-amber-600"
                />
                Payment Method
            </h2>

            <Alert
                severity="info"
                className="mb-4 rounded-xl text-sm"
            >
                {SANDBOX_BANNER_MESSAGE}
            </Alert>

            {isKeyMissing ? (
                <Alert
                    severity="error"
                    className="mb-4 rounded-xl text-sm font-semibold"
                >
                    Stripe publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is missing or
                    invalid in `.env.local`.
                </Alert>
            ) : !stripe ? (
                <Alert
                    severity="warning"
                    className="mb-4 rounded-xl text-sm"
                >
                    Initializing Stripe payment gateway...
                </Alert>
            ) : null}

            <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <CreditCardIcon className="text-gray-500" />
                        <span>Credit / Debit Card (Stripe Secure)</span>
                    </div>
                    <div className="flex gap-1.5 opacity-60">
                        <span className="rounded bg-gray-200 px-2 py-1 font-mono text-xs font-bold">
                            VISA
                        </span>
                        <span className="rounded bg-gray-200 px-2 py-1 font-mono text-xs font-bold">
                            MC
                        </span>
                        <span className="rounded bg-gray-200 px-2 py-1 font-mono text-xs font-bold">
                            AMEX
                        </span>
                    </div>
                </div>

                {/* Expanded wrapper padding and layout width for optimal Stripe field rendering */}
                <div className="w-full overflow-x-auto rounded-xl border border-gray-300 bg-white p-4 shadow-sm focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
            </div>
        </div>
    );
}
