import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/layout/UserNavbar/SearchBar/SearchBar';
import { useBookSearch } from '@/hooks/SearchBar/useBookSearch';
import { useSearchNavigation } from '@/hooks/SearchBar/useSearchNavigation';

// Hoisted mock polyfills global.Request before Next.js cache modules evaluate in Node/Jest
jest.mock('next/cache', () => {
    if (typeof global.Request === 'undefined') {
        class MockRequest {
            public url: string;
            constructor(input: string | { url: string }) {
                this.url = typeof input === 'string' ? input : input?.url || '';
            }
        }
        Object.defineProperty(global, 'Request', {
            value: MockRequest,
            writable: true,
            configurable: true,
        });
    }
    return {
        unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => fn,
        revalidateTag: jest.fn(),
        revalidatePath: jest.fn(),
    };
});

jest.mock('@/hooks/SearchBar/useBookSearch');
jest.mock('@/hooks/SearchBar/useSearchNavigation');
jest.mock('@/components/layout/UserNavbar/SearchBar/SearchOutput', () => ({
    SearchOutput: () => <div data-testid="search-output">Search Results</div>,
}));

describe('SearchBar Integration', () => {
    beforeEach(() => {
        (useBookSearch as jest.Mock).mockReturnValue({
            input: '',
            searchResults: [],
            errorMessage: null,
            isLoading: false,
            handleInputChange: jest.fn(),
            clearSearch: jest.fn(),
        });

        (useSearchNavigation as jest.Mock).mockReturnValue({
            isDropdownVisible: false,
            setIsDropdownVisible: jest.fn(),
            activeIndex: -1,
            handleKeyDown: jest.fn(),
            handleBlur: jest.fn(),
        });
    });

    it('should render and pass props correctly', () => {
        render(<SearchBar />);

        expect(screen.getByTestId('searchbar')).toBeInTheDocument();
    });

    it('should call handleInputChange when user types', () => {
        const mockHandleInput = jest.fn();
        (useBookSearch as jest.Mock).mockReturnValue({
            input: '',
            searchResults: [],
            errorMessage: null,
            isLoading: false,
            handleInputChange: mockHandleInput,
            clearSearch: jest.fn(),
        });

        render(<SearchBar />);
        const input = screen.getByRole('searchbox', { name: /search books/i });

        fireEvent.change(input, { target: { value: 'New Query' } });

        expect(mockHandleInput).toHaveBeenCalled();
    });

    it('should render SearchOutput when input has value and dropdown is visible', () => {
        (useBookSearch as jest.Mock).mockReturnValue({
            input: 'valid query',
            searchResults: [{ id: '1', title: 'Book 1' }],
            errorMessage: null,
            isLoading: false,
            handleInputChange: jest.fn(),
            clearSearch: jest.fn(),
        });

        (useSearchNavigation as jest.Mock).mockReturnValue({
            isDropdownVisible: true,
            setIsDropdownVisible: jest.fn(),
            activeIndex: -1,
            handleKeyDown: jest.fn(),
            handleBlur: jest.fn(),
        });

        render(<SearchBar />);

        expect(screen.getByTestId('search-output')).toBeInTheDocument();
    });
});
