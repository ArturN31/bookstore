import React from 'react';
import { render, screen } from '@testing-library/react';
import { FilterBar } from '@/components/layout/FilterBar/FilterBar';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
    usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
    const MockedLink = ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode;
        href: string;
    }) => (
        <a
            href={href}
            {...props}
        >
            {children}
        </a>
    );
    MockedLink.displayName = 'Link';
    return MockedLink;
});

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    useBookFilter: () => ({
        advancedFilters: {
            AUTHORS: [],
            GENRES: [],
            PRICES: [],
            PUBLICATIONS: [],
        },
        isLoading: false,
        resetAllFilters: jest.fn(),
    }),
}));

jest.mock('@/components/layout/FilterBar/Home', () => ({
    Home: () => <div data-testid="filterbar-home">Home</div>,
}));

jest.mock('@/components/layout/FilterBar/SortBy', () => ({
    SortBy: () => <div data-testid="filterbar-sortby">SortBy</div>,
}));

describe('FilterBar', () => {
    it('renders component', async () => {
        render(<FilterBar />);

        const filterbarElement = screen.getByTestId('filterbar');
        expect(filterbarElement).toBeInTheDocument();

        const mockHomeElement = screen.getByTestId('filterbar-home');
        expect(mockHomeElement).toBeInTheDocument();

        const mockSortbyElement = await screen.findByTestId('filterbar-sortby');
        expect(mockSortbyElement).toBeInTheDocument();
    });
});
