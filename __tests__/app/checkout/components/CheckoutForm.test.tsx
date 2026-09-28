import { CheckoutForm } from '@/app/checkout/components/CheckoutForm';
import { useCheckoutForm } from '@/app/checkout/useCheckoutForm';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItem } from '@/data/cart/CartMapper';
import { FormEvent } from 'react';

jest.mock('@/app/checkout/useCheckoutForm');

describe('CheckoutForm', () => {
    const mockUseCheckoutForm = jest.mocked(useCheckoutForm);

    const mockItems: readonly CartItem[] = [
        {
            id: 'book-1',
            title: 'Test Book',
            price: '20.00',
            quantity: 1,
            author: 'Test Author',
            created_at: '2026-01-01',
            description: 'Test Description',
            format: 'Paperback',
            genre: 'Fiction',
            image_url: 'https://example.com/cover.jpg',
            is_active: true,
            page_count: 200,
            publication_date: '2026-01-01',
            publisher: 'Test Publisher',
            sales_count: 0,
            stock_quantity: 5,
            updated_at: '2026-01-01',
        },
    ];

    const mockHandleSubmit = jest.fn(async (e: FormEvent) => {
        e.preventDefault();
    });
    const mockSetCouponInput = jest.fn();
    const mockHandleApplyDiscount = jest.fn();
    const mockHandleRemoveDiscount = jest.fn();

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
            setters: {
                setFirstName: jest.fn(),
                setLastName: jest.fn(),
                setPhone: jest.fn(),
                setStreetAddress: jest.fn(),
                setCity: jest.fn(),
                setPostcode: jest.fn(),
                setCountry: jest.fn(),
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
