const calculateAverageRating = (book: Book): number | null => {
	if (!book.reviews || book.reviews.length === 0) return 0;
	const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
	const average = totalRating / book.reviews.length;
	return parseFloat(average.toFixed(2));
};

const addRatingToBooks = (books: Book[]) => {
	return books.map((book) => ({
		...book,
		rating: calculateAverageRating(book),
	}));
};

const compareByPrice = (a: Book, b: Book, order: 'Asc' | 'Desc'): number => {
	const priceA = parseFloat(a.price.replace('£', ''));
	const priceB = parseFloat(b.price.replace('£', ''));
	return order === 'Asc' ? priceB - priceA : priceA - priceB;
};

const compareByDate = (a: Book, b: Book, order: 'Asc' | 'Desc'): number => {
	const dateA = new Date(a.publication_date).getTime();
	const dateB = new Date(b.publication_date).getTime();
	return order === 'Asc' ? dateB - dateA : dateA - dateB;
};

export const sortBooks = (books: Book[], filterType: string): Book[] => {
	const booksWithRating = ['Highest Avg. customer rating', 'Lowest Avg. customer rating'].includes(filterType)
		? addRatingToBooks(books)
		: books;

	switch (filterType) {
		case 'Highest Avg. customer rating':
			return [...booksWithRating].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
		case 'Lowest Avg. customer rating':
			return [...booksWithRating].sort((a, b) => (a.rating ?? -1) - (b.rating ?? -1));
		case 'Best Sellers':
			//TODO: Implement best sellers
			return [...books];
		case 'Price: High to Low':
			return [...books].sort((a: Book, b: Book) => compareByPrice(a, b, 'Asc'));
		case 'Price: Low to High':
			return [...books].sort((a: Book, b: Book) => compareByPrice(a, b, 'Desc'));
		case 'Release Date: Newest to Oldest':
			return [...books].sort((a: Book, b: Book) => compareByDate(a, b, 'Asc'));
		case 'Release Date: Oldest to Newest':
			return [...books].sort((a: Book, b: Book) => compareByDate(a, b, 'Desc'));
		case 'Title: A-Z':
			return [...books].sort((a, b) => a.title.localeCompare(b.title));
		case 'Title: Z-A':
			return [...books].sort((a, b) => b.title.localeCompare(a.title));
		default:
			return [...books];
	}
};
