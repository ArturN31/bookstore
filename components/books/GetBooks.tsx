import { addReviewsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { BooksFiltering } from './BooksFiltering';

export const GetBooks = async ({
	books,
	type,
}: {
	books: Book[];
	type: 'all' | 'wishlisted';
}) => {
	if (!Array.isArray(books) || books.length === 0) return null;

	let booksOutput = [...books];
	try {
		booksOutput = await addReviewsToBooks(booksOutput);
		booksOutput = await addUsersWishlistedBooks(booksOutput);
	} catch (error) {
		console.log('Error processing books:', error);
	}

	return (
		<BooksFiltering
			books={booksOutput}
			type={type}
		/>
	);
};
