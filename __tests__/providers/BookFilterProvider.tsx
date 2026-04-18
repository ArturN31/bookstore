import { render, screen, waitFor, act } from '@testing-library/react';
import { BookFilterProvider, useBookFilter } from '@/providers/BookFilterProvider';

const TestConsumer = () => {
    const { filterType, toggleFilter } = useBookFilter();
    return (
        <div>
            <span data-testid="filter-type">{filterType}</span>
            <button data-testid="toggle-az" onClick={() => toggleFilter('Title: A-Z')}>A-Z</button>
            <button data-testid="toggle-za" onClick={() => toggleFilter('Title: Z-A')}>Z-A</button>
            <button data-testid="toggle-price-low" onClick={() => toggleFilter('Price: Low to High')}>Low</button>
            <button data-testid="toggle-price-high" onClick={() => toggleFilter('Price: High to Low')}>High</button>
            <button data-testid="toggle-newest" onClick={() => toggleFilter('Release Date: Newest to Oldest')}>Newest</button>
            <button data-testid="toggle-oldest" onClick={() => toggleFilter('Release Date: Oldest to Newest')}>Oldest</button>
            <button data-testid="toggle-highest" onClick={() => toggleFilter('Highest Avg. customer rating')}>Highest</button>
            <button data-testid="toggle-lowest" onClick={() => toggleFilter('Lowest Avg. customer rating')}>Lowest</button>
            <button data-testid="toggle-bestsellers" onClick={() => toggleFilter('Best Sellers')}>Bestsellers</button>
            <button data-testid="toggle-invalid" onClick={() => toggleFilter('Invalid Filter')}>Invalid</button>
        </div>
    );
};

describe('BookFilterProvider', () => {
    it('should provide default filter type', () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: A-Z');
    });

    it('should toggle to Title: Z-A', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-za').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: Z-A');
        });
    });

    it('should toggle to Price: Low to High', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-price-low').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Price: Low to High');
        });
    });

    it('should toggle to Price: High to Low', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-price-high').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Price: High to Low');
        });
    });

    it('should toggle to Release Date: Newest to Oldest', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-newest').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Release Date: Newest to Oldest');
        });
    });

    it('should toggle to Release Date: Oldest to Newest', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-oldest').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Release Date: Oldest to Newest');
        });
    });

    it('should toggle to Highest Avg. customer rating', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-highest').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Highest Avg. customer rating');
        });
    });

    it('should toggle to Lowest Avg. customer rating', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-lowest').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Lowest Avg. customer rating');
        });
    });

    it('should toggle to Best Sellers', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-bestsellers').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Best Sellers');
        });
    });

    it('should ignore invalid filter types', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-invalid').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: A-Z');
        });
    });

    it('should toggle back to Title: A-Z', async () => {
        render(
            <BookFilterProvider>
                <TestConsumer />
            </BookFilterProvider>
        );

        await act(async () => {
            screen.getByTestId('toggle-za').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: Z-A');
        });

        await act(async () => {
            screen.getByTestId('toggle-az').click();
        });
        
        await waitFor(() => {
            expect(screen.getByTestId('filter-type')).toHaveTextContent('Title: A-Z');
        });
    });
});
