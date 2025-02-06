import { RootLayout } from '@/components/layout/Layout';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getBookByGroupAndType } from '@/data/books/GetBooksData';
import { getBookReviews, groupReviewsByBookId, matchReviewsToBooks } from '@/data/books/GetReviewsData';
import { Books } from '@/components/books/Books';

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
					Books <KeyboardArrowRightIcon /> {String(group).charAt(0).toUpperCase() + String(group).slice(1)}{' '}
					<KeyboardArrowRightIcon /> {type}
				</p>

				<Books books={books} />
			</div>
		</RootLayout>
	);
}
