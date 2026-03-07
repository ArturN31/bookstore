import { CartItem } from '@/components/CartSidebar/CartItem/CartItem';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { createBackendClient } from '@/utils/db/server';
import { render, screen } from '@testing-library/react';

const mockedBook: Book = {
    id: '1',
    created_at: '',
    updated_at: '',
    title: 'Clarissa',
    author: 'Anton Pavlovich Chekhov',
    genre: 'Classic',
    publisher: 'Da Capo Press',
    publication_date: '2008-06-15',
    price: '£19.59',
    description:
        'Voluptatem valens sui atrox arceo. Vitae cerno dedecor peior sufficio conatus. Charisma tripudio adstringo conqueror theologus. Amplus caelestis voluntarius tenus toties adulescens. Facere nostrum aptus vel aegre. Vulticulus viridis tristis solitudo iure attero adamo cognatus pecco custodia. Aeternus sui acceptus asporto vicinus. In terra vulgo voluptas stipes argumentum. Rerum vinum verus contra. Adimpleo reiciendis demitto mollitia. Assumenda aestivus fuga crux acervus curis dolorem canto. Laboriosam tamen amo aeneus agnitio apostolus voluptates damno.',
    format: 'Audiobook',
    page_count: 341,
    image_url: 'https://placehold.co/400x400@3x/000000/356b7f/jpg?text=Clarissa&font=Raleway',
    stock_quantity: 10,
    is_active: true,
    reviews: [],
};

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
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

        render(<CartItem book={mockedBook} />);

        expect(screen.getByText('Clarissa')).toBeInTheDocument();
    });
});
