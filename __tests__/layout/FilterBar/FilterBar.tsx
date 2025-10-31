import { FilterBar } from '../../../components/layout/FilterBar/FilterBar';
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

jest.mock('../../../components/layout/FilterBar/Home', () => ({
	Home: jest.fn(() => <div data-testid='mock-home'>Mock Home</div>),
}));

jest.mock('../../../components/layout/FilterBar/Genre', () => ({
	Genre: jest.fn(() => <div data-testid='mock-genre'>Mock Genre</div>),
}));

jest.mock('../../../components/layout/FilterBar/Format', () => ({
	Format: jest.fn(() => <div data-testid='mock-format'>Mock Format</div>),
}));
jest.mock('../../../components/layout/FilterBar/SortBy', () => ({
	SortBy: jest.fn(() => <div data-testid='mock-sortby'>Mock Sort By</div>),
}));

describe('FilterBar', () => {
	it('renders component', () => {
		render(<FilterBar />);

		const filterbarElement = screen.getByTestId('filterbar');
		expect(filterbarElement).toBeInTheDocument();

		const mockHomeElement = screen.getByTestId('mock-home');
		expect(mockHomeElement).toBeInTheDocument();

		const mockGenreElement = screen.getByTestId('mock-genre');
		expect(mockGenreElement).toBeInTheDocument();

		const mockFormatElement = screen.getByTestId('mock-format');
		expect(mockFormatElement).toBeInTheDocument();

		const mockSortbyElement = screen.getByTestId('mock-sortby');
		expect(mockSortbyElement).toBeInTheDocument();
	});
});
