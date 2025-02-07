import { createClient } from '@/utils/db/server';
import { OutputBook } from './OutputBook';
import { PostgrestResponse } from '@supabase/supabase-js';

export const Books = async ({ books }: { books: Book[] }) => {
	const getUserID = async () => {
		'use server';

		const supabase = await createClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		return user?.id;
	};

	const isWishlisted = async (userID: string | undefined) => {
		if (userID) {
			const supabase = await createClient();
			const { data, error }: PostgrestResponse<Wishlist> = await supabase
				.from('wishlist')
				.select('*')
				.eq('user_id', userID);

			return data ? data : undefined;
		}
		return 'User not logged in.';
	};

	const userID = await getUserID();
	const wishlistedBooks = await isWishlisted(userID);

	if (wishlistedBooks && wishlistedBooks !== 'User not logged in.') {
		const updatedBooks = books.map((book) => {
			let isWishlisted = false;

			wishlistedBooks.filter((wishlistedBook) => {
				if (book.id === wishlistedBook.book_id) {
					isWishlisted = true;
					return;
				}
			});

			return {
				...book,
				wishlisted: isWishlisted,
			} as BookWithWishlistedProp;
		});

		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
				{updatedBooks.map((book, index) => (
					<OutputBook
						book={book}
						index={index + 1}
						key={book.id}
					/>
				))}
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
			{books.map((book, index) => (
				<OutputBook
					book={book}
					index={index + 1}
					key={book.id}
				/>
			))}
		</div>
	);
};
