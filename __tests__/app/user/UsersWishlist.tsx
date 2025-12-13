import UsersWishlist from '@/app/user/wishlist/page';
import { OutputBooks } from '@/components/books/OutputBooks';
import { getAllBooks } from '@/data/books/GetBooksData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { render, screen } from '@testing-library/react';

jest.mock('@/data/books/GetBooksData', () => ({
	getAllBooks: jest.fn(),
}));

jest.mock('@/data/user/GetUserData', () => ({
	getUserDataProperty: jest.fn(),
}));

jest.mock('@/data/actions/WishlistForm/WishlistInsertAction');
jest.mock('@/data/actions/WishlistForm/WishlistRemoveAction');

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	redirect: jest.fn(),
	useRouter: jest.fn(),
	usePathname: jest.fn(() => ''),
}));

const mockedOutputBooks = OutputBooks as jest.Mock;
jest.mock('@/components/books/OutputBooks', () => ({
	OutputBooks: jest.fn(({ books }) => (
		<div data-testid='output-books'>Mock OutputBooks: {books.length}</div>
	)),
}));

const mockedGetAllBooks = getAllBooks as jest.Mock;
const mockedGetUserDataProperty = getUserDataProperty as jest.Mock;

const mockBooksData: Book[] = [
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

describe('APP - User - wishlist', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render `Cannot retrieve books` when book data retrieval fails', async () => {
		mockedGetAllBooks.mockResolvedValue(null);
		mockedGetUserDataProperty.mockResolvedValue(null);

		const element = await UsersWishlist();
		await render(element);

		const fallbackText = screen.getByText('Cannot retrieve books.');

		expect(fallbackText).toBeInTheDocument();
		expect(mockedGetAllBooks).toHaveBeenCalledTimes(1);
		expect(mockedOutputBooks).not.toHaveBeenCalled();
	});

	it('should render OutputBooks component when book data is retrieved successfully', async () => {
		mockedGetAllBooks.mockResolvedValue(mockBooksData);

		await render(await UsersWishlist());

		const outputBooksComponent = screen.getByTestId('output-books');

		expect(outputBooksComponent).toBeInTheDocument();
		expect(outputBooksComponent).toHaveTextContent(
			`Mock OutputBooks: ${mockBooksData.length}`,
		);

		expect(mockedOutputBooks).toHaveBeenCalledTimes(1);
		expect(mockedOutputBooks).toHaveBeenCalledWith(
			expect.objectContaining({
				books: mockBooksData,
				type: 'wishlisted',
			}),
			undefined,
		);
		expect(screen.queryByText('Cannot retrieve books.')).not.toBeInTheDocument();
	});
});
