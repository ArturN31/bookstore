import { addReviewsToBooks, addUsersCartItemsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { BookCard } from './bookCard/BookCard';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { getUsersCartID } from '@/data/cart/GetCartData';

interface BooksProps {
	books: Book[];
}

export const Books = async ({ books }: BooksProps) => {
	//empty/invalid books
	if (!Array.isArray(books) || books.length === 0) {
		return null;
	}

	let booksWithReviews = await addReviewsToBooks(books);

	//fallback to original books if reviews fail
	if (!Array.isArray(booksWithReviews) || booksWithReviews.length === 0) booksWithReviews = books;

	const booksWithWishlist = await addUsersWishlistedBooks(booksWithReviews);

	//default to books with wishlisted prop if cart logic fails
	let booksWithCart = booksWithWishlist;

	const userID = await getUserDataProperty('id');
	const loggedIn = !!userID;
	let cartID: string | null = null;

	if (loggedIn && booksWithWishlist) {
		booksWithCart = await addUsersCartItemsToBooks(booksWithWishlist);
		cartID = await getUsersCartID(userID);
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
			{booksWithCart &&
				booksWithCart.map((book) => {
					if (!book.is_active) return null; // Skip inactive books directly

					return (
						<BookCard
							key={book.id}
							book={book}
							loggedIn={loggedIn}
							cartID={cartID}
						/>
					);
				})}
		</div>
	);
};
