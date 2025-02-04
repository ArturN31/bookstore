import { RootLayout } from '@/components/layout/Layout';
import { matchReviewsToBooks, groupReviewsByBookId, getBookReviews } from '@/data/books/GetReviewsData';
import { getAllBooks } from '@/data/books/GetBooksData';
import { OutputBook } from '@/components/books/OutputBook';

export default async function HomePage() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

	if (typeof books === 'string')
		return (
			<RootLayout>
				<div>
					<p>{books}</p>
				</div>
			</RootLayout>
		);

	if (books.length > 0) {
		const bookIDs = books.map((book) => {
			return book.id;
		});
		const reviews = await getBookReviews(bookIDs);

		if (reviews.length > 0 && typeof reviews !== 'string') {
			const reviewsGroupedByBookID = groupReviewsByBookId(reviews);
			books = matchReviewsToBooks(reviewsGroupedByBookID, books);
		}
	}

	return (
		<RootLayout>
			<div className='flex flex-wrap justify-center gap-5'>
				{books.map((book) => (
					<OutputBook
						book={book}
						key={book.id}
					/>
				))}
			</div>
		</RootLayout>
	);
}
