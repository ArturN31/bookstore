import axios from 'axios';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';

export const getBooks = async () => {
	const booksResponse = await axios.get('http://localhost:3000/api/books');
	const storedBooks: { books: Book[] } = await booksResponse.data;

	return storedBooks;
};

export const getReviews = async () => {
	const reviewsResponse = await axios.get('http://localhost:3000/api/reviews');
	const storedReviews: { reviews: Review[] } = await reviewsResponse.data;

	return storedReviews;
};

export const seedDatabaseWithBooks = async (storedBooks: { books: Book[] }) => {
	//seed the db with fake book data
	const generatedBooks = await generateBooksArray(100);
	await axios.post('http://localhost:3000/api/books', { books: generatedBooks });

	//retrieve books from db - updated with id
	storedBooks = await getBooks();
};

export const seedDatabaseWithReviews = async (storedBooks: { books: Book[] }, storedReviews: { reviews: Review[] }) => {
	//seed the db with fake reviews
	const generatedReviews = await generateReviewsArray(storedBooks.books);
	await axios.post('http://localhost:3000/api/reviews', { reviews: generatedReviews });

	//retrieve reviews from db - updated with id
	storedReviews = await getReviews();
};
