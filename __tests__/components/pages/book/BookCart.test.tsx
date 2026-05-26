import { BookCart } from '@/components/pages/book/BookCart';
import { useCartState } from '@/providers/cart/utils/useCart';
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
    stock_quantity: 30,
    is_active: true,
    reviews: [],
    rating: 5,
};

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
}));
jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
}));

jest.mock('@/components/CartForms/ChangeQuantityForm', () => ({
    ChangeQuantityForm: () => <div data-testid="change-qty" />,
}));
jest.mock('@/components/CartForms/CartActionForm', () => ({
    CartActionForm: () => <div data-testid="cart-action" />,
}));

describe('APP - pages/book - BookCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });
        (useCartState as jest.Mock).mockReturnValue({ cartBooks: [] });
    });

    it('should render signup prompt when not logged in', () => {
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: false,
            profileExists: false,
        });

        render(<BookCart book={mockedBook} />);

        expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /here/i })).toHaveAttribute(
            'href',
            '/user/auth/signup',
        );
    });

    it('should render change quantity form when book is in cart', () => {
        (useUserState as jest.Mock).mockReturnValue({ loggedIn: true, profileExists: true });
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [{ id: 'mock-book-id-123' }],
        });

        render(<BookCart book={mockedBook} />);

        expect(screen.getByTestId('change-qty')).toBeInTheDocument();
    });
});
