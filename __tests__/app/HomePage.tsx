import HomePage from '@/app/page';
import { render, screen, act } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { Providers } from '@/providers/Providers';

global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
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

describe('APP - Homepage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should render the ErrorState when no books are returned', async () => {
        mockedFetchBooks.mockResolvedValue({ data: null, error: 'No data found' });

        const element = await HomePage();

        await act(async () => {
            render(element, { wrapper: AllTheProviders });
        });

        expect(screen.getByText(/Connection Interrupted/i)).toBeInTheDocument();
    });

    it('Should render the books when found', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: [
                {
                    id: '1',
                    title: 'Test Book',
                    author: 'Author',
                    price: '10.00',
                    image_url: '/test.jpg',
                    genre: 'Fiction',
                },
            ],
            totalPages: 1,
            currentPage: 1,
            total: 1,
            error: null,
        });

        const element = await HomePage();

        await act(async () => {
            render(element, { wrapper: AllTheProviders });
        });

        expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
});
