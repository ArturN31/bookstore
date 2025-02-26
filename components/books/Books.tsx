import { addReviewsToBooks, addUsersCartItemsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { BookCard } from './bookCard/BookCard';
import { getUserDataProperty } from '@/data/user/GetUserData';

export const Books = async ({ books, type }: { books: Book[]; type: 'all' | 'wishlisted' }) => {
	//empty/invalid books
	if (!Array.isArray(books) || books.length === 0) return null;

	let booksOutput = books;
	try {
		booksOutput = await addReviewsToBooks(booksOutput);
		booksOutput = await addUsersWishlistedBooks(booksOutput);
		booksOutput = await addUsersCartItemsToBooks(booksOutput);
	} catch (error) {
		console.error('Error processing books:', error);
		//TODO: Handle the error (e.g., display an error message)
	}

	const userID = await getUserDataProperty('id');
	const loggedIn = !!userID;

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
			{booksOutput &&
				booksOutput
					.filter((book) => book.is_active) //filter out inactive books
					.filter((book) => {
						//keep only wishlisted books if type is 'wishlisted'
						if (type === 'wishlisted') {
							return book.wishlisted;
						}
						//else keep all active books
						return true;
					})
					.map((book) => (
						<BookCard
							key={book.id}
							book={book}
							loggedIn={loggedIn}
						/>
					))}
		</div>
	);
};
