import { BookCard } from '@/components/books/bookCard/BookCard';
import { render } from '@testing-library/react';
import { createBackendClient } from '@/utils/db/server';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';

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
        username: 'testuser',
    })),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: jest.fn(),
        back: jest.fn(),
    }),
}));

describe('APP - BookCard', () => {
    const mockedCreateClient = createBackendClient as jest.Mock;
    const mockUseCartState = useCartState as jest.Mock;
    const mockUseCartActions = useCartActions as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseCartState.mockReturnValue({
            cartBooks: [],
            cartItemsAmount: 0,
            cartTotal: '0.00',
            loading: false,
        });

        mockUseCartActions.mockReturnValue({
            refreshCart: jest.fn(),
        });
    });

    it('Should render component', () => {
        mockedCreateClient.mockReturnValue({
            auth: {
                getSession: jest.fn().mockResolvedValue({
                    data: { session: { user: { email: 'test@test.com' } } },
                }),
            },
        });

        render(<BookCard book={mockedBook} />);
    });
});
