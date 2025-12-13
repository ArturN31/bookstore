import { render, screen, fireEvent } from '@testing-library/react';
import { SearchOutput } from '@/components/layout/UserNavbar/SearchBar/SearchOutput'; // Adjust path as necessary

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockRouterPush,
	}),
}));

const mockBooks: Book[] = [
	{
		id: 'mock-book-id-1',
		created_at: new Date().getUTCDate().toString(),
		updated_at: new Date().getUTCDate().toString(),
		title: 'The Mock Book 1',
		author: 'A. Test Author',
		genre: 'Fiction',
		publisher: 'Mock Publisher',
		publication_date: '2023-01-01',
		price: '19.99',
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
		created_at: new Date().getUTCDate().toString(),
		updated_at: new Date().getUTCDate().toString(),
		title: 'The Mock Book 2',
		author: 'B. Test Author',
		genre: 'Thriller',
		publisher: 'Mock Publisher',
		publication_date: '2022-01-01',
		price: '14.99',
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
		created_at: new Date().getUTCDate().toString(),
		updated_at: new Date().getUTCDate().toString(),
		title: 'The Mock Book 3',
		author: 'C. Test Author',
		genre: 'Novel',
		publisher: 'Mock Publisher',
		publication_date: '2021-01-01',
		price: '12.99',
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

describe('SearchOutput Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('Should render the error message when errorMessage prop is provided', () => {
		const testError = 'Failed to load books from the server.';

		render(
			<SearchOutput
				books={[]}
				errorMessage={testError}
			/>,
		);

		const errorOutput = screen.getByTestId('searchbar-searchoutput-error');

		expect(errorOutput).toBeInTheDocument();
		expect(errorOutput).toHaveTextContent(testError);
		expect(screen.queryByText('No books found.')).not.toBeInTheDocument();
		expect(screen.queryByText(mockBooks[0].title)).not.toBeInTheDocument();
		expect(errorOutput).toHaveClass('border-red-500');
	});

	it('Should render "No books found" message when books array is empty and there is no error', () => {
		render(
			<SearchOutput
				books={[]}
				errorMessage={null}
			/>,
		);

		const emptyOutput = screen.getByTestId('searchbar-searchoutput');

		expect(emptyOutput).toBeInTheDocument();
		expect(emptyOutput).toHaveTextContent('No books found.');
		expect(emptyOutput).toHaveClass('p-4 text-center');
		expect(screen.queryByTestId('searchbar-searchoutput-error')).not.toBeInTheDocument();
	});

	it('Should render the list of books when the books array is not empty', () => {
		render(
			<SearchOutput
				books={mockBooks}
				errorMessage={null}
			/>,
		);

		const resultsOutput = screen.getByTestId('searchbar-searchoutput');

		expect(resultsOutput).toBeInTheDocument();
		expect(screen.getByText(mockBooks[0].title)).toBeInTheDocument();
		expect(screen.getByText(mockBooks[1].title)).toBeInTheDocument();
		expect(screen.getByText(mockBooks[2].title)).toBeInTheDocument();
		expect(resultsOutput.children.length).toBe(mockBooks.length);
		expect(screen.queryByText('No books found.')).not.toBeInTheDocument();
	});

	it('Should call router.push with the correct book ID path when a book button is clicked', () => {
		render(
			<SearchOutput
				books={mockBooks}
				errorMessage={null}
			/>,
		);

		const bookButton = screen.getByText(mockBooks[0].title);

		fireEvent.click(bookButton);

		expect(mockRouterPush).toHaveBeenCalledTimes(1);
		expect(mockRouterPush).toHaveBeenCalledWith(`/book/${mockBooks[0].id}`);
		expect(mockRouterPush).not.toHaveBeenCalledWith(`/book/${mockBooks[1].id}`);
	});
});
