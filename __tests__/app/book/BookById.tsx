import BookById from '@/app/book/[slug]/page';
import { render, screen } from '@testing-library/react';
import { getBook } from '@/data/books/GetBooksData';
import { getBookReviewsByBookId } from '@/data/books/GetReviewsData';

const mockedGetBook = getBook as jest.Mock;
jest.mock('@/data/books/GetBooksData');

const mockedGetBookReviewsByBookId = getBookReviewsByBookId as jest.Mock;
jest.mock('@/data/books/GetReviewsData');

jest.mock('@/components/pages/book/Layout/BookImg', () => ({
	BookImg: () => <div data-testid='book-img' />,
}));

jest.mock('@/components/pages/book/Layout/BookMainDetails', () => ({
	BookMainDetails: () => <div data-testid='book-main-details' />,
}));

jest.mock('@/components/pages/book/Cart/BookCart', () => ({
	BookCart: () => <div data-testid='book-cart' />,
}));

jest.mock('@/components/pages/book/Layout/BookSecondaryDetails', () => ({
	BookSecondaryDetails: () => <div data-testid='book-secondary-details' />,
}));

jest.mock('@/components/pages/book/Reviews/BookReviews', () => ({
	BookReviews: () => <div data-testid='book-reviews' />,
}));

jest.mock('@/components/pages/book/Layout/BookDescription', () => ({
	BookDescription: () => <div data-testid='book-description' />,
}));

const mockBookData: Book = {
	id: 'mock-book-id-123',
	created_at: new Date().getUTCDate().toString(),
	updated_at: new Date().getUTCDate().toString(),
	title: 'The Mock Book',
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
};

const mockReviewsData: Review = {
	id: '1',
	created_at: new Date().getUTCDate().toString(),
	updated_at: new Date().getUTCDate().toString(),
	book_id: '1',
	user_id: '1',
	review: 'Great read',
	rating: 4,
	username: 'test',
};

type BookByIdProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ reviewPagination?: string }>;
};

describe('App - Book[slug]', () => {
	const defaultProps: BookByIdProps = {
		params: Promise.resolve({ slug: mockBookData.id }),
		searchParams: Promise.resolve({}),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('Should render the book details when data is successfully fetched', async () => {
		mockedGetBook.mockResolvedValue(mockBookData);
		mockedGetBookReviewsByBookId.mockResolvedValue(mockReviewsData);

		const element = await BookById(defaultProps);
		await render(element);

		expect(mockedGetBook).toHaveBeenCalledWith(mockBookData.id);
		expect(mockedGetBookReviewsByBookId).toHaveBeenCalledWith(mockBookData.id, 1, 5);

		expect(screen.getByTestId('book-img')).toBeInTheDocument();
		expect(screen.getByTestId('book-main-details')).toBeInTheDocument();
		expect(screen.getByTestId('book-cart')).toBeInTheDocument();
		expect(screen.getByTestId('book-reviews')).toBeInTheDocument();
	});

	it('Should render the ui for no books returned', async () => {
		mockedGetBook.mockResolvedValue(null);
		mockedGetBookReviewsByBookId.mockResolvedValue(mockReviewsData);

		const element = await BookById(defaultProps);
		await render(element);

		expect(mockedGetBook).toHaveBeenCalledWith(mockBookData.id);
		expect(mockedGetBookReviewsByBookId).not.toHaveBeenCalled();

		expect(screen.getByText('Could not retrieve book data.')).toBeInTheDocument();
		expect(screen.queryByTestId('book-img')).not.toBeInTheDocument();
	});
});
