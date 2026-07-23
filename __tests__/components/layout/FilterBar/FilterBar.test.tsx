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

jest.mock('@/components/layout/FilterBar/Genre', () => ({
    Genre: () => <div data-testid="filterbar-genre">Genre</div>,
}));

jest.mock('@/components/layout/FilterBar/Format', () => ({
    Format: () => <div data-testid="filterbar-format">Format</div>,
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

        const mockGenreElement = await screen.findByTestId('filterbar-genre');
        expect(mockGenreElement).toBeInTheDocument();

        const mockFormatElement = await screen.findByTestId('filterbar-format');
        expect(mockFormatElement).toBeInTheDocument();

        const mockSortbyElement = await screen.findByTestId('filterbar-sortby');
        expect(mockSortbyElement).toBeInTheDocument();
    });
});
