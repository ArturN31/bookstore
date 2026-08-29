import { BookCart } from '@/app/book/[slug]/components/Header/BookCart';
import { useCartState } from '@/providers/cart/utils/useCart';
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
    sales_count: 100,
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
    ChangeQuantityForm: (): React.JSX.Element => <div data-testid="change-qty" />,
}));

jest.mock('@/components/CartForms/CartActionForm', () => ({
    CartActionForm: (): React.JSX.Element => <div data-testid="cart-action" />,
}));

const mockUseUserState = jest.mocked(useUserState);
const mockUseCartState = jest.mocked(useCartState);

const createMockUserState = (
    overrides: Partial<ReturnType<typeof useUserState>> = {},
): ReturnType<typeof useUserState> => ({
    loggedIn: true,
    profileExists: true,
    user: {
        id: 'user-123',
        email: 'test@example.com',
        city: 'MockCity',
        country: 'MockCountry',
        date_of_birth: '1990-01-01',
        first_name: 'John',
        last_name: 'Doe',
        username: 'testuser',
        phone_number: '123456789',
        created_at: '',
        updated_at: '',
    } as unknown as User,
    wishlist: [],
    loading: false,
    error: null,
    ...overrides,
});

const createMockCartState = (
    overrides: Partial<ReturnType<typeof useCartState>> = {},
): ReturnType<typeof useCartState> => ({
    cartBooks: [],
    cartBooksAmount: 0,
    cartItemsAmount: 0,
    cartTotal: 0,
    cartID: 'mock-cart-id',
    loading: false,
    ...overrides,
});

describe('APP - pages/book - BookCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserState.mockReturnValue(createMockUserState());
        mockUseCartState.mockReturnValue(createMockCartState());
    });

    it('should render signup prompt when not logged in', async () => {
        mockUseUserState.mockReturnValue(
            createMockUserState({
                loggedIn: false,
                profileExists: false,
                user: null as unknown as User,
            }),
        );

        render(<BookCart book={mockedBook} />);

        expect(await screen.findByText(/Create an account/i)).toBeInTheDocument();
        expect(await screen.findByRole('link', { name: /here/i })).toHaveAttribute(
            'href',
            '/user/auth/signup',
        );
    });

    it('should render change quantity form when book is in cart', async () => {
        mockUseUserState.mockReturnValue(
            createMockUserState({
                loggedIn: true,
                profileExists: true,
            }),
        );
        mockUseCartState.mockReturnValue(
            createMockCartState({
                cartBooks: [{ ...mockedBook, quantity: 1 }],
            }),
        );

        render(<BookCart book={mockedBook} />);

        expect(await screen.findByTestId('change-qty')).toBeInTheDocument();
    });
});
