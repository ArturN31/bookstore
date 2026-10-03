import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import { getCartData } from '@/data/cart/CartService';
import CheckoutPage from '@/app/checkout/page';
import { createMockCartItemsArray } from '@/utils/testing/mockCartItem';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    unstable_cache: (fn: (...args: readonly unknown[]) => unknown) => fn,
}));

jest.mock('@/data/checkout/services/CheckoutUserService');
jest.mock('@/data/cart/CartService');
jest.mock('next/navigation', () => ({
    redirect: jest.fn().mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
    }),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
    })),
}));

describe('CheckoutPage', () => {
    const mockGetUser = jest.mocked(getCurrentUserCheckoutData);
    const mockGetCart = jest.mocked(getCartData);
    const mockRedirect = jest.mocked(redirect);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to login when user session/data is missing', async () => {
        mockGetUser.mockResolvedValueOnce({ error: 'Unauthorized', data: null });

        await expect(CheckoutPage()).rejects.toThrow('NEXT_REDIRECT');

        expect(mockRedirect).toHaveBeenCalledWith('/login?redirect=/checkout');
    });

    it('renders CheckoutEmptyCart when cart items are empty', async () => {
        mockGetUser.mockResolvedValueOnce({
            error: null,
            data: {
                id: 'user-1',
                email: 'test@example.com',
                profile: null,
                stripeCustomerId: null,
            },
        });

        mockGetCart.mockResolvedValueOnce({
            error: null,
            data: {
                cartID: 'cart-1',
                books: [],
            },
        });

        const ui = await CheckoutPage();
        render(ui);

        expect(screen.getByText('Your Bookshelf is Empty')).toBeInTheDocument();
    });

    it('renders CheckoutEmptyCart when cart data is null or undefined (fallback branch)', async () => {
        mockGetUser.mockResolvedValueOnce({
            error: null,
            data: {
                id: 'user-1',
                email: 'test@example.com',
                profile: null,
                stripeCustomerId: null,
            },
        });

        mockGetCart.mockResolvedValueOnce({
            error: null,
            data: null,
        });

        const ui = await CheckoutPage();
        render(ui);

        expect(screen.getByText('Your Bookshelf is Empty')).toBeInTheDocument();
    });

    it('renders Secure Checkout header and CheckoutForm when user and cart data exist', async () => {
        mockGetUser.mockResolvedValueOnce({
            error: null,
            data: {
                id: 'user-1',
                email: 'test@example.com',
                profile: {
                    id: 'prof-1',
                    first_name: 'John',
                    last_name: 'Doe',
                    phone_number: '1234567890',
                    street_address: '123 St',
                    city: 'City',
                    postcode: '12345',
                    country: 'UK',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    date_of_birth: '1990-01-01',
                    username: 'johndoe',
                    are_reviews_public: true,
                    is_profile_public: true,
                    is_wishlist_public: true,
                    wishlist_share_token: null,
                    stripe_customer_id: null,
                },
                stripeCustomerId: 'cus_123',
            },
        });

        mockGetCart.mockResolvedValueOnce({
            error: null,
            data: {
                cartID: 'cart-1',
                books: createMockCartItemsArray(1, {
                    id: 'book-1',
                    title: 'Test Book',
                    price: '15.00',
                    quantity: 1,
                    image_url: 'url',
                    stock_quantity: 5,
                }),
            },
        });

        const ui = await CheckoutPage();
        render(ui);

        expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Complete your purchase securely with encrypted SSL payment processing.',
            ),
        ).toBeInTheDocument();
    });
});
