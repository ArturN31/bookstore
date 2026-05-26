import { CartItem } from '@/components/CartSidebar/CartItem/CartItem';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { createBackendClient } from '@/utils/db/server';
import { render, screen } from '@testing-library/react';

const createMockBook = (overrides: Partial<Book>): Book => ({
    id: '1',
    title: 'Default',
    author: 'Author',
    genre: 'Genre',
    description: 'Desc',
    price: '10',
    rating: 4,
    review_count: 10,
    sales_count: null,
    stock_quantity: 100,
    image_url: '',
    publisher: 'Pub',
    publication_date: '2024',
    format: 'Paperback',
    page_count: 200,
    created_at: '',
    updated_at: '',
    is_active: true,
    ...overrides,
});

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        user: { id: 'user-123' },
        username: 'testuser',
    })),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

describe('APP - CartSidebar - CartItem', () => {
    const mockedCreateClient = createBackendClient as jest.Mock;
    const mockUseCartState = useCartState as jest.Mock;
    const mockUseCartActions = useCartActions as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseCartState.mockReturnValue({
            cartBooks: [{ id: '1', quantity: 1 }],
            loading: false,
        });

        mockUseCartActions.mockReturnValue({
            refreshCart: jest.fn(),
        });
    });

    it('should render component', async () => {
        mockedCreateClient.mockReturnValue({
            auth: {
                getSession: jest.fn().mockResolvedValue({
                    data: { session: { user: { email: 'test@test.com' } } },
                }),
            },
        });

        render(<CartItem book={createMockBook({ id: '1', title: 'Book 1' })} />);

        expect(screen.getByText('Book 1')).toBeInTheDocument();
    });
});
