import { CartItemContent } from '@/components/CartSidebar/CartItem/CartItemContent';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { screen, render } from '@testing-library/react';

jest.mock('@/components/CartForms/ChangeQuantityForm', () => ({
    ChangeQuantityForm: () => <div data-testid="quantity-controls" />,
}));

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
    sales_count: null,
};

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

describe('APP - CartSidebar - CartItemContent', () => {
    const mockUseCartState = useCartState as jest.Mock;
    const mockUseCartActions = useCartActions as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseCartState.mockReturnValue({
            cartBooks: [],
            loading: false,
        });

        mockUseCartActions.mockReturnValue({
            refreshCart: jest.fn(),
        });
    });

    it('should fallback to 0 quantity if book is not found in cartBooks', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [],
            loading: false,
        });

        render(<CartItemContent book={mockedBook} />);

        expect(screen.getByText(/£0\.00/)).toBeInTheDocument();
    });

    it('should render correctly with all data (Title, Price, Subtotal, Image)', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [{ ...mockedBook, quantity: 2 }],
            loading: false,
        });

        render(<CartItemContent book={mockedBook} />);

        expect(screen.getByText('Clarissa')).toBeInTheDocument();
        expect(screen.getByText(/£39\.18/)).toBeInTheDocument();
        expect(screen.getByText(/£19\.59/)).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('alt', 'Clarissa');
    });

    it('should process parsePrice edge cases', () => {
        const nonStringPrice = { ...mockedBook, price: 19.59 as any };
        mockUseCartState.mockReturnValue({
            cartBooks: [{ ...nonStringPrice, quantity: 1 }],
            loading: false,
        });

        const { rerender } = render(<CartItemContent book={nonStringPrice} />);

        expect(screen.getByText(/£0\.00/)).toBeInTheDocument();

        const emptyPrice = { ...mockedBook, price: '' };
        mockUseCartState.mockReturnValue({
            cartBooks: [{ ...emptyPrice, quantity: 1 }],
            loading: false,
        });

        rerender(<CartItemContent book={emptyPrice} />);
        expect(screen.getByText(/£0\.00/)).toBeInTheDocument();
    });

    it('should render fallbacks for missing title and image alt text', () => {
        const skeletonBook = {
            ...mockedBook,
            title: '',
        };

        mockUseCartState.mockReturnValue({
            cartBooks: [{ ...skeletonBook, quantity: 1 }],
            loading: false,
        });

        render(<CartItemContent book={skeletonBook} />);

        expect(screen.getByText('Unknown Title')).toBeInTheDocument();

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', 'Book cover');
    });
});
