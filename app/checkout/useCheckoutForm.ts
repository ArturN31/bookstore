import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/data/cart/CartMapper';
import { AppliedDiscountState } from '@/data/checkout/CheckoutTypes';
import { calculateTotals, generateIdempotencyKey } from '@/data/checkout/CheckoutUtils';
import {
    validateAndApplyDiscountAction,
    processCheckoutAction,
} from '@/data/checkout/CheckoutAction';

export interface UseCheckoutFormProps {
    readonly userId: string;
    readonly customerEmail: string;
    readonly stripeCustomerId: string | null;
    readonly initialProfile: Record<string, unknown> | null;
    readonly initialItems: readonly CartItem[];
}

export function useCheckoutForm({
    customerEmail,
    stripeCustomerId,
    initialProfile,
    initialItems,
}: UseCheckoutFormProps) {
    const router = useRouter();

    const [firstName, setFirstName] = useState<string>(
        (initialProfile?.first_name as string) ?? '',
    );
    const [lastName, setLastName] = useState<string>((initialProfile?.last_name as string) ?? '');
    const [phone, setPhone] = useState<string>((initialProfile?.phone_number as string) ?? '');
    const [streetAddress, setStreetAddress] = useState<string>(
        (initialProfile?.street_address as string) ?? '',
    );
    const [city, setCity] = useState<string>((initialProfile?.city as string) ?? '');
    const [postcode, setPostcode] = useState<string>((initialProfile?.postcode as string) ?? '');
    const [country, setCountry] = useState<string>(
        (initialProfile?.country as string) ?? 'United Kingdom',
    );

    const [couponInput, setCouponInput] = useState<string>('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountState | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [isApplyingDiscount, startDiscountTransition] = useTransition();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const totals = calculateTotals(initialItems, appliedDiscount, 0.0);

    const handleApplyDiscount = () => {
        if (!couponInput.trim()) return;
        setDiscountError(null);

        startDiscountTransition(async () => {
            const result = await validateAndApplyDiscountAction(couponInput, totals.subtotal);
            if (result.success && result.data) {
                setAppliedDiscount(result.data);
                setCouponInput('');
            } else {
                setDiscountError(result.error ?? 'Failed to apply discount code.');
            }
        });
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setCheckoutError(null);

        const idempotencyKey = generateIdempotencyKey();
        const shippingDetails = {
            firstName,
            lastName,
            email: customerEmail,
            phoneNumber: phone,
            streetAddress,
            city,
            postcode,
            country,
            paymentMethod: 'card',
        };

        const payloadItems = initialItems.map((item) => ({
            bookId: item.id,
            quantity: item.quantity,
        }));

        try {
            const result = await processCheckoutAction({
                shippingDetails,
                items: payloadItems,
                discountId: appliedDiscount ? appliedDiscount.code : null,
                idempotencyKey,
            });

            if (!result.success || !result.data?.orderId) {
                setCheckoutError(result.error ?? 'Order placement failed. Please try again.');
                setIsSubmitting(false);
                return;
            }

            router.push(`/checkout/success?orderId=${result.data.orderId}`);
        } catch {
            setCheckoutError('An unexpected error occurred during checkout.');
            setIsSubmitting(false);
        }
    };

    return {
        formData: { firstName, lastName, phone, streetAddress, city, postcode, country },
        setters: {
            setFirstName,
            setLastName,
            setPhone,
            setStreetAddress,
            setCity,
            setPostcode,
            setCountry,
        },
        discount: {
            couponInput,
            setCouponInput,
            appliedDiscount,
            discountError,
            isApplyingDiscount,
            handleApplyDiscount,
            handleRemoveDiscount,
        },
        submission: { isSubmitting, checkoutError, handleSubmit },
        totals,
        stripeCustomerId,
    };
}
