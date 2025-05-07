import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Retrieves reviews for passed book ids.
 *
 * @param bookIDs List of book ids to retrieve reviews.
 *
 * @returns A promise that resolves to an array of 'Review' objects if successful, or a string error message if not.
 */
export const getBookReviews = async (bookIDs: string[]) => {
	const supabase = await createClient();
	const { data, error }: PostgrestResponse<Review> = await supabase
		.from('book_reviews')
		.select('*')
		.in('book_id', bookIDs);

	if (error) {
		console.error('Error retrieving reviews:', error);
		return null;
	}

	if (!data || data.length === 0) return null;

	return data;
};

/**
 * Retrieves paginated reviews for a specific book ID.
 *
 * @param bookID The ID of the book to retrieve reviews for.
 * @param page The current page number (default: 1).
 * @param limit The number of reviews to retrieve per page (default: 10).
 *
 * @returns A promise that resolves to an object containing:
 * - data: An array of 'Review' objects for the current page, or null if an error occurs or no reviews are found.
 * - total: The total number of reviews for the given book ID, or null if an error occurs.
 * - totalPages: The total number of pages based on the limit, or null if an error occurs.
 * - currentPage: The current page number.
 */
export const getBookReviewsByBookId = async (bookID: string, page: number = 1, limit: number = 5) => {
	const supabase = await createClient();
	const startIndex = (page - 1) * limit;

	const { data, error, count }: PostgrestResponse<Review> = await supabase
		.from('book_reviews')
		.select('*', { count: 'exact' })
		.eq('book_id', bookID)
		.range(startIndex, startIndex + limit - 1);

	if (error) {
		console.error('Error retrieving paginated reviews for book ID:', bookID, error);
		return { data: null, total: null, totalPages: null, currentPage: page };
	}

	if (!data) {
		return { data: [], total: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page };
	}

	return {
		data,
		total: count || 0,
		totalPages: Math.ceil((count || 0) / limit),
		currentPage: page,
	};
};

export const groupReviewsByBookId = (storedReviews: Review[]) => {
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

export const matchReviewsToBooks = (groupedReviews: Record<string, Review[]>, books: Book[]): Book[] => {
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
