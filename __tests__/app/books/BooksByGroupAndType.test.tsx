import BooksByGroupAndType, { generateMetadata } from '@/app/books/[...slug]/page';
import { render, screen } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { BreadcrumbItem } from '@/components/ui/AppBreadcrumbs';

interface PageParams {
    params: Promise<{ slug: string[] }>;
}

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        const error = new Error('NEXT_NOT_FOUND');
        (error as Error & { digest?: string }).digest = 'NEXT_NOT_FOUND';
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
    BooksManager: jest.fn(() => <div data-testid="books-manager" />),
}));

jest.mock('@/components/ui/AppBreadcrumbs', () => ({
    AppBreadcrumbs: ({ items }: { items: BreadcrumbItem[] }) => (
        <nav data-testid="breadcrumbs">
            {items.map((item) => (
                <span
                    key={item.label}
                    data-active={item.active}
                    data-count={item.count}
                >
                    {item.label}
                </span>
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
                error: null,
                data: {
                    data: mockBooksData,
                    totalPages: 1,
                    currentPage: 1,
                    total: mockBooksData.length,
                },
            });

            const props: PageParams = {
                params: Promise.resolve({ slug: ['genre', 'science-fiction'] }),
            };
            const element = await BooksByGroupAndType(props);
            render(element);

            expect(screen.getByLabelText('science fiction collection')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/science fiction/i);
            expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
        });

        it('should trigger notFound when slug has fewer than 2 elements', async () => {
            const shortSlugProps: PageParams = {
                params: Promise.resolve({ slug: ['only-one-part'] }),
            };

            await expect(BooksByGroupAndType(shortSlugProps)).rejects.toThrow('NEXT_NOT_FOUND');
            expect(notFound).toHaveBeenCalled();
        });

        it('should trigger notFound when fetchBooksWithReviews returns an error', async () => {
            mockedFetchBooks.mockResolvedValue({ data: null, error: 'Database error' });

            const props: PageParams = { params: Promise.resolve({ slug: ['genre', 'novel'] }) };

            await expect(BooksByGroupAndType(props)).rejects.toThrow('NEXT_NOT_FOUND');
            expect(notFound).toHaveBeenCalled();
        });

        it('should trigger notFound when fetchBooksWithReviews returns an empty array', async () => {
            mockedFetchBooks.mockResolvedValue({ data: [], error: null });

            const props: PageParams = { params: Promise.resolve({ slug: ['genre', 'novel'] }) };

            await expect(BooksByGroupAndType(props)).rejects.toThrow('NEXT_NOT_FOUND');
        });
    });

    describe('Metadata Generation', () => {
        it('should generate correct metadata with formatted titles', async () => {
            const props: PageParams = {
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
            const props: PageParams = {
                params: Promise.resolve({ slug: ['all'] }),
            };

            const metadata = await generateMetadata(props);
            expect(metadata.title).toBe('Books | Books4You');
        });

        it('should format type with dashes correctly (covers formatLabel replace branch)', async () => {
            const props: PageParams = {
                params: Promise.resolve({ slug: ['genre', 'sci-fi-books'] }),
            };

            const metadata = await generateMetadata(props);

            expect(metadata.title).toBe('Sci fi books Books | Books4You');
            expect(metadata.description).toContain('sci fi books');
        });

        it('should handle empty slug[1] with fallback (covers line 14 || branch)', async () => {
            const props: PageParams = {
                params: Promise.resolve({ slug: ['genre', ''] }),
            };

            const metadata = await generateMetadata(props);

            expect(metadata.title).toBe(' Books | Books4You');
        });
    });

    describe('Singular vs Plural Books Display', () => {
        it('should display singular "book" when total is 1 (covers line 70)', async () => {
            mockedFetchBooks.mockResolvedValue({
                error: null,
                data: {
                    data: [mockBooksData[0]],
                    totalPages: 1,
                    currentPage: 1,
                    total: 1,
                },
            });

            const props: PageParams = { params: Promise.resolve({ slug: ['genre', 'fiction'] }) };
            const element = await BooksByGroupAndType(props);
            render(element);

            const paragraph = screen.getByText(/Showing/i).closest('p');
            expect(paragraph?.textContent).toContain('book');
            expect(paragraph?.textContent).not.toContain('books');
        });

        it('should display plural "books" when total is more than 1', async () => {
            mockedFetchBooks.mockResolvedValue({
                error: null,
                data: {
                    data: mockBooksData,
                    totalPages: 1,
                    currentPage: 1,
                    total: 5,
                },
            });

            const props: PageParams = { params: Promise.resolve({ slug: ['genre', 'fiction'] }) };
            const element = await BooksByGroupAndType(props);
            render(element);

            const paragraph = screen.getByText(/Showing/i).closest('p');
            expect(paragraph?.textContent).toContain('books');
        });
    });
});
