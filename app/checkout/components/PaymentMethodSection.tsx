'use client';

import { JSX } from 'react';
import { Alert } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { SANDBOX_BANNER_MESSAGE } from '@/data/checkout/CheckoutConstants';

export function PaymentMethodSection(): JSX.Element {
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

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
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
        </div>
    );
}
