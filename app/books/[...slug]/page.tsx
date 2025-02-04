import { RootLayout } from '@/components/layout/Layout';
import { OutputBook } from '@/components/books/OutputBook';
import { ChevronRight } from 'lucide-react';
import { getBookByGroupAndType } from '@/data/books/GetBooksData';
import { getBookReviews, groupReviewsByBookId, matchReviewsToBooks } from '@/data/books/GetReviewsData';

export default async function BooksByGroupAndTypePage({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string[];
	const group = slug[0]; //represents the book group - genre/format
	const type = decodeURIComponent(slug[1]); //represents the type - Adventure/Comedy/Paperback/Hardcover
	let books = await getBookByGroupAndType(group, type);

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
			<div>
				<p className='flex items-center w-fit py-1'>
					Books{' '}
					<ChevronRight
						size={16}
						strokeWidth={2.5}
					/>{' '}
					{String(group).charAt(0).toUpperCase() + String(group).slice(1)}{' '}
					<ChevronRight
						size={16}
						strokeWidth={2.5}
					/>{' '}
					{type}
				</p>

				<div className='flex flex-wrap justify-center gap-5'>
					{books.map((book) => (
						<OutputBook
							book={book}
							key={book.id}
						/>
					))}
				</div>
			</div>
		</RootLayout>
	);
}
