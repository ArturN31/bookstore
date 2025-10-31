import { SearchBar } from '../../../components/layout/UserNavbar/SearchBar/SearchBar';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockRouterPush,
	}),
}));

const mockBooks = [
	{ id: '1', title: 'The Lord of the Rings', is_active: true },
	{ id: '2', title: 'The Hobbit', is_active: true },
	{ id: '3', title: 'The Silmarillion', is_active: false },
];

jest.mock('../../../data/books/GetBooksData', () => ({
	getAllBooks: jest.fn(),
}));

describe('layout - UserNavbar - SearchBar', () => {
	jest.useFakeTimers();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	it('Should render component', () => {
		render(<SearchBar />);

		const searchbar = screen.getByTestId('searchbar');
		expect(searchbar).toBeInTheDocument();
	});

	it('Should handle input change', () => {
		render(<SearchBar />);

		const searchinput = screen.getByTestId('searchbar-searchinput');
		expect(searchinput).toBeInTheDocument();

		fireEvent.change(searchinput, { target: { value: 'ASD' } });
	});

	it('Should handle input change then fetch and filter books', async () => {
		const { getAllBooks } = require('../../../data/books/GetBooksData');
		getAllBooks.mockResolvedValue(mockBooks);

		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'Hobbit' } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
		});

		await waitFor(() => {
			const searchResults = screen.getByTestId('searchbar-searchoutput');
			expect(searchResults).toBeInTheDocument();
			expect(screen.getByText('The Hobbit')).toBeInTheDocument();
			expect(screen.queryByText('The Lord of the Rings')).not.toBeInTheDocument();
		});
	});

	it('should return null and not render search results if no books are found', async () => {
		const { getAllBooks } = require('../../../data/books/GetBooksData');
		getAllBooks.mockResolvedValue(null);

		render(<SearchBar />);
		const searchInput = screen.getByTestId('searchbar-searchinput');

		fireEvent.change(searchInput, { target: { value: 'any query' } });

		await act(() => {
			jest.advanceTimersByTime(1001);
		});

		await waitFor(() => {
			const searchOutput = screen.queryByTestId('searchbar-searchoutput');
			expect(searchOutput).toHaveTextContent('No books found.');
		});
	});

	it('Should handle fetch and filter books error', async () => {
		const { getAllBooks } = require('../../../data/books/GetBooksData');
		getAllBooks.mockRejectedValue(new Error('API failed'));

		const consoleSpy = jest.spyOn(console, 'log');

		render(<SearchBar />);
		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'test' } });

		await act(() => {
			jest.advanceTimersByTime(1001);
		});

		await waitFor(() => {
			expect(getAllBooks).toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith('Error fetching books:', expect.any(Error));

			const searchOutput = screen.queryByTestId('searchbar-searchoutput');
			expect(searchOutput).toHaveTextContent('No books found.');
		});

		consoleSpy.mockRestore();
	});

	it('Should handle click on outputted book', async () => {
		const { getAllBooks } = require('../../../data/books/GetBooksData');
		getAllBooks.mockResolvedValue(mockBooks);

		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'Hobbit' } });

		await act(() => {
			jest.advanceTimersByTime(1001);
		});

		await waitFor(() => {
			const searchResults = screen.getByTestId('searchbar-searchoutput');
			expect(searchResults).toBeInTheDocument();

			const bookOutput = screen.getByText('The Hobbit');
			expect(bookOutput).toBeInTheDocument();

			fireEvent.click(bookOutput);
			expect(mockRouterPush).toHaveBeenCalledWith('/book/2');
		});
	});

	it('should show and hide the dropdown on mouse leave', () => {
		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'Hobbit' } });

		const searchOutput = screen.getByTestId('searchbar-searchoutput');
		expect(searchOutput).toBeInTheDocument();

		const searchBarContainer = screen.getByTestId('searchbar');
		fireEvent.mouseEnter(searchBarContainer);
		fireEvent.mouseLeave(searchBarContainer);

		expect(screen.queryByTestId('searchbar-searchoutput')).not.toBeInTheDocument();
	});
});
