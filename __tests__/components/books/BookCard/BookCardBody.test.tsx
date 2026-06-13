import { BookCardBody } from '@/components/books/bookCard/BookCardBody';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { screen, render } from '@testing-library/react';

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
    stock_quantity: 10,
    is_active: true,
    reviews: [],
    rating: 5,
    sales_count: null,
};

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: jest.fn(),
        back: jest.fn(),
    }),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        username: 'testuser',
    })),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

describe('APP - BookCard - CardBody', () => {
    const mockUseCartState = useCartState as jest.Mock;
    const mockUseCartActions = useCartActions as jest.Mock;
    const mockUseUserState = useUserState as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });

        mockUseCartState.mockReturnValue({
            cartBooks: [],
            cartItemsAmount: 0,
            cartTotal: 0,
            loading: false,
        });

        mockUseCartActions.mockReturnValue({
            refreshCart: jest.fn(),
        });
    });

    it('Should render book title and author', () => {
        render(<BookCardBody book={mockedBook} />);

        expect(screen.getByText('The Mock Book')).toBeInTheDocument();
        expect(screen.getByText('A. Test Author')).toBeInTheDocument();
        expect(screen.getByText('Mock Publisher')).toBeInTheDocument();
        expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('BRANCH COVERAGE: should fallback to empty string if publication_date is missing (covers line 5)', () => {
        const bookWithoutDate: Book = {
            ...mockedBook,
            publication_date: '',
        };

        const { container } = render(<BookCardBody book={bookWithoutDate} />);

        expect(screen.getByText('The Mock Book')).toBeInTheDocument();
        expect(screen.getByText('Mock Publisher')).toBeInTheDocument();
        expect(screen.queryByText('2023')).not.toBeInTheDocument();
    });
});
