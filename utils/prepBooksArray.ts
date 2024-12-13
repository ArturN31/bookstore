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
