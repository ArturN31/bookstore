import BooksByGroupAndType, { generateMetadata } from '@/app/books/[...slug]/page';
import { render, screen } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        const error = new Error('NEXT_NOT_FOUND');
        (error as any).digest = 'NEXT_NOT_FOUND';
        throw error;
    }),
}));

jest.mock('@/data/books/GetBooksData');
const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;

jest.mock('@/data/actions/WishlistForm/WishlistAction');

jest.mock('@/providers/cart/CartProvider', () => ({
    CartProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useCartState: () => ({
        cartBooks: [],
        loading: false,
        insertBook: jest.fn(),
        removeBook: jest.fn(),
    }),
}));

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: jest.fn(),
}));

jest.mock('@/components/AppBreadcrumbs', () => ({
    AppBreadcrumbs: ({ items }: { items: any[] }) => (
        <nav data-testid="breadcrumbs">
            {items.map((item) => (
                <span key={item.label}>{item.label}</span>
            ))}
        </nav>
    ),
}));

const mockBooksData = [
    {
        id: 'mock-book-1',
        title: 'The Mock Book 1',
        author: 'A. Test Author',
        description: 'A mock description.',
        reviews: [],
    },
];

describe('App - Books[...slug]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Logic & Rendering', () => {
        it('should render list of books and breadcrumbs on success', async () => {
            mockedFetchBooks.mockResolvedValue({
                data: mockBooksData,
                error: null,
            });

            const props = { params: Promise.resolve({ slug: ['genre', 'science-fiction'] }) };
            const element = await BooksByGroupAndType(props);
            render(element);

            expect(screen.getByLabelText('science fiction books collection')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/science fiction/i);
            expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
        });

        it('should trigger notFound when slug has fewer than 2 elements', async () => {
            const shortSlugProps = {
                params: Promise.resolve({ slug: ['only-one-part'] }),
            };

            await expect(BooksByGroupAndType(shortSlugProps)).rejects.toThrow('NEXT_NOT_FOUND');
            expect(notFound).toHaveBeenCalled();
        });

        it('should trigger notFound when fetchBooksWithReviews returns an error', async () => {
            mockedFetchBooks.mockResolvedValue({ data: null, error: 'Database error' });

            const props = { params: Promise.resolve({ slug: ['genre', 'novel'] }) };

            await expect(BooksByGroupAndType(props)).rejects.toThrow('NEXT_NOT_FOUND');
            expect(notFound).toHaveBeenCalled();
        });

        it('should trigger notFound when fetchBooksWithReviews returns an empty array', async () => {
            mockedFetchBooks.mockResolvedValue({ data: [], error: null });

            const props = { params: Promise.resolve({ slug: ['genre', 'novel'] }) };

            await expect(BooksByGroupAndType(props)).rejects.toThrow('NEXT_NOT_FOUND');
        });
    });

    describe('Metadata Generation', () => {
        it('should generate correct metadata with formatted titles', async () => {
            const props = {
                params: Promise.resolve({ slug: ['genre', 'action-adventure'] }),
            };

            const metadata = await generateMetadata(props);

            expect(metadata).toEqual({
                title: 'Action adventure Books | Books4You',
                description:
                    'Explore our selection of action adventure books available in various formats.',
            });
        });

        it('should handle missing type slug in metadata by returning fallback title', async () => {
            const props = {
                params: Promise.resolve({ slug: ['all'] }),
            };

            const metadata = await generateMetadata(props);
            expect(metadata.title).toBe(' Books | Books4You');
        });
    });
});
