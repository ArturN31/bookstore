'use client';

import { JSX } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import FlashOnOutlinedIcon from '@mui/icons-material/FlashOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { SHIPPING_METHODS } from '@/data/checkout/CheckoutConstants';
import { calculateMethodShippingCost, formatCurrency } from '@/data/checkout/CheckoutUtils';

export interface ShippingMethodSectionProps {
    readonly selectedMethodId: string;
    readonly postcode: string;
    readonly subtotalAfterDiscount: number;
    readonly onSelectMethod: (methodId: string) => void;
}

export function ShippingMethodSection({
    selectedMethodId,
    postcode,
    subtotalAfterDiscount,
    onSelectMethod,
}: ShippingMethodSectionProps): JSX.Element {
    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <LocalShippingOutlinedIcon
                    fontSize="small"
                    className="text-amber-600"
                />
                Delivery Method & Speed
            </h2>

            <RadioGroup
                value={selectedMethodId}
                onChange={(e) => onSelectMethod(e.target.value)}
                className="space-y-3"
            >
                {SHIPPING_METHODS.map((method) => {
                    const cost = calculateMethodShippingCost(
                        method,
                        subtotalAfterDiscount,
                        postcode,
                    );
                    const isSelected = selectedMethodId === method.id;

                    return (
                        <label
                            key={method.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                                isSelected
                                    ? 'border-gray-900 bg-gray-50/80 shadow-sm ring-1 ring-gray-900'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FormControlLabel
                                    value={method.id}
                                    control={
                                        <Radio
                                            size="small"
                                            className="text-gray-900"
                                        />
                                    }
                                    label=""
                                    className="m-0"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                                        {method.isExpress ? (
                                            <FlashOnOutlinedIcon
                                                fontSize="small"
                                                className="text-amber-600"
                                            />
                                        ) : method.isCollect ? (
                                            <StorefrontOutlinedIcon
                                                fontSize="small"
                                                className="text-blue-600"
                                            />
                                        ) : (
                                            <LocalShippingOutlinedIcon fontSize="small" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {method.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {method.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="font-mono text-sm font-extrabold text-gray-900">
                                    {cost === 0 ? 'FREE' : formatCurrency(cost)}
                                </span>
                                <p className="text-xs font-semibold text-amber-700">
                                    {method.estimatedDelivery}
                                </p>
                            </div>
                        </label>
                    );
                })}
            </RadioGroup>
        </div>
    );
}
