import { booksAddedToCart, getUsersCartID } from '../cart/GetCartData';
import { getUserDataProperty } from '../user/GetUserData';
import { getUsersWishlistedBooks } from './GetBooksData';
import { getBookReviews, groupReviewsByBookId, matchReviewsToBooks } from './GetReviewsData';

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

	if (typeof reviews === 'string') return reviews;
};

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
};

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
};
