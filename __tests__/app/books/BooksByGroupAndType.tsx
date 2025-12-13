import BooksByGroupAndType from '@/app/books/[...slug]/page';
import { render } from '@testing-library/react';
import { getBooksByGroupAndType } from '@/data/books/GetBooksData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { OutputBooks } from '@/components/books/OutputBooks';
import type { ReactNode } from 'react';

global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve({ data: [] }),
		text: () => Promise.resolve('Mock Fetch Error'),
		ok: true,
		status: 200,
		headers: new Headers(),
		redirected: false,
		statusText: 'OK',
		type: 'basic',
		url: '',
	} as Response),
);

const mockedGetBooksByGroupAndType = getBooksByGroupAndType as jest.Mock;
const mockedGetUserDataProperty = getUserDataProperty as jest.Mock;
const mockedOutputBooks = OutputBooks as jest.Mock;

jest.mock('@/data/actions/WishlistForm/WishlistInsertAction');
jest.mock('@/data/actions/WishlistForm/WishlistRemoveAction');
jest.mock('@/data/books/GetBooksData');

jest.mock('@/data/user/GetUserData', () => ({
	getUserDataProperty: jest.fn(),
}));

jest.mock('@/data/books/GetReviewsData', () => ({
	getBookReviews: jest.fn(() => []),
}));

jest.mock('@/components/layout/FilterBar/FilterBar', () => ({
	FilterBar: jest.fn(() => <div data-testid='mock-filterbar'>Mock FilterBar</div>),
}));

jest.mock('@/components/books/OutputBooks', () => ({
	OutputBooks: jest.fn(() => <div data-testid='output-books'>Mock OutputBooks</div>),
}));

jest.mock('@/providers/CartProvider', () => ({
	CartProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	useCartState: () => ({
		cartBooks: [],
		loading: false,
		insertBook: jest.fn(),
		removeBook: jest.fn(),
	}),
}));

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

type BooksByGroupAndTypeProps = {
	params: Promise<{ slug: string }>;
};

describe('App - Books[...slug]', () => {
	const defaultProps: BooksByGroupAndTypeProps = {
		params: Promise.resolve({ slug: 'Novel' }),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('Should render list of books retrieved by Genre - Novel', async () => {
		mockedGetBooksByGroupAndType.mockResolvedValue(mockBooksData);
		mockedGetUserDataProperty.mockResolvedValue(null);

		const element = await BooksByGroupAndType(defaultProps);
		const { getByTestId } = render(element);

		expect(mockedOutputBooks).toHaveBeenCalledWith(
			expect.objectContaining({
				books: mockBooksData,
				type: 'all',
			}),
			undefined,
		);

		expect(getByTestId('output-books')).toBeInTheDocument();
	});
});
