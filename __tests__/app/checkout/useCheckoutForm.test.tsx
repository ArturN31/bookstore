import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckoutForm } from '@/app/checkout/useCheckoutForm';
import { CartItem } from '@/data/cart/CartMapper';
import {
    validateAndApplyDiscountAction,
    processCheckoutAction,
} from '@/data/checkout/CheckoutAction';
import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/data/checkout/CheckoutAction', () => ({
    validateAndApplyDiscountAction: jest.fn(),
    processCheckoutAction: jest.fn(),
}));

const mockConfirmCardPayment = jest
    .fn()
    .mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
const mockGetElement = jest.fn().mockReturnValue({});

const mockUseStripe = jest.fn(() => ({
    confirmCardPayment: mockConfirmCardPayment,
    confirmPayment: jest.fn(),
}));

const mockUseElements = jest.fn(() => ({
    getElement: mockGetElement,
}));

jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: () => mockUseStripe(),
    useElements: () => mockUseElements(),
    CardElement: () => null,
}));

describe('useCheckoutForm', () => {
    const mockPush = jest.fn();
    const mockValidateDiscount = jest.mocked(validateAndApplyDiscountAction);
    const mockProcessCheckout = jest.mocked(processCheckoutAction);

    const mockItems: readonly CartItem[] = [
        {
            id: 'book-1',
            title: 'Test Book',
            price: '20.00',
            quantity: 1,
            author: 'Test Author',
            created_at: '2026-01-01',
            description: 'Desc',
            format: 'Paperback',
            genre: 'Fiction',
            image_url: 'https://example.com/img.jpg',
            is_active: true,
            page_count: 100,
            publication_date: '2026-01-01',
            publisher: 'Publisher',
            sales_count: 0,
            stock_quantity: 10,
            updated_at: '2026-01-01',
        },
    ];

    const defaultProps = {
        userId: 'user-123',
        customerEmail: 'test@example.com',
        stripeCustomerId: 'cus_123',
        initialProfile: {
            first_name: 'John',
            last_name: 'Doe',
            phone_number: '1234567890',
            street_address: '123 High St',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
        },
        initialItems: mockItems,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfirmCardPayment.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
        mockGetElement.mockReturnValue({});
        mockUseStripe.mockReturnValue({
            confirmCardPayment: mockConfirmCardPayment,
            confirmPayment: jest.fn(),
        } as never);
        mockUseElements.mockReturnValue({
            getElement: mockGetElement,
        } as never);
        jest.mocked(useRouter).mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            refresh: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            prefetch: jest.fn(),
            bfcacheId: 0,
        } as unknown as AppRouterInstance);
    });

    it('initializes form state correctly from initialProfile and initialItems', () => {
        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        expect(result.current.formData.firstName).toBe('John');
        expect(result.current.formData.lastName).toBe('Doe');
        expect(result.current.formData.phone).toBe('1234567890');
        expect(result.current.formData.streetAddress).toBe('123 High St');
        expect(result.current.formData.city).toBe('London');
        expect(result.current.formData.postcode).toBe('SW1A 1AA');
        expect(result.current.formData.country).toBe('United Kingdom');
        expect(result.current.totals.subtotal).toBe(20.0);
    });

    it('initializes form state with empty string defaults and United Kingdom when initialProfile is null', () => {
        const { result } = renderHook(() =>
            useCheckoutForm({
                ...defaultProps,
                initialProfile: null,
            }),
        );

        expect(result.current.formData.firstName).toBe('');
        expect(result.current.formData.lastName).toBe('');
        expect(result.current.formData.phone).toBe('');
        expect(result.current.formData.streetAddress).toBe('');
        expect(result.current.formData.city).toBe('');
        expect(result.current.formData.postcode).toBe('');
        expect(result.current.formData.country).toBe('United Kingdom');
    });

    it('does not attempt to apply discount if couponInput is empty or whitespace', async () => {
        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.setCouponInput('   ');
        });

        await act(async () => {
            result.current.discount.handleApplyDiscount();
        });

        expect(mockValidateDiscount).not.toHaveBeenCalled();
        expect(result.current.discount.appliedDiscount).toBeNull();
    });

    it('successfully applies a discount code', async () => {
        mockValidateDiscount.mockResolvedValueOnce({
            success: true,
            data: {
                id: '123',
                code: 'SAVE10',
                discountAmount: 2.0,
                discountPercent: 10,
                minimumSubtotal: null,
            },
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.setCouponInput('SAVE10');
        });

        expect(result.current.discount.couponInput).toBe('SAVE10');

        await act(async () => {
            result.current.discount.handleApplyDiscount();
        });

        await waitFor(() => {
            expect(result.current.discount.appliedDiscount?.code).toBe('SAVE10');
            expect(result.current.discount.couponInput).toBe('');
            expect(result.current.discount.discountError).toBeNull();
        });
    });

    it('sets discountError when discount validation fails', async () => {
        mockValidateDiscount.mockResolvedValueOnce({
            success: false,
            error: 'Invalid or expired promo code.',
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.setCouponInput('BADCODE');
        });

        await act(async () => {
            result.current.discount.handleApplyDiscount();
        });

        await waitFor(() => {
            expect(result.current.discount.discountError).toBe('Invalid or expired promo code.');
            expect(result.current.discount.appliedDiscount).toBeNull();
        });
    });

    it('sets default discount error when validation fails without error message', async () => {
        mockValidateDiscount.mockResolvedValueOnce({
            success: false,
            error: undefined,
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.setCouponInput('FAILCODE');
        });

        await act(async () => {
            result.current.discount.handleApplyDiscount();
        });

        await waitFor(() => {
            expect(result.current.discount.discountError).toBe('Failed to apply discount code.');
            expect(result.current.discount.appliedDiscount).toBeNull();
        });
    });

    it('removes applied discount correctly', () => {
        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.handleRemoveDiscount();
        });

        expect(result.current.discount.appliedDiscount).toBeNull();
        expect(result.current.discount.discountError).toBeNull();
    });

    it('prevents multiple concurrent submissions when isSubmitting is true', async () => {
        mockProcessCheckout.mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        act(() => {
            void result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.isSubmitting).toBe(true);

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(mockProcessCheckout).toHaveBeenCalledTimes(1);
    });

    it('sets checkoutError when stripe or elements is null', async () => {
        mockUseStripe.mockReturnValueOnce(null as never);

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe(
            'Payment system is initializing. Please try again in a moment.',
        );
        expect(mockProcessCheckout).not.toHaveBeenCalled();
    });

    it('sets checkoutError when CardElement is not found in elements', async () => {
        mockGetElement.mockReturnValueOnce(null);

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe(
            'Please enter your credit or debit card details.',
        );
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockProcessCheckout).not.toHaveBeenCalled();
    });

    it('passes applied discount code in checkout payload when discount is active', async () => {
        mockValidateDiscount.mockResolvedValueOnce({
            success: true,
            data: {
                id: 'disc-123',
                code: 'SAVE20',
                discountAmount: 4.0,
                discountPercent: 20,
                minimumSubtotal: null,
            },
        });
        mockProcessCheckout.mockResolvedValueOnce({
            success: true,
            data: {
                orderId: 'order-discount',
                success: true,
                clientSecret: 'sec',
                paymentIntentId: 'pi',
                error: null,
            },
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));

        act(() => {
            result.current.discount.setCouponInput('SAVE20');
        });

        await act(async () => {
            result.current.discount.handleApplyDiscount();
        });

        await waitFor(() => {
            expect(result.current.discount.appliedDiscount?.code).toBe('SAVE20');
        });

        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;
        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(mockProcessCheckout).toHaveBeenCalledWith(
            expect.objectContaining({
                discountId: 'disc-123',
            }),
        );
    });

    it('processes checkout successfully and redirects to success page', async () => {
        mockProcessCheckout.mockResolvedValueOnce({
            success: true,
            data: {
                orderId: 'order-xyz',
                success: true,
                clientSecret: 'pi_secret_123',
                paymentIntentId: 'pi_123',
                error: null,
            },
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockProcessCheckout).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/checkout/success?orderId=order-xyz');
    });

    it('sets checkoutError when stripe confirmCardPayment returns an error with message', async () => {
        mockProcessCheckout.mockResolvedValueOnce({
            success: true,
            data: {
                orderId: 'order-xyz',
                success: true,
                clientSecret: 'pi_secret_123',
                paymentIntentId: 'pi_123',
                error: null,
            },
        });
        mockConfirmCardPayment.mockResolvedValueOnce({
            error: { message: 'Your card was declined.' },
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe('Your card was declined.');
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('sets fallback error when stripe confirmCardPayment returns an error without message', async () => {
        mockProcessCheckout.mockResolvedValueOnce({
            success: true,
            data: {
                orderId: 'order-xyz',
                success: true,
                clientSecret: 'pi_secret_123',
                paymentIntentId: 'pi_123',
                error: null,
            },
        });
        mockConfirmCardPayment.mockResolvedValueOnce({
            error: {},
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe(
            'Payment confirmation failed. Check card details.',
        );
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles checkout failure gracefully by setting checkoutError', async () => {
        mockProcessCheckout.mockResolvedValueOnce({
            success: false,
            error: 'Payment declined.',
            data: undefined,
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe('Payment declined.');
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('sets default checkout error when order placement fails without explicit error', async () => {
        mockProcessCheckout.mockResolvedValueOnce({
            success: false,
            error: undefined,
            data: undefined,
        });

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe(
            'Order placement failed. Please try again.',
        );
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles unexpected thrown errors during checkout submission and sets fallback error', async () => {
        mockProcessCheckout.mockRejectedValueOnce(new Error('Network failure'));

        const { result } = renderHook(() => useCheckoutForm(defaultProps));
        const mockEvent = { preventDefault: jest.fn() } as unknown as FormEvent;

        await act(async () => {
            await result.current.submission.handleSubmit(mockEvent);
        });

        expect(result.current.submission.checkoutError).toBe(
            'An unexpected error occurred during checkout.',
        );
        expect(result.current.submission.isSubmitting).toBe(false);
        expect(mockPush).not.toHaveBeenCalled();
    });
});
