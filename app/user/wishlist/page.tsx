import { OutputBooks } from '@/components/books/OutputBooks';
import { getAllBooks } from '@/data/books/GetBooksData';

export default async function UsersWishlist() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

	if (books) {
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-200 xl:max-w-250 place-self-center gap-y-5'>
				<OutputBooks
					books={books}
					type='wishlisted'
				/>
			</div>
		);
	}

	return <p>Cannot retrieve books.</p>;
}
