import React from 'react';
import { render, screen } from '@testing-library/react';
import { getWishlistByShareToken } from '@/data/user/wishlist/sharing/WishlistShareService';
import SharedTokenWishlistPage from '@/app/user/wishlist/shared/token/[token]/page';

jest.mock('@/data/user/wishlist/sharing/WishlistShareService');

jest.mock('@/app/user/wishlist/shared/[username]/components/RestrictedAccessView', () => ({
    RestrictedAccessView: ({
        username,
        isPublicMode,
    }: {
        username: string;
        isPublicMode: boolean;
    }) => (
        <div data-testid="restricted-access-view">
            Restricted: {username}, {String(isPublicMode)}
        </div>
    ),
}));

jest.mock('@/app/user/wishlist/shared/[username]/components/SharedWishlistHeader', () => ({
    SharedWishlistHeader: () => <div data-testid="shared-header" />,
}));

jest.mock('@/app/user/wishlist/shared/[username]/components/SharedWishlistHero', () => ({
    SharedWishlistHero: ({ username, totalBooks }: { username: string; totalBooks: number }) => (
        <div data-testid="shared-hero">
            Hero: {username}, Books: {totalBooks}
        </div>
    ),
}));

jest.mock('@/app/user/wishlist/shared/[username]/components/EmptyWishlistView', () => ({
    EmptyWishlistView: () => <div data-testid="empty-wishlist-view" />,
}));

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: () => <div data-testid="books-manager" />,
}));

describe('SharedTokenWishlistPage', () => {
    const mockedGetWishlistByShareToken = getWishlistByShareToken as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders RestrictedAccessView when data is null', async () => {
        mockedGetWishlistByShareToken.mockResolvedValueOnce({ data: null });

        const ui = await SharedTokenWishlistPage({
            params: Promise.resolve({ token: 'secret-token' }),
        });
        render(ui);

        expect(screen.getByTestId('restricted-access-view')).toBeInTheDocument();
        expect(screen.getByText('Restricted: secret-token, false')).toBeInTheDocument();
    });

    it('renders RestrictedAccessView when service throws an error', async () => {
        mockedGetWishlistByShareToken.mockRejectedValueOnce(new Error('Network error'));

        const ui = await SharedTokenWishlistPage({
            params: Promise.resolve({ token: 'secret-token' }),
        });
        render(ui);

        expect(screen.getByTestId('restricted-access-view')).toBeInTheDocument();
        expect(screen.getByText('Restricted: secret-token, false')).toBeInTheDocument();
    });

    it('renders EmptyWishlistView when wishlist is empty', async () => {
        mockedGetWishlistByShareToken.mockResolvedValueOnce({
            data: {
                username: 'tokenuser',
                wishlist: [],
            },
        });

        const ui = await SharedTokenWishlistPage({
            params: Promise.resolve({ token: 'secret-token' }),
        });
        render(ui);

        expect(screen.getByTestId('shared-header')).toBeInTheDocument();
        expect(screen.getByTestId('shared-hero')).toBeInTheDocument();
        expect(screen.getByTestId('empty-wishlist-view')).toBeInTheDocument();
    });

    it('renders EmptyWishlistView and defaults to empty array when wishlist property is undefined', async () => {
        mockedGetWishlistByShareToken.mockResolvedValueOnce({
            data: {
                username: 'tokenuser',
            },
        });

        const ui = await SharedTokenWishlistPage({
            params: Promise.resolve({ token: 'secret-token' }),
        });
        render(ui);

        expect(screen.getByTestId('shared-header')).toBeInTheDocument();
        expect(screen.getByTestId('shared-hero')).toBeInTheDocument();
        expect(screen.getByTestId('empty-wishlist-view')).toBeInTheDocument();
    });

    it('renders BooksManager when wishlist contains books', async () => {
        mockedGetWishlistByShareToken.mockResolvedValueOnce({
            data: {
                username: 'tokenuser',
                wishlist: [
                    {
                        books: {
                            id: '1',
                            title: 'Token Book',
                        },
                    },
                ],
            },
        });

        const ui = await SharedTokenWishlistPage({
            params: Promise.resolve({ token: 'secret-token' }),
        });
        render(ui);

        expect(screen.getByTestId('shared-header')).toBeInTheDocument();
        expect(screen.getByTestId('shared-hero')).toBeInTheDocument();
        expect(screen.getByTestId('books-manager')).toBeInTheDocument();
    });
});
