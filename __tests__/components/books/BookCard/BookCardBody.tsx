import { BookCardBody } from '@/components/books/bookCard/Body/BookCardBody';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { screen, render, fireEvent } from '@testing-library/react';

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

    it('Should navigate to page on click', () => {
        render(<BookCardBody book={mockedBook} />);

        const card = screen.getByTestId(`book-card-body-${mockedBook.title}`);
        fireEvent.click(card);

        expect(mockPush).toHaveBeenCalledWith(`/book/${mockedBook.id}`);
    });
});
