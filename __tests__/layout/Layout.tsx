import { render, screen } from '@testing-library/react';
import { RootLayout } from '../../components/layout/Layout';

jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
	}),
	usePathname: () => '/',
}));

jest.mock('../../providers/Providers', () => ({
	Providers: ({ children }: { children: any }) => (
		<div data-testid='mock-providers'>{children}</div>
	),
}));

jest.mock('../../components/layout/FilterBar/Genre', () => ({
	Genre: jest.fn(() => <div data-testid='mock-genre-leak'>Mock Genre</div>),
}));

jest.mock('../../components/layout/FilterBar/Format', () => ({
	Format: jest.fn(() => <div data-testid='mock-format-leak'>Mock Format</div>),
}));

describe('RootLayout Component', () => {
	const TestChildren = <p data-testid='layout-children'>Unique Page Content</p>;

	it('Should render the Header, Footer, Providers, and children content', () => {
		render(<RootLayout>{TestChildren}</RootLayout>);

		expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
		expect(screen.getByTestId('header')).toBeInTheDocument();
		expect(screen.getByTestId('footer')).toBeInTheDocument();
		expect(screen.getByTestId('root-layout-wrapper')).toBeInTheDocument();
		expect(screen.getByTestId('layout-children')).toBeInTheDocument();
	});

	it('Should use the <main> element correctly for accessibility', () => {
		render(<RootLayout>{TestChildren}</RootLayout>);
		const mainContent = screen.getByRole('main');
		expect(mainContent).toBeInTheDocument();
		expect(mainContent).toContainElement(screen.getByTestId('layout-children'));
		expect(mainContent).not.toContainElement(screen.getByTestId('header'));
	});
});
