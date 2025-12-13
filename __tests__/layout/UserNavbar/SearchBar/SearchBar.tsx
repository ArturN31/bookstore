import { SearchBar } from '@/components/layout/UserNavbar/SearchBar/SearchBar';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockRouterPush,
	}),
}));

const mockBooks = [
	{
		id: 'mock-book-id-1',
		created_at: new Date().getUTCDate(),
		updated_at: new Date().getUTCDate(),
		title: 'The Mock Book 1',
		author: 'A. Test Author',
		genre: 'Fiction',
		publisher: 'Mock Publisher',
		publication_date: '2023-01-01',
		price: 19.99,
		description: 'A mock description.',
		format: 'Hardcover',
		page_count: 300,
		image_url: 'http://example.com/mock.jpg',
		stock_quantity: 10,
		is_active: true,
		reviews: [],
		rating: 5,
		wishlisted: false,
	},
	{
		id: 'mock-book-id-2',
		created_at: new Date().getUTCDate(),
		updated_at: new Date().getUTCDate(),
		title: 'The Mock Book 2',
		author: 'B. Test Author',
		genre: 'Thriller',
		publisher: 'Mock Publisher',
		publication_date: '2022-01-01',
		price: 14.99,
		description: 'A mock description.',
		format: 'Hardcover',
		page_count: 400,
		image_url: 'http://example.com/mock.jpg',
		stock_quantity: 30,
		is_active: true,
		reviews: [],
		rating: 3,
		wishlisted: false,
	},
	{
		id: 'mock-book-id-3',
		created_at: new Date().getUTCDate(),
		updated_at: new Date().getUTCDate(),
		title: 'The Mock Book 3',
		author: 'C. Test Author',
		genre: 'Novel',
		publisher: 'Mock Publisher',
		publication_date: '2021-01-01',
		price: 12.99,
		description: 'A mock description.',
		format: 'Hardcover',
		page_count: 500,
		image_url: 'http://example.com/mock.jpg',
		stock_quantity: 30,
		is_active: true,
		reviews: [],
		rating: 4,
		wishlisted: false,
	},
];

jest.mock('@/data/books/GetBooksData', () => ({
	getAllBooks: jest.fn(),
}));

jest.mock('@/components/layout/UserNavbar/SearchBar/SearchOutput', () => ({
	SearchOutput: jest.fn(
		({ books, errorMessage }: { books: any[]; errorMessage: string | null }) => {
			if (errorMessage) {
				return <div data-testid='searchbar-searchoutput-error'>{errorMessage}</div>;
			}
			if (books.length === 0) {
				return <div data-testid='searchbar-searchoutput-empty'>No books found.</div>;
			}

			return (
				<div data-testid='searchbar-searchoutput-results'>
					{books.map((book) => (
						<button
							key={book.id}
							onClick={() => {
								const mockRouterPush = require('next/navigation').useRouter().push;
								mockRouterPush(`/book/${book.id}`);
							}}>
							{book.title}
						</button>
					))}
				</div>
			);
		},
	),
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

	it('Should handle input change then fetch and filter books (Success)', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');
		getAllBooks.mockResolvedValue(mockBooks);

		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: mockBooks[0].title } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		await waitFor(() => {
			const searchResults = screen.getByTestId('searchbar-searchoutput-results');
			expect(searchResults).toBeInTheDocument();
			expect(screen.getByText(mockBooks[0].title)).toBeInTheDocument();
			expect(screen.queryByText(mockBooks[1].title)).not.toBeInTheDocument();
			expect(screen.queryByText(mockBooks[2].title)).not.toBeInTheDocument();
		});
	});

	it('should display "No books available" error if fetch returns null', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');
		getAllBooks.mockResolvedValue(null);

		render(<SearchBar />);
		const searchInput = screen.getByTestId('searchbar-searchinput');

		fireEvent.change(searchInput, { target: { value: 'test' } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		await waitFor(() => {
			const searchOutput = screen.getByTestId('searchbar-searchoutput-error');
			expect(searchOutput).toBeInTheDocument();
			expect(searchOutput).toHaveTextContent('No books available to search.');
		});
	});

	it('Should display an API fetch error message if fetching books fails', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');
		getAllBooks.mockRejectedValue(new Error('API failed'));

		render(<SearchBar />);
		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'test' } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(getAllBooks).toHaveBeenCalled();
			const searchOutputError = screen.getByTestId('searchbar-searchoutput-error');
			expect(searchOutputError).toBeInTheDocument();
			expect(searchOutputError).toHaveTextContent('Failed to retrieve books.');
		});
	});

	it('Should handle click on outputted book', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');
		getAllBooks.mockResolvedValue(mockBooks);

		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: mockBooks[0].title } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		await waitFor(() => {
			const searchResults = screen.getByTestId('searchbar-searchoutput-results');
			expect(searchResults).toBeInTheDocument();

			const bookOutput = screen.getByText(mockBooks[0].title);
			expect(bookOutput).toBeInTheDocument();

			fireEvent.click(bookOutput);
		});

		expect(mockRouterPush).toHaveBeenCalledWith(`/book/${mockBooks[0].id}`);
	});

	it('should show and hide the dropdown on mouse leave', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');
		getAllBooks.mockResolvedValue(mockBooks);

		render(<SearchBar />);

		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: mockBooks[0].title } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		const searchOutput = await screen.findByTestId('searchbar-searchoutput-results');
		expect(searchOutput).toBeInTheDocument();

		const searchBarContainer = screen.getByTestId('searchbar');

		act(() => {
			fireEvent.mouseEnter(searchBarContainer);
		});

		act(() => {
			fireEvent.mouseLeave(searchBarContainer);
		});

		expect(
			screen.queryByTestId('searchbar-searchoutput-results'),
		).not.toBeInTheDocument();
	});

	it('Should display the default unknown error message if API fails with a non-Error object', async () => {
		const { getAllBooks } = require('@/data/books/GetBooksData');

		getAllBooks.mockRejectedValue('A simple fetch failure string.');

		render(<SearchBar />);
		const searchInput = screen.getByTestId('searchbar-searchinput');
		fireEvent.change(searchInput, { target: { value: 'test' } });

		await act(async () => {
			jest.advanceTimersByTime(1001);
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(getAllBooks).toHaveBeenCalled();

			const searchOutputError = screen.getByTestId('searchbar-searchoutput-error');
			expect(searchOutputError).toBeInTheDocument();

			const expectedUserMessage =
				'Failed to retrieve books. Please try again later. Details: An unknown error occurred while fetching books.';
			expect(searchOutputError).toHaveTextContent(expectedUserMessage);
		});
	});
});
