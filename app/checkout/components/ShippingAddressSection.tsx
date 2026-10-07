'use client';

import { JSX } from 'react';
import Link from 'next/link';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

export interface ShippingAddressSectionProps {
    readonly customerEmail: string;
    readonly initialProfile: Record<string, unknown> | null;
}

export function ShippingAddressSection({
    customerEmail,
    initialProfile,
}: ShippingAddressSectionProps): JSX.Element {
    const firstName = (initialProfile?.first_name as string) ?? '';
    const lastName = (initialProfile?.last_name as string) ?? '';
    const streetAddress = (initialProfile?.street_address as string) ?? '';
    const city = (initialProfile?.city as string) ?? '';
    const postcode = (initialProfile?.postcode as string) ?? '';
    const country = (initialProfile?.country as string) ?? 'United Kingdom';

    const hasCompleteAddress = Boolean(firstName && lastName && streetAddress && city && postcode);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                        <LocalShippingOutlinedIcon fontSize="small" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                            Deliver To
                        </h2>
                        {hasCompleteAddress ? (
                            <div className="mt-1 space-y-0.5 text-sm font-medium text-gray-900">
                                <p className="font-bold">
                                    {firstName} {lastName}
                                </p>
                                <p className="text-gray-600">
                                    {streetAddress}, {city}, {postcode.toUpperCase()}, {country}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-1 text-xs font-semibold text-amber-700">
                                Address incomplete ({customerEmail})
                            </p>
                        )}
                    </div>
                </div>

                <Link
                    href="/user/profile/change_address?redirectTo=/checkout"
                    className="shrink-0 self-start rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:self-center"
                >
                    {hasCompleteAddress ? 'Change' : 'Add Address'}
                </Link>
            </div>
        </div>
    );
}
