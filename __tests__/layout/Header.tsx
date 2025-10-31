import { useCartState } from '../../providers/CartProvider';
import { Header } from '../../components/layout/Header';
import { render, screen } from '@testing-library/react';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
	})),
	usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
	return ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
		<a
			href={href}
			{...props}>
			{children}
		</a>
	);
});

jest.mock('../../providers/CartProvider');

jest.mock('../../components/layout/FilterBar/Genre', () => ({
	Genre: jest.fn(() => <div data-testid='mock-genre'>Mock Genre</div>),
}));

jest.mock('../../components/layout/FilterBar/Format', () => ({
	Format: jest.fn(() => <div data-testid='mock-format'>Mock Format</div>),
}));

describe('FilterBar - Home', () => {
	beforeEach(() => {
		(useCartState as jest.Mock).mockReturnValue({
			cartBooks: [],
			cartBooksAmount: 0,
			cartItemsAmount: 0,
			cartTotal: '0',
			cartID: null,
			loading: false,
			cartError: null,
			refreshCart: jest.fn(),
		});
	});

	it('Should render component', () => {
		render(<Header />);

		const headerElement = screen.getByTestId('header');
		expect(headerElement).toBeInTheDocument();
	});
});
