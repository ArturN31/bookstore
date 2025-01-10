import { InferGetServerSidePropsType } from 'next';
import { RootLayout } from '@/components/layout/Layout';
import { getBooks, getReviews, seedDatabaseWithBooks, seedDatabaseWithReviews } from '@/utils/dbSeed/seedDatabase';
import { matchReviewsToBooks, groupReviewsByBookId } from '@/utils/prepBooksArray';

// const seedDatabase = async () => {
// 	let storedBooks = await getBooks();
// 	let storedReviews = await getReviews();

// 	//there are no books in db - seed the books table
// 	if (storedBooks.books.length === 0) seedDatabaseWithBooks(storedBooks);

// 	//there are no reviews in db - seed the book_reviews table
// 	if (storedReviews.reviews.length === 0) seedDatabaseWithReviews(storedBooks, storedReviews);
// };

// seedDatabase();

// export const getServerSideProps = async () => {
// 	//add reviews to books
// 	const books = matchReviewsToBooks(groupReviewsByBookId(storedReviews.reviews), storedBooks.books);

// 	return { props: { books } };
// };

export default function Home() {
	return (
		<RootLayout>
			<p>MAIN</p>
		</RootLayout>
	);
}
