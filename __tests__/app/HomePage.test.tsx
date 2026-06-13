import HomePage from '@/app/page';
import { render, screen, act } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { Providers } from '@/providers/Providers';

interface PaginatedBookResult {
    data: Book[];
    totalPages: number;
    currentPage: number;
    total: number;
}

interface ActionResponse<T> {
    error: string | null;
    data: T | null;
}

global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly scrollMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    disconnect() {}
    observe(target: Element) {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
    unobserve(target: Element) {}
};

global.scrollTo = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            onAuthStateChange: jest.fn(() => ({
                data: {
                    subscription: {
                        unsubscribe: jest.fn(),
                    },
                },
            })),
            getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
    })),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({
        get: jest.fn(() => ({ value: 'mock-token' })),
        getAll: jest.fn(() => []),
    }),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    })),
    usePathname: jest.fn(() => '/'),
    useServerInsertedHTML: jest.fn((callback: () => React.ReactNode) => callback()),
}));

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <Providers
            initialSessionData={{
                initialUser: null,
                initialWishlist: [],
                initialCart: null,
            }}
        >
            {children}
        </Providers>
    );
};

const createMockBook = (overrides: Partial<Book>): Book => ({
    id: '1',
    title: 'Default',
    author: 'Author',
    genre: 'Fiction',
    description: 'Desc',
    price: '10',
    stock_quantity: 5,
    rating: 4,
    review_count: 10,
    image_url: '/test.jpg',
    publisher: 'Pub',
    publication_date: '2024',
    format: 'Paperback',
    page_count: 200,
    created_at: '',
    updated_at: '',
    is_active: true,
    sales_count: null,
    ...overrides,
});

describe('APP - Homepage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should render the ErrorState when no books are returned', async () => {
        const errorResponse: ActionResponse<PaginatedBookResult> = {
            data: null,
            error: 'No data found',
        };
        mockedFetchBooks.mockResolvedValue(errorResponse);

        const element = await HomePage();

        await act(async () => {
            render(element, { wrapper: AllTheProviders });
        });

        expect(screen.getByText(/Archival Retrieval Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/No data found/i)).toBeInTheDocument();
    });

    it('Should render ErrorState with default message when error is null but data is missing (covers ?? branch)', async () => {
        const emptyResponse: ActionResponse<PaginatedBookResult> = { data: null, error: null };
        mockedFetchBooks.mockResolvedValue(emptyResponse);

        const element = await HomePage();

        await act(async () => {
            render(element, { wrapper: AllTheProviders });
        });

        expect(screen.getByText(/Archival Retrieval Failed/i)).toBeInTheDocument();
        expect(
            screen.getByText(/We encountered a problem loading the collection/i),
        ).toBeInTheDocument();
    });

    it('Should render the books when found', async () => {
        const successResponse: ActionResponse<PaginatedBookResult> = {
            error: null,
            data: {
                data: [
                    createMockBook({
                        id: '1',
                        title: 'Test Book',
                        author: 'Author',
                    }),
                ],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        };
        mockedFetchBooks.mockResolvedValue(successResponse);

        const element = await HomePage();

        await act(async () => {
            render(element, { wrapper: AllTheProviders });
        });

        expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
});
