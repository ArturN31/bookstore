import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CartItem } from '@/data/cart/CartMapper';
import { AppliedDiscountState } from '@/data/checkout/CheckoutTypes';
import { calculateTotals, generateIdempotencyKey } from '@/data/checkout/CheckoutUtils';
import { DEFAULT_SHIPPING_METHOD_ID } from '@/data/checkout/CheckoutConstants';
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
    const stripe = useStripe();
    const elements = useElements();

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

    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>(
        DEFAULT_SHIPPING_METHOD_ID,
    );

    const [couponInput, setCouponInput] = useState<string>('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscountState | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [isApplyingDiscount, startDiscountTransition] = useTransition();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const totals = calculateTotals(
        initialItems,
        appliedDiscount,
        postcode,
        selectedShippingMethodId,
    );

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

        if (!stripe || !elements) {
            setCheckoutError('Payment system is initializing. Please try again in a moment.');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setCheckoutError('Please enter your credit or debit card details.');
            return;
        }

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
                discountId: appliedDiscount ? appliedDiscount.id : null,
                shippingMethodId: selectedShippingMethodId,
                idempotencyKey,
            });

            if (!result.success || !result.data?.orderId || !result.data?.clientSecret) {
                setCheckoutError(result.error ?? 'Order placement failed. Please try again.');
                setIsSubmitting(false);
                return;
            }

            const confirmResult = await stripe.confirmCardPayment(result.data.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${firstName} ${lastName}`.trim(),
                        email: customerEmail,
                        phone: phone,
                        address: {
                            line1: streetAddress,
                            city: city,
                            postal_code: postcode,
                            country: 'GB',
                        },
                    },
                },
            });

            if (confirmResult.error) {
                setCheckoutError(confirmResult.error.message ?? 'Payment confirmation failed.');
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
        shippingMethod: {
            selectedMethodId: selectedShippingMethodId,
            setSelectedMethodId: setSelectedShippingMethodId,
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
