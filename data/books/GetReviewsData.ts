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
		return 'Failed to retrieve reviews.';
	}

	if (!data || data.length === 0) return 'No reviews found.';

	return data;
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
