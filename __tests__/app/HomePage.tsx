import HomePage from '@/app/page';
import { act, render, screen } from '@testing-library/react';
import { getAllBooks } from '@/data/books/GetBooksData';

jest.mock('next/headers', () => ({
	cookies: jest.fn().mockResolvedValue({
		get: jest.fn(() => ({ value: 'mock-token' })),
		getAll: jest.fn(() => []),
	}),
}));

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
	redirect: jest.fn(),
	useRouter: jest.fn(),
	usePathname: jest.fn(() => '/books/Novel'),
}));

const mockedGetAllBooks = getAllBooks as jest.Mock;
jest.mock('@/data/books/GetBooksData', () => ({
	getAllBooks: jest.fn(),
}));

jest.mock('@/components/books/OutputBooks', () => ({
	OutputBooks: jest.fn(({ books, type }) => {
		if (!books || books.length === 0) return null;

		return (
			<div data-testid='mock-output-books'>
				{books.map((book: any) => (
					<p key={book.id}>{book.title}</p>
				))}
			</div>
		);
	}),
}));

describe('APP - Homepage', () => {
	it('Should render the HomePage (no books)', async () => {
		mockedGetAllBooks.mockResolvedValue(null);

		const element = await HomePage();
		await act(async () => {
			render(element);
		});

		expect(screen.getByText('Cannot retrieve books.')).toBeInTheDocument();
	});

	it('Should render the OutputBooks component when books are found', async () => {
		mockedGetAllBooks.mockResolvedValue([{ id: 1, title: 'Test Book' }]);

		const element = await HomePage();
		await act(async () => {
			render(element);
		});

		expect(screen.getByText('Test Book')).toBeInTheDocument();
	});
});
