import { getBooksAddedToCart, getUsersCartID } from '../cart/GetCartData';
import { getUserDataProperty } from '../user/GetUserData';
import { getUsersWishlistedBooks } from './GetBooksData';
import { getBookReviews, groupReviewsByBookId, matchReviewsToBooks } from './GetReviewsData';

/**
 * Adds reviews to books.
 * @param books
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or fallback to original books if reviews logic fails.
 */
export const addReviewsToBooks = async (books: Book[]) => {
	const bookIDs = books.map((book) => book.id);
	const reviews = await getBookReviews(bookIDs);

	if (!reviews) return books;

	const reviewsGroupedByBookID = groupReviewsByBookId(reviews);
	return matchReviewsToBooks(reviewsGroupedByBookID, books);
};

/**
 * Adds wishlisted prop with value true to books that are wishlisted by the user.
 * @param books
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or fallback to original books if wishlisted logic fails.
 */
export const addUsersWishlistedBooks = async (books: Book[]) => {
	const userID = await getUserDataProperty('id');
	if (!userID) return books;

	const usersWishlistedBooks = await getUsersWishlistedBooks(userID);
	if (!usersWishlistedBooks) return books;

	const wishlistedBookIds = new Set(usersWishlistedBooks.map((item) => item.book_id));
	const updatedBooks = books.map((book) => ({
		...book,
		wishlisted: wishlistedBookIds.has(book.id),
	}));
	return updatedBooks;
};

/**
 * Adds addedToCart prop with value true to books that are added to cart by the user.
 * @param books
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or fallback to original books if cart logic fails.
 */
export const addUsersCartItemsToBooks = async (books: Book[]) => {
	const userID = await getUserDataProperty('id');
	if (!userID) return books;

	const cartID = await getUsersCartID(userID);
	if (!cartID) return books;

	const cartItems = await getBooksAddedToCart(cartID);
	if (!cartItems) return books;

	const cartItemBookIds = new Set(cartItems.map((item) => item.book_id));
	const updatedBooks = books.map((book) => ({
		...book,
		addedToCart: cartItemBookIds.has(book.id),
	}));
	return updatedBooks;
};
