import { InferGetServerSidePropsType } from 'next';
import { generateBooksArray } from '@/utils/generateBook';
import { generateReviewsArray } from '@/utils/generateReview';
import axios from 'axios';
import { RootLayout } from '@/components/Layout';
import './globals.css';

const getBooks = async () => {
	const booksResponse = await axios.get('http://localhost:3000/api/books');
	const storedBooks: { books: Book[] } = await booksResponse.data;

	return storedBooks;
};

const getReviews = async () => {
	const reviewsResponse = await axios.get('http://localhost:3000/api/reviews');
	const storedReviews: { reviews: Review[] } = await reviewsResponse.data;

	return storedReviews;
};

const groupReviewsByBookId = (storedReviews: Review[]) => {
	const groupedReviews: Record<string, Review[]> = {};

	storedReviews.forEach((review: Review) => {
		const { book_id } = review;
		if (!groupedReviews[book_id]) {
			groupedReviews[book_id] = [];
		}
		groupedReviews[book_id].push(review);
	});

	return groupedReviews;
};

const matchReviewsToBooks = (groupedReviews: Record<string, Review[]>, books: Book[]): Book[] => {
	const bookMap = new Map<string, Book>();
	books.forEach((book) => bookMap.set(book.id, book));

	//iterate over reviews and add them to the corresponding book
	for (const bookId in groupedReviews) {
		const book = bookMap.get(bookId);
		if (book) {
			book.reviews = groupedReviews[bookId];
		}
	}

	return [...bookMap.values()];
};

const seedDatabaseWithBooks = async () => {
	const generatedBooks = await generateBooksArray(100);
	await axios.post('http://localhost:3000/api/books', { books: generatedBooks });
};

const seedDatabaseWithReviews = async (storedBooks: Book[]) => {
	const generatedReviews = await generateReviewsArray(storedBooks);
	await axios.post('http://localhost:3000/api/reviews', { reviews: generatedReviews });
};

export const getServerSideProps = async () => {
	let storedBooks = await getBooks();
	let storedReviews = await getReviews();

	//there are no books in db
	if (storedBooks.books.length === 0) {
		//seed the db with fake book data
		await seedDatabaseWithBooks();

		//retrieve books from db - updated with id
		storedBooks = await getBooks();
	}

	//there are no reviews in db
	if (storedReviews.reviews.length === 0) {
		//seed the db with fake reviews
		await seedDatabaseWithReviews(storedBooks.books);

		//retrieve reviews from db - updated with id
		storedReviews = await getReviews();
	}

	//add reviews to books
	const books = matchReviewsToBooks(groupReviewsByBookId(storedReviews.reviews), storedBooks.books);

	return { props: { books } };
};

export default function Home({ books }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	console.log(books);

	return (
		<RootLayout>
			<p>MAIN</p>
		</RootLayout>
	);
}
