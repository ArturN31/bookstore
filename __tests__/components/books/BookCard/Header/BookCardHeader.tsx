import { BookCardHeader } from '@/components/books/bookCard/Header/BookCardHeader';
import { useUserState } from '@/providers/user/utils/useUser';
import { render, screen } from '@testing-library/react';

const mockedBook: Book = {
    id: 'mock-book-id-123',
    created_at: new Date().getUTCDate().toString(),
    updated_at: new Date().getUTCDate().toString(),
    title: 'The Mock Book',
    author: 'A. Test Author',
    genre: 'Fiction',
    publisher: 'Mock Publisher',
    publication_date: '2023-01-01',
    price: '19.99',
    description: 'A mock description.',
    format: 'Hardcover',
    page_count: 300,
    image_url: 'http://example.com/mock.jpg',
    stock_quantity: 30,
    is_active: true,
    reviews: [],
    rating: 5,
};
jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/data/actions/WishlistForm/WishlistAction', () => ({
    WishlistAction: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        loggedIn: true,
        profileExists: true,
        wishlist: [],
    })),
}));

jest.mock('@/components/books/bookCard/Header/WishlistActionForm', () => ({
    WishlistActionForm: () => <div data-testid="mock-wishlist" />,
}));
jest.mock('@/components/books/bookCard/Header/BookRating', () => ({
    BookRating: () => <div data-testid="mock-rating" />,
}));

describe('APP - BookCard - Header', () => {
    const mockUseUserState = jest.mocked(useUserState);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render wishlist and rating when logged in and stock is high', () => {
        mockUseUserState.mockReturnValue({ loggedIn: true, profileExists: true } as any);

        const { container } = render(<BookCardHeader book={mockedBook} />);

        expect(screen.getByTestId('mock-wishlist')).toBeInTheDocument();
        expect(screen.getByTestId('mock-rating')).toBeInTheDocument();
        expect(screen.queryByText(/left/i)).not.toBeInTheDocument();
    });

    it('should render Low Stock chip and change grid when stock <= 25', () => {
        mockUseUserState.mockReturnValue({ loggedIn: false, profileExists: false } as any);
        const lowStockBook = { ...mockedBook, stock_quantity: 0 };

        const { container } = render(<BookCardHeader book={lowStockBook} />);

        expect(screen.getByText('Sold Out')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
    });

    it('should render Low Stock chip and change grid when stock <= 25', () => {
        mockUseUserState.mockReturnValue({ loggedIn: false, profileExists: false } as any);
        const lowStockBook = { ...mockedBook, stock_quantity: 10 };

        const { container } = render(<BookCardHeader book={lowStockBook} />);

        expect(screen.getByText('10 left')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
    });

    it('should hide wishlist if profileExists is false even if loggedIn', () => {
        mockUseUserState.mockReturnValue({ loggedIn: true, profileExists: false } as any);

        render(<BookCardHeader book={mockedBook} />);

        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
    });
});
