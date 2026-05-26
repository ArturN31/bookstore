import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { BookFilterProvider, useBookFilter } from '@/providers/BookFilterProvider';

const TestConsumer = () => {
    const { filterType, toggleFilter } = useBookFilter();
    return (
        <div>
            <span data-testid="filter-type">{filterType}</span>
            <button
                data-testid="toggle-az"
                onClick={() => toggleFilter('Title: A-Z')}
            >
                A-Z
            </button>
            <button
                data-testid="toggle-za"
                onClick={() => toggleFilter('Title: Z-A')}
            >
                Z-A
            </button>
            <button
                data-testid="toggle-price-low"
                onClick={() => toggleFilter('Price: Low to High')}
            >
                Low
            </button>
            <button
                data-testid="toggle-price-high"
                onClick={() => toggleFilter('Price: High to Low')}
            >
                High
            </button>
            <button
                data-testid="toggle-newest"
                onClick={() => toggleFilter('Release Date: Newest to Oldest')}
            >
                Newest
            </button>
            <button
                data-testid="toggle-oldest"
                onClick={() => toggleFilter('Release Date: Oldest to Newest')}
            >
                Oldest
            </button>
            <button
                data-testid="toggle-highest"
                onClick={() => toggleFilter('Highest Avg. customer rating')}
            >
                Highest
            </button>
            <button
                data-testid="toggle-lowest"
                onClick={() => toggleFilter('Lowest Avg. customer rating')}
            >
                Lowest
            </button>
            <button
                data-testid="toggle-bestsellers"
                onClick={() => toggleFilter('Best Sellers')}
            >
                Bestsellers
            </button>
            <button
                data-testid="toggle-invalid"
                onClick={() => toggleFilter('Invalid Filter' as any)}
            >
                Invalid
            </button>
        </div>
    );
};

describe('BookFilterProvider', () => {
    it('should provide default filter type', () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>,
        );
        expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: A-Z');
    });

    it('should toggle through all valid filter types', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>,
        );

        const cases = [
            { id: 'toggle-za', expected: 'Title: Z-A' },
            { id: 'toggle-price-low', expected: 'Price: Low to High' },
            { id: 'toggle-price-high', expected: 'Price: High to Low' },
            { id: 'toggle-newest', expected: 'Release Date: Newest to Oldest' },
            { id: 'toggle-oldest', expected: 'Release Date: Oldest to Newest' },
            { id: 'toggle-highest', expected: 'Highest Avg. customer rating' },
            { id: 'toggle-lowest', expected: 'Lowest Avg. customer rating' },
            { id: 'toggle-bestsellers', expected: 'Best Sellers' },
            { id: 'toggle-az', expected: 'Title: A-Z' },
        ];

        for (const test of cases) {
            await act(async () => {
                screen.getByTestId(test.id).click();
            });
            expect(screen.getByTestId('filter-type')).toHaveTextContent(test.expected);
        }
    });

    it('should ignore invalid filter types', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>,
        );

        await act(async () => {
            screen.getByTestId('toggle-invalid').click();
        });

        expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: A-Z');
    });

    it('should exercise the default context values when no provider is present', () => {
        const { result } = renderHook(() => useBookFilter());

        expect(result.current.filterType).toBe('Title: A-Z');

        act(() => {
            result.current.toggleFilter('Best Sellers');
        });

        expect(result.current.filterType).toBe('Title: A-Z');
    });
});
