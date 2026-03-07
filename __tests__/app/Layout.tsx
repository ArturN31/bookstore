import { render, screen } from '@testing-library/react';
import React from 'react';
import Layout from '@/app/layout';

jest.mock('@/components/layout/RootLayoutContent', () => ({
    RootLayoutContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-root-content">{children}</div>
    ),
}));

describe('Root Layout Shell', () => {
    it('renders the html and body structure with children', async () => {
        render(
            <Layout>
                <div data-testid="child">Hello World</div>
            </Layout>,
        );

        const child = await screen.findByTestId('child');
        expect(child).toHaveTextContent('Hello World');
        expect(screen.getByTestId('mock-root-content')).toBeInTheDocument();
    });
});
