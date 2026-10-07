'use client';

import { JSX } from 'react';
import { TextField, IconButton, Button } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { AppliedDiscountState } from '@/data/checkout/CheckoutTypes';

export interface DiscountSectionProps {
    readonly couponInput: string;
    readonly appliedDiscount: AppliedDiscountState | null;
    readonly discountError: string | null;
    readonly isApplyingDiscount: boolean;
    readonly onCouponChange: (val: string) => void;
    readonly onApplyDiscount: () => void;
    readonly onRemoveDiscount: () => void;
}

export function DiscountSection({
    couponInput,
    appliedDiscount,
    discountError,
    isApplyingDiscount,
    onCouponChange,
    onApplyDiscount,
    onRemoveDiscount,
}: DiscountSectionProps): JSX.Element {
    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <LocalOfferOutlinedIcon
                    fontSize="small"
                    className="text-amber-600"
                />
                Discount & Promo Code
            </h2>

            {appliedDiscount ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-bold text-green-900 uppercase">
                            {appliedDiscount.code}
                        </span>
                        <span>Discount applied successfully!</span>
                    </div>
                    <IconButton
                        size="small"
                        onClick={onRemoveDiscount}
                        aria-label="Remove discount"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </div>
            ) : (
                <div className="flex gap-2">
                    <TextField
                        label="Enter promo code"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={couponInput}
                        onChange={(e) => onCouponChange(e.target.value)}
                        error={Boolean(discountError)}
                        helperText={discountError}
                    />
                    <Button
                        variant="outlined"
                        onClick={onApplyDiscount}
                        disabled={isApplyingDiscount || !couponInput.trim()}
                        className="shrink-0 rounded-xl border-gray-300 px-6 font-semibold text-gray-800 normal-case hover:bg-gray-50"
                    >
                        {isApplyingDiscount ? 'Applying...' : 'Apply'}
                    </Button>
                </div>
            )}
        </div>
    );
}
