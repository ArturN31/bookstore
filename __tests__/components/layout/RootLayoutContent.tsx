import { render, screen } from '@testing-library/react';
import { RootLayoutContent } from '@/components/layout/RootLayoutContent';
import React from 'react';

jest.mock('@/components/layout/Header', () => ({
    Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
    Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

jest.mock('@/components/layout/LayoutSkeleton', () => ({
    LayoutSkeleton: () => <div data-testid="mock-skeleton">Loading...</div>,
}));

jest.mock('@/providers/BookFilterProvider', () => ({
    BookFilterProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-filter-provider">{children}</div>
    ),
}));

jest.mock('@/components/layout/SessionProviderWrapper', () => ({
    SessionProviderWrapper: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-session-wrapper">{children}</div>
    ),
}));

describe('RootLayoutContent', () => {
    it('renders the layout structure correctly with children', () => {
        render(
            <RootLayoutContent>
                <div data-testid="test-child">Main Content</div>
            </RootLayoutContent>,
        );

        expect(screen.getByTestId('root-layout-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('mock-filter-provider')).toBeInTheDocument();
        expect(screen.getByTestId('mock-session-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

        const mainContent = screen.getByText('Main Content');
        expect(mainContent).toBeInTheDocument();
        expect(mainContent.closest('main')).toHaveClass('flex-1 p-8');
    });

    it('has the correct CSS classes for full-page layout', () => {
        render(
            <RootLayoutContent>
                <div />
            </RootLayoutContent>,
        );

        const wrapper = screen.getByTestId('root-layout-wrapper');
        expect(wrapper).toHaveClass('flex', 'min-h-screen', 'flex-col');
    });
});
