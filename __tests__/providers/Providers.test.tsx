import { render, screen } from '@testing-library/react';
import { Providers, SessionData } from '@/providers/Providers';
import React from 'react';

interface UserMockProps {
    children: React.ReactNode;
    initialUser?: { id: string; username: string } | null;
    initialWishlist?: Array<{ book_id: string }> | null;
}

interface CartMockProps {
    children: React.ReactNode;
    initialCart?: { cartID: string } | null;
}

jest.mock('notistack', () => ({
    SnackbarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/providers/user/UserProvider', () => ({
    UserProvider: ({ children, initialUser, initialWishlist }: UserMockProps) => (
        <div
            data-testid="user-provider"
            data-user={initialUser?.id || 'none'}
            data-wishlist={initialWishlist?.length || 0}
        >
            {children}
        </div>
    ),
}));

jest.mock('@/providers/cart/CartProvider', () => ({
    CartProvider: ({ children, initialCart }: CartMockProps) => (
        <div
            data-testid="cart-provider"
            data-cart={initialCart?.cartID || 'none'}
        >
            {children}
        </div>
    ),
}));

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    BookAdvancedFilteringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useBookFilter: jest.fn(),
    useBookAdvancedFiltering: jest.fn(),
}));

describe('Providers', () => {
    it('should render with undefined initialSessionData', () => {
        render(
            <Providers>
                <span>Test Content</span>
            </Providers>,
        );

        expect(screen.getByTestId('user-provider')).toBeInTheDocument();
        expect(screen.getByTestId('cart-provider')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with null initialSessionData', () => {
        render(
            <Providers initialSessionData={null as unknown as SessionData}>
                <span>Test Content</span>
            </Providers>,
        );

        expect(screen.getByTestId('user-provider')).toBeInTheDocument();
    });

    it('should pass initialUser to UserProvider', () => {
        const initialSessionData: SessionData = {
            initialUser: {
                id: 'user-123',
                username: 'testuser',
            } as unknown as SessionData['initialUser'],
            initialWishlist: null,
            initialCart: null,
        };

        render(
            <Providers initialSessionData={initialSessionData}>
                <span>Test Content</span>
            </Providers>,
        );

        expect(screen.getByTestId('user-provider')).toHaveAttribute('data-user', 'user-123');
    });

    it('should pass initialWishlist to UserProvider', () => {
        const initialSessionData: SessionData = {
            initialUser: null,
            initialWishlist: [
                { book_id: 'book-1' },
                { book_id: 'book-2' },
            ] as unknown as SessionData['initialWishlist'],
            initialCart: null,
        };

        render(
            <Providers initialSessionData={initialSessionData}>
                <span>Test Content</span>
            </Providers>,
        );

        expect(screen.getByTestId('user-provider')).toHaveAttribute('data-wishlist', '2');
    });

    it('should pass initialCart to CartProvider', () => {
        const initialSessionData: SessionData = {
            initialUser: null,
            initialWishlist: null,
            initialCart: { cartID: 'cart-123' } as unknown as SessionData['initialCart'],
        };

        render(
            <Providers initialSessionData={initialSessionData}>
                <span>Test Content</span>
            </Providers>,
        );

        expect(screen.getByTestId('cart-provider')).toHaveAttribute('data-cart', 'cart-123');
    });

    it('should render children within all providers', () => {
        render(
            <Providers>
                <div>Child Content</div>
            </Providers>,
        );

        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
