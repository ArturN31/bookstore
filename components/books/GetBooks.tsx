import { addReviewsToBooks, addUsersCartItemsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { getUserData } from '@/data/user/GetUserData';
import { BooksFiltering } from './BooksFiltering';

export const GetBooks = async ({ books, type }: { books: Book[]; type: 'all' | 'wishlisted' }) => {
	//empty/invalid books
	if (!Array.isArray(books) || books.length === 0) return null;

	let booksOutput = [...books];
	try {
		booksOutput = await addReviewsToBooks(booksOutput);
		booksOutput = await addUsersWishlistedBooks(booksOutput);
		booksOutput = await addUsersCartItemsToBooks(booksOutput);
	} catch (error) {
		console.log('Error processing books:', error);
	}

	const userData = await getUserData();
	const profileExists = userData ? true : false;

	return (
		<BooksFiltering
			books={booksOutput}
			type={type}
			profileExists={profileExists}
		/>
	);
};
