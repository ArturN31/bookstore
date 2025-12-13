import Layout from '@/app/layout';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/layout/Header', () => ({
	Header: () => <header data-testid='mock-header' />,
}));

jest.mock('@/components/layout/Footer', () => ({
	Footer: () => <footer data-testid='mock-footer' />,
}));

jest.mock('@/providers/Providers', () => ({
	Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/app/globals.css', () => ({}));

describe('Application Layout', () => {
	const MockChild = () => (
		<div data-testid='mock-page-content'>Page Specific Content</div>
	);

	it('Should correctly structure the page with Header, Footer, and content area', () => {
		render(
			<Layout>
				<MockChild />
			</Layout>,
		);

		const actualBody = document.querySelector('body');

		expect(actualBody).toBeInTheDocument();
		expect(actualBody).toHaveAttribute('data-testid', 'root-layout-wrapper');
		expect(actualBody).toHaveClass('min-h-screen flex flex-col');

		expect(screen.getByTestId('mock-header')).toBeInTheDocument();
		expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

		const mainContent = screen.getByTestId('main-content');
		expect(mainContent).toBeInTheDocument();
		expect(mainContent).toHaveClass('p-8 flex-1');

		const childContent = screen.getByTestId('mock-page-content');
		expect(childContent).toBeInTheDocument();
		expect(screen.getByText('Page Specific Content')).toBeInTheDocument();
		expect(mainContent).toContainElement(childContent);
	});
});
