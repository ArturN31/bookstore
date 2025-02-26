import { booksAddedToCart, getUsersCartID } from '../cart/GetCartData';
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
	const bookIDs = books.map((book) => {
		return book.id;
	});
	const reviews = await getBookReviews(bookIDs);

	if (reviews.length > 0 && typeof reviews !== 'string') {
		const reviewsGroupedByBookID = groupReviewsByBookId(reviews);
		books = matchReviewsToBooks(reviewsGroupedByBookID, books);
		return books;
	}

	return books;
};

/**
 * Adds wishlisted prop with value true to books that are wishlisted by the user.
 * @param books
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or fallback to original books if wishlisted logic fails.
 */
export const addUsersWishlistedBooks = async (books: Book[]) => {
	const userID = await getUserDataProperty('id');

	if (userID) {
		const usersWishlistedBooks = await getUsersWishlistedBooks(userID);

		if (usersWishlistedBooks && usersWishlistedBooks !== 'User not logged in.') {
			const updatedBooks = books.map((book) => {
				let isWishlisted = false;

				usersWishlistedBooks.filter((wishlistedBook) => {
					if (book.id === wishlistedBook.book_id) {
						isWishlisted = true;
						return;
					}
				});

				return {
					...book,
					wishlisted: isWishlisted,
				} as Book;
			});
			return updatedBooks;
		}
	}
	return books;
};

/**
 * Adds addedToCart prop with value true to books that are added to cart by the user.
 * @param books
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or fallback to original books if cart logic fails.
 */
export const addUsersCartItemsToBooks = async (books: Book[]) => {
	const userID = await getUserDataProperty('id');

	if (userID) {
		const cartID = await getUsersCartID(userID);

		if (cartID) {
			const cartItems = await booksAddedToCart(cartID);

			if (cartItems) {
				const updatedBooks = books.map((book) => {
					let addedToCart = false;

					cartItems.filter((cartItem) => {
						if (book.id === cartItem.book_id) {
							addedToCart = true;
							return;
						}
					});

					return {
						...book,
						addedToCart: addedToCart,
					} as Book;
				});
				return updatedBooks;
			}
		}
	}
	return books;
};
