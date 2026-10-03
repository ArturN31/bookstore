'use client';

import { JSX } from 'react';
import { CartItem } from '@/data/cart/CartMapper';
import { ShippingAddressSection } from './ShippingAddressSection';
import { ShippingMethodSection } from './ShippingMethodSection';
import { DiscountSection } from './DiscountSection';
import { PaymentMethodSection } from './PaymentMethodSection';
import { OrderSummarySidebar } from './OrderSummarySidebar';
import { useCheckoutForm } from '../useCheckoutForm';

export interface CheckoutFormProps {
    readonly userId: string;
    readonly customerEmail: string;
    readonly stripeCustomerId: string | null;
    readonly initialProfile: Record<string, unknown> | null;
    readonly initialItems: readonly CartItem[];
}

export function CheckoutForm(props: CheckoutFormProps): JSX.Element {
    const { discount, shippingMethod, submission, totals, formData } = useCheckoutForm(props);
    const subtotalAfterDiscount = Math.max(0, totals.subtotal - totals.discountAmount);

    return (
        <form
            onSubmit={submission.handleSubmit}
            className="grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
            <div className="space-y-6 lg:col-span-7">
                <ShippingAddressSection
                    customerEmail={props.customerEmail}
                    initialProfile={props.initialProfile}
                />

                <ShippingMethodSection
                    selectedMethodId={shippingMethod.selectedMethodId}
                    postcode={formData.postcode}
                    subtotalAfterDiscount={subtotalAfterDiscount}
                    onSelectMethod={shippingMethod.setSelectedMethodId}
                />

                <DiscountSection
                    couponInput={discount.couponInput}
                    appliedDiscount={discount.appliedDiscount}
                    discountError={discount.discountError}
                    isApplyingDiscount={discount.isApplyingDiscount}
                    onCouponChange={discount.setCouponInput}
                    onApplyDiscount={discount.handleApplyDiscount}
                    onRemoveDiscount={discount.handleRemoveDiscount}
                />

                <PaymentMethodSection />
            </div>

            <div className="lg:col-span-5">
                <OrderSummarySidebar
                    initialItems={props.initialItems}
                    totals={totals}
                    appliedDiscount={discount.appliedDiscount}
                    isSubmitting={submission.isSubmitting}
                    checkoutError={submission.checkoutError}
                />
            </div>
        </form>
    );
}
