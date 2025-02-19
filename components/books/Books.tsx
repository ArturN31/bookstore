import { addReviewsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { createClient } from '@/utils/db/server';
import { BookCard } from './bookCard/BookCard';

export const Books = async ({ books }: { books: Book[] }) => {
	if (typeof books !== 'string' && books.length > 0) {
		const booksWithReviews = await addReviewsToBooks(books);
		if (booksWithReviews && typeof booksWithReviews !== 'string' && booksWithReviews.length > 0)
			books = booksWithReviews;

		//outputs books with wishlist
		const booksWithUsersWishlist = await addUsersWishlistedBooks(books);
		if (booksWithUsersWishlist) {
			const supabase = await createClient();
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			const loggedIn = user && !error ? true : false;

			return (
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
					{booksWithUsersWishlist.map((book) => (
						<BookCard
							loggedIn={loggedIn}
							book={book}
							key={book.id}
						/>
					))}
				</div>
			);
		}

		//outputs books without wishlist
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
				{books.map((book) => (
					<BookCard
						loggedIn={false}
						book={book}
						key={book.id}
					/>
				))}
			</div>
		);
	}
};
