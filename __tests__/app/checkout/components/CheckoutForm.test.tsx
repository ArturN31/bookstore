import { CheckoutForm } from '@/app/checkout/components/CheckoutForm';
import { useCheckoutForm } from '@/app/checkout/useCheckoutForm';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormEvent, JSX } from 'react';
import { createMockCartItemsArray } from '@/utils/testing/mockCartItem';

jest.mock('@/app/checkout/useCheckoutForm');
jest.mock('@/data/checkout/CheckoutAction', () => ({
    validateAndApplyDiscountAction: jest.fn(),
    processCheckoutAction: jest.fn(),
}));

jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: jest.fn(() => ({})),
    useElements: jest.fn(() => ({})),
    CardElement: (): JSX.Element => <div data-testid="mock-card-element" />,
}));

describe('CheckoutForm', () => {
    const mockUseCheckoutForm = jest.mocked(useCheckoutForm);

    const mockItems = createMockCartItemsArray(1);

    const mockHandleSubmit = jest.fn(async (e: FormEvent) => {
        e.preventDefault();
    });
    const mockSetCouponInput = jest.fn();
    const mockHandleApplyDiscount = jest.fn();
    const mockHandleRemoveDiscount = jest.fn();
    const mockSetSelectedMethodId = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseCheckoutForm.mockReturnValue({
            formData: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '1234567890',
                streetAddress: '123 St',
                city: 'City',
                postcode: 'postcode',
                country: 'United Kingdom',
            },
            shippingMethod: {
                selectedMethodId: 'standard',
                setSelectedMethodId: mockSetSelectedMethodId,
            },
            stripeCustomerId: 'cus_123',
            discount: {
                couponInput: '',
                appliedDiscount: null,
                discountError: null,
                isApplyingDiscount: false,
                setCouponInput: mockSetCouponInput,
                handleApplyDiscount: mockHandleApplyDiscount,
                handleRemoveDiscount: mockHandleRemoveDiscount,
            },
            submission: {
                isSubmitting: false,
                checkoutError: null,
                handleSubmit: mockHandleSubmit,
            },
            totals: {
                subtotal: 20.0,
                discountAmount: 0,
                shippingCost: 5.99,
                taxAmount: 0,
                grandTotal: 25.99,
            },
        });
    });

    it('renders all checkout sections and binds form submission handler', () => {
        const { container } = render(
            <CheckoutForm
                userId="user-123"
                customerEmail="test@example.com"
                stripeCustomerId="cus_123"
                initialProfile={{
                    first_name: 'John',
                    last_name: 'Doe',
                    street_address: '123 St',
                    city: 'City',
                    postcode: 'postcode',
                }}
                initialItems={mockItems}
            />,
        );

        expect(screen.getByText('Deliver To')).toBeInTheDocument();
        expect(screen.getByText('Discount & Promo Code')).toBeInTheDocument();
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Order Summary')).toBeInTheDocument();

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        if (form) {
            fireEvent.submit(form);
            expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
        }
    });
});
