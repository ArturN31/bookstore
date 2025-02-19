import { BookCard } from '@/components/books/bookCard/BookCard';
import { RootLayout } from '@/components/layout/Layout';
import { getAllBooks } from '@/data/books/GetBooksData';
import { addReviewsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { createClient } from '@/utils/db/server';

export default async function UsersWishlist() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

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
				<RootLayout>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
						{booksWithUsersWishlist.map((book, index) => {
							if (book.wishlisted) {
								return (
									<BookCard
										loggedIn={loggedIn}
										book={book}
										key={book.id}
									/>
								);
							}
						})}
					</div>
				</RootLayout>
			);
		}
	}
}
